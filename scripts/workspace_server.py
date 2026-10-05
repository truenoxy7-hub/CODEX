"""TRAÇA's loopback-only, dependency-free durable workspace service.

SQLite is the source of truth. Browser storage is only a pending-write cache.
Every successful write and every conflicting variant is retained for recovery.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MAX_BODY = 32 * 1024 * 1024
VERSIONS = {"0.2.0", "0.3.0", "0.4.0", "0.5.0", "0.6.0"}


def timestamp():
    return datetime.now(timezone.utc).isoformat()


class Repository:
    def __init__(self, path):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS workspaces (
                  uid TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS versions (
                  uid TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated TEXT NOT NULL,
                  PRIMARY KEY(uid, revision));
                CREATE TABLE IF NOT EXISTS conflicts (
                  id TEXT PRIMARY KEY, uid TEXT NOT NULL, expected INTEGER, server_revision INTEGER NOT NULL,
                  server_payload TEXT NOT NULL, incoming_payload TEXT NOT NULL, created TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS migrations (
                  digest TEXT PRIMARY KEY, original TEXT NOT NULL, imported_uid TEXT NOT NULL, created TEXT NOT NULL);
            """)

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    @staticmethod
    def record(row):
        return {"uid": row["uid"], "revision": row["revision"], "payload": json.loads(row["payload"]), "updated": row["updated"]} if row else None

    def get(self, uid=None):
        with self.connect() as db:
            row = db.execute("SELECT * FROM workspaces WHERE uid=?", (uid,)).fetchone() if uid else db.execute("SELECT * FROM workspaces ORDER BY updated DESC LIMIT 1").fetchone()
            return self.record(row)

    def list(self):
        with self.connect() as db:
            return [{"uid": r["uid"], "revision": r["revision"], "updated": r["updated"], "case": json.loads(r["payload"])["case"]} for r in db.execute("SELECT * FROM workspaces ORDER BY updated DESC")]

    def versions(self, uid):
        with self.connect() as db:
            return [{"revision": r["revision"], "updated": r["updated"]} for r in db.execute("SELECT revision,updated FROM versions WHERE uid=? ORDER BY revision DESC", (uid,))]

    def get_version(self, uid, revision):
        with self.connect() as db:
            return self.record(db.execute("SELECT * FROM versions WHERE uid=? AND revision=?", (uid, revision)).fetchone())

    @staticmethod
    def validate(payload):
        if not isinstance(payload, dict) or payload.get("format") != "TRACA_training_case" or payload.get("version") not in VERSIONS:
            raise ValueError("TRAINING_CASE_PACKAGE_INVALID")
        if not isinstance(payload.get("case"), dict) or not isinstance(payload.get("corrections"), list):
            raise ValueError("CASE_AND_CORRECTIONS_REQUIRED")
        uid = payload["case"].get("case_uid")
        if not isinstance(uid, str) or not uid or len(uid) > 200:
            raise ValueError("CASE_UID_REQUIRED")
        return uid

    def save(self, payload, expected):
        uid = self.validate(payload)
        if type(expected) is not int or expected < 0:
            raise ValueError("EXPECTED_REVISION_REQUIRED")
        encoded, updated = json.dumps(payload, ensure_ascii=False, allow_nan=False), timestamp()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT * FROM workspaces WHERE uid=?", (uid,)).fetchone()
            revision = row["revision"] if row else 0
            if revision != expected:
                conflict_id = secrets.token_hex(16)
                db.execute("INSERT INTO conflicts VALUES (?,?,?,?,?,?,?)", (conflict_id, uid, expected, revision, row["payload"] if row else "null", encoded, updated))
                return 409, {"status": "conflict", "conflict_id": conflict_id, "current": self.record(row), "incoming": payload}
            revision += 1
            db.execute("INSERT INTO versions VALUES (?,?,?,?)", (uid, revision, encoded, updated))
            db.execute("INSERT INTO workspaces VALUES (?,?,?,?) ON CONFLICT(uid) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated=excluded.updated", (uid, revision, encoded, updated))
            return 200, {"status": "saved", "uid": uid, "revision": revision, "updated": updated}

    def import_legacy(self, original):
        if not isinstance(original, dict): raise ValueError("TRAINING_CASE_PACKAGE_INVALID")
        serialized = json.dumps(original, sort_keys=True, ensure_ascii=False, allow_nan=False)
        digest = hashlib.sha256(serialized.encode()).hexdigest()
        payload = json.loads(serialized)
        payload.setdefault("case", {}).setdefault("case_uid", "LEGACY-" + digest[:24])
        uid = self.validate(payload)
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            previous = db.execute("SELECT * FROM migrations WHERE digest=?", (digest,)).fetchone()
            if previous:
                return {"status": "already_imported", "uid": previous["imported_uid"], "backup_digest": digest}
            # Never replace an existing durable case during migration.
            if db.execute("SELECT 1 FROM workspaces WHERE uid=?", (uid,)).fetchone():
                uid = "LEGACY-" + digest[:24]
                payload["case"]["case_uid"] = uid
            encoded, updated = json.dumps(payload, ensure_ascii=False), timestamp()
            db.execute("INSERT INTO migrations VALUES (?,?,?,?)", (digest, serialized, uid, updated))
            db.execute("INSERT OR IGNORE INTO versions VALUES (?,?,?,?)", (uid, 1, encoded, updated))
            db.execute("INSERT OR IGNORE INTO workspaces VALUES (?,?,?,?)", (uid, 1, encoded, updated))
            return {"status": "imported", "uid": uid, "backup_digest": digest}


