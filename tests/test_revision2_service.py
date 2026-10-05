"""Actual HTTP, SQLite and model-double integration; every write is test-only."""
from __future__ import annotations

import http.client
import json
import threading

import pytest

from test_revision2 import ROOT, package, server_module


@pytest.fixture
def running_service(tmp_path, monkeypatch):
    module = server_module()
    repository = module.Repository(tmp_path / "workspace.sqlite3")
    monkeypatch.delenv("TRACA_MODEL_URL", raising=False)
    try:
        server = module.make_server(repository, 0, ROOT / "tests/fixtures/revision2-model-a1.json")
    except PermissionError:
        pytest.skip("Loopback bind denied by sandbox; rerun this test with localhost permission")
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    yield module, repository, server
    server.shutdown()
    server.server_close()
    worker.join(timeout=2)


def request(server, path, body=None, headers=None):
    client = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=5)
    client.request("POST" if body is not None else "GET", path, json.dumps(body) if body is not None else None, headers or {})
    response = client.getresponse()
    status, payload = response.status, response.read()
    client.close()
    return status, json.loads(payload)


def test_http_durable_recovery_conflict_and_historical_versions(running_service):
    module, repository, server = running_service
    status, session = request(server, "/api/session")
    assert status == 200 and session["storage"] == "sqlite"
    headers = {"Content-Type": "application/json", "X-TRACA-Token": session["token"]}
    original = package()
    assert request(server, "/api/workspaces", {"payload": original, "expected_revision": 0}, headers)[0] == 200
    updated = json.loads(json.dumps(original))
    updated["case"]["name"] = "Test revision two"
    assert request(server, "/api/workspaces", {"payload": updated, "expected_revision": 1}, headers)[1]["revision"] == 2
    status, conflict = request(server, "/api/workspaces", {"payload": original, "expected_revision": 1}, headers)
    assert status == 409 and conflict["incoming"] == original
    assert conflict["current"]["payload"] == updated
    uid = original["case"]["case_uid"]
    assert [v["revision"] for v in request(server, f"/api/versions/{uid}")[1]["versions"]] == [2, 1]
    assert request(server, f"/api/versions/{uid}/1")[1]["workspace"]["payload"] == original
    assert module.Repository(repository.path).get(uid)["payload"] == updated
    # New HTTP service and session, same SQLite file; original token is obsolete.
    restarted = module.make_server(module.Repository(repository.path), 0)
    worker = threading.Thread(target=restarted.serve_forever, daemon=True)
    worker.start()
    try:
        assert request(restarted, "/api/latest")[1]["workspace"]["payload"] == updated
        assert request(restarted, "/api/workspaces", {"payload": original, "expected_revision": 2}, headers)[0] == 403
        fresh = request(restarted, "/api/session")[1]
        headers["X-TRACA-Token"] = fresh["token"]
        assert request(restarted, "/api/workspaces", {"payload": original, "expected_revision": 2}, headers)[1]["revision"] == 3
    finally:
        restarted.shutdown(); restarted.server_close(); worker.join(timeout=2)


def test_http_origin_host_token_and_unreadable_payload_guards(running_service):
    _, _, server = running_service
    token = request(server, "/api/session")[1]["token"]
    body = {"payload": package(), "expected_revision": 0}
    headers = {"Content-Type": "application/json", "X-TRACA-Token": token}
    assert request(server, "/api/workspaces", body, {"Content-Type": "application/json"})[0] == 403
    assert request(server, "/api/workspaces", body, {**headers, "Origin": "https://other.example"})[0] == 403
    assert request(server, "/api/session", headers={"Host": "other.example"})[0] == 403
    assert request(server, "/api/session", headers={"Sec-Fetch-Site": "cross-site"})[0] == 403
    assert request(server, "/api/workspaces", {"payload": {}, "expected_revision": 0}, headers)[0] == 400
    assert request(server, "/api/workspaces", body, {**headers, "Content-Type": "text/plain"})[0] == 415


def test_http_model_double_is_explicit_and_has_source_evidence(running_service):
    _, _, server = running_service
    session = request(server, "/api/session")[1]
    headers = {"Content-Type": "application/json", "X-TRACA-Token": session["token"]}
    status, result = request(server, "/api/interpret", {"description": "El central passa al lateral. El lateral rep en carrera."}, headers)
    assert status == 200 and result["mode"] == session["model_mode"] == "test_double"
    assert result["proposal"]["fixture_only"] is True
    assert all(a["evidence_spans"] for a in result["proposal"]["actions"])