def make_server(repository, port=8000, model_fixture=None):
    token = secrets.token_urlsafe(32)

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT / "interface"), **kwargs)

        def allowed(self, write=False):
            hosts = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
            host = self.headers.get("Host", "")
            if host not in hosts:
                self.reply(403, {"error": "LOOPBACK_HOST_REQUIRED"}); return False
            origin = self.headers.get("Origin")
            if origin and origin != "http://" + host or self.headers.get("Sec-Fetch-Site") == "cross-site":
                self.reply(403, {"error": "SAME_ORIGIN_REQUIRED"}); return False
            if write and not secrets.compare_digest(self.headers.get("X-TRACA-Token", ""), token):
                self.reply(403, {"error": "WRITE_TOKEN_REQUIRED"}); return False
            return True

        def reply(self, code, data):
            body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers(); self.wfile.write(body)

        def do_GET(self):
            if not self.allowed(): return
            # A saved desktop page may send a future cache date after a clock change.
            # Always reload local code; durable state is served separately from SQLite.
            if "If-Modified-Since" in self.headers: del self.headers["If-Modified-Since"]
            path = urlsplit(self.path).path
            if path == "/api/session": return self.reply(200, {"token": token, "storage": "sqlite", "version": "0.6.0", "model_configured": bool(model_fixture or os.environ.get("TRACA_MODEL_URL")), "model_mode": "test_double" if model_fixture else "configured"})
            if path == "/api/latest": return self.reply(200, {"workspace": repository.get()})
            if path == "/api/workspaces": return self.reply(200, {"workspaces": repository.list()})
            if path.startswith("/api/versions/"):
                parts = path[len("/api/versions/"):].split("/")
                uid = unquote(parts[0])
                if len(parts) == 1: return self.reply(200, {"versions": repository.versions(uid)})
                if len(parts) == 2 and parts[1].isdigit():
                    record = repository.get_version(uid, int(parts[1]))
                    return self.reply(200 if record else 404, {"workspace": record})
                return self.reply(400, {"error": "VERSION_PATH_INVALID"})
            if path.startswith("/api/workspaces/"):
                record = repository.get(unquote(path[len("/api/workspaces/"):]))
                return self.reply(200 if record else 404, {"workspace": record})
            if path == "/api/knowledge":
                return self.reply(200, json.loads((ROOT / "sources/revision2/TRACA_Base_coneixement_grafics_v0_1.json").read_text()))
            if path.startswith("/api/"): return self.reply(404, {"error": "NOT_FOUND"})
            # Static files stay inside interface; never follow symlinks out of it.
            requested = Path(self.translate_path(path)).resolve()
            if not requested.is_relative_to((ROOT / "interface").resolve()): return self.reply(403, {"error": "PATH_FORBIDDEN"})
            super().do_GET()

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def do_POST(self):
            if not self.allowed(write=True): return
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= MAX_BODY: return self.reply(413, {"error": "REQUEST_TOO_LARGE"})
                if self.headers.get("Content-Type", "").split(";")[0] != "application/json": return self.reply(415, {"error": "JSON_REQUIRED"})
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict): return self.reply(400, {"error": "JSON_OBJECT_REQUIRED"})
                if self.path == "/api/workspaces":
                    code, result = repository.save(body["payload"], body.get("expected_revision"))
                    return self.reply(code, result)
                if self.path == "/api/import": return self.reply(200, repository.import_legacy(body["payload"]))
                if self.path == "/api/interpret":
                    if model_fixture:
                        return self.reply(200, {"mode": "test_double", "proposal": json.loads(Path(model_fixture).read_text())})
                    endpoint = os.environ.get("TRACA_MODEL_URL")
                    if not endpoint: return self.reply(503, {"error": "MODEL_NOT_CONFIGURED_MANUAL_EDITOR_AVAILABLE"})
                    parsed = urlsplit(endpoint)
                    if parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}):
                        return self.reply(503, {"error": "MODEL_ENDPOINT_MUST_BE_HTTPS_OR_LOOPBACK"})
                    headers = {"Content-Type": "application/json"}
                    if os.environ.get("TRACA_MODEL_API_KEY"): headers["Authorization"] = "Bearer " + os.environ["TRACA_MODEL_API_KEY"]
                    request = Request(endpoint, data=json.dumps({"task": "traca_tactical_ir_proposal", "description": str(body.get("description", ""))[:30000], "model": os.environ.get("TRACA_MODEL_NAME"), "schema": {"participants": "array", "actions": "array with evidence_spans", "unresolved": "array"}}).encode(), headers=headers, method="POST")
                    try:
                        with urlopen(request, timeout=30) as response:
                            proposal = json.loads(response.read(MAX_BODY))
                        return self.reply(200, {"mode": "configured", "proposal": proposal})
                    except Exception:
                        return self.reply(502, {"error": "MODEL_PROVIDER_FAILED"})
                return self.reply(404, {"error": "NOT_FOUND"})
            except (ValueError, KeyError, TypeError) as error:
                return self.reply(400, {"error": str(error)})
            except sqlite3.Error:
                return self.reply(503, {"error": "DURABLE_STORAGE_UNAVAILABLE"})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--data-dir", type=Path, default=ROOT / ".traca-data")
    parser.add_argument("--model-fixture", type=Path, help="Explicit test double; never presented as a real model")
    args = parser.parse_args()
    server = make_server(Repository(args.data_dir / "workspace.sqlite3"), args.port, args.model_fixture)
    print(f"TRAÇA: http://127.0.0.1:{server.server_port} · SQLite: {args.data_dir.resolve()}", flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()


if __name__ == "__main__":
    main()
