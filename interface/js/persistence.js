(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_PERSISTENCE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const STORAGE_KEY = "traca.workspace.v0.4";
  const LEGACY_KEYS = ["traca.workspace.v0.3", "traca.workspace.v0.2"];
  const PENDING_KEY = "traca.pending.v0.6";

  function load(storage) {
    try {
      const target = storage || window.localStorage;
      const key = [STORAGE_KEY, ...LEGACY_KEYS].find((candidate) => target.getItem(candidate));
      const raw = key ? target.getItem(key) : null;
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function save(payload, storage) {
    try {
      (storage || window.localStorage).setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function clear(storage) {
    try {
      const target = storage || window.localStorage;
      [STORAGE_KEY, ...LEGACY_KEYS].forEach((key) => target.removeItem(key));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function createClient(options) {
    const configuration = options || {}, storage = configuration.storage || window.localStorage;
    const request = configuration.fetch || window.fetch.bind(window);
    const change = configuration.onStatus || (() => {});
    let token = null, running = false, stopped = false, timer = null, conflict = null;
    let revisions = {}, queue = {}, last = {};
    try { const cache = JSON.parse(storage.getItem(PENDING_KEY) || "{}"); queue = cache.queue || {}; revisions = cache.revisions || {}; } catch (_error) { change({ status: "error", message: "Còpia pendent no llegible; exporta el cas abans de tancar." }); }
    const comparable = (payload) => JSON.stringify({ ...payload, metadata: null });
    function cache() {
      try { storage.setItem(PENDING_KEY, JSON.stringify({ queue, revisions })); return true; }
      catch (_error) { change({ status: "error", message: "No hi ha espai per a la còpia pendent. Exporta el paquet." }); return false; }
    }
    async function api(path, body) {
      const response = await request(path, body ? { method: "POST", headers: { "Content-Type": "application/json", "X-TRACA-Token": token }, body: JSON.stringify(body) } : { cache: "no-store" });
      const result = await response.json();
      if (response.status === 409) return result;
      if (!response.ok) throw Error(result.error || "SERVICE_UNAVAILABLE");
      return result;
    }
    async function connect() { const session = await api("/api/session"); token = session.token; }
    async function initialize() {
      try {
        await connect();
        const legacy = load(storage);
        if (legacy && legacy.version !== "0.6.0") {
          // The service backs up the exact original before an idempotent import.
          const imported = await api("/api/import", { payload: legacy });
          storage.setItem(`traca.migration.${imported.backup_digest}`, imported.uid);
        }
        const result = await api("/api/latest");
        const pending = Object.values(queue).at(-1);
        if (pending) { change({ status: "pending", message: "Canvis pendents de sincronitzar" }); return pending; }
        if (result.workspace) {
          const record = result.workspace; revisions[record.uid] = record.revision; last[record.uid] = comparable(record.payload); cache();
          change({ status: "saved", message: "Guardat al servei local" }); return record.payload;
        }
        change({ status: "saved", message: "Servei local preparat" }); return null;
      } catch (_error) { change({ status: "offline", message: "Servei no disponible · còpia pendent al navegador" }); return Object.values(queue).at(-1) || load(storage); }
    }
    function schedule(payload) {
      const uid = payload.case.case_uid;
      if (last[uid] === comparable(payload) || queue[uid] && comparable(queue[uid]) === comparable(payload)) return;
      queue[uid] = payload; cache(); change({ status: "pending", message: "Pendent de guardar" });
      clearTimeout(timer); timer = setTimeout(flush, configuration.delay === undefined ? 650 : configuration.delay);
    }
    async function flush() {
      clearTimeout(timer);
      if (running || stopped || conflict) return false;
      running = true;
      try {
        if (!token) await connect();
        for (const uid of Object.keys(queue)) {
          const payload = queue[uid]; if (!payload) continue;
          change({ status: "saving", message: "Guardant…" });
          let result = await api("/api/workspaces", { payload, expected_revision: revisions[uid] || 0 });
          if (result.status === "conflict") {
            conflict = result; stopped = true; change({ status: "conflict", message: "Conflicte: les dues versions s’han conservat", conflict }); return false;
          }
          revisions[uid] = result.revision; last[uid] = comparable(payload);
          if (queue[uid] === payload) delete queue[uid]; cache();
        }
        change({ status: Object.keys(queue).length ? "pending" : "saved", message: Object.keys(queue).length ? "Pendent de guardar" : "Guardat al servei local" });
        return !Object.keys(queue).length;
      } catch (_error) {
        token = null; const cached = cache();
        if (cached) change({ status: "offline", message: "Sense connexió al servei · canvis pendents al navegador" });
        return false;
      } finally { running = false; if (Object.keys(queue).length && token && !stopped) timer = setTimeout(flush, 500); }
    }
    async function resolveConflict(choice) {
      if (!conflict) return null;
      const current = conflict.current, uid = conflict.incoming.case.case_uid;
      // A later local edit wins over the snapshot sent before the conflict response.
      const local = queue[uid] || conflict.incoming;
      let payload = choice === "server" ? current.payload : local;
      revisions[uid] = current ? current.revision : 0;
      if (choice === "copy") { payload = JSON.parse(JSON.stringify(local)); payload.case.case_uid = `CASE-${crypto.randomUUID()}`; payload.case.name += " · còpia en conflicte"; }
      delete queue[uid]; conflict = null; stopped = false; cache();
      if (choice !== "server") { schedule(payload); await flush(); } else { last[uid] = comparable(payload); change({ status: "saved", message: "Versió del servei recuperada; variant local conservada al registre de conflictes" }); }
      return payload;
    }
    async function list() { return (await api("/api/workspaces")).workspaces; }
    async function open(uid) { const { workspace } = await api(`/api/workspaces/${encodeURIComponent(uid)}`); revisions[uid] = workspace.revision; last[uid] = comparable(workspace.payload); cache(); return workspace.payload; }
    async function versions(uid) { return (await api(`/api/versions/${encodeURIComponent(uid)}`)).versions; }
    async function openVersion(uid, revision) {
      await open(uid); // Future saves use the current durable revision, not the historical one.
      const { workspace } = await api(`/api/versions/${encodeURIComponent(uid)}/${revision}`);
      return workspace.payload;
    }
    async function interpret(description) { if (!token) await connect(); return api("/api/interpret", { description }); }
    return { initialize, schedule, flush, resolveConflict, list, open, versions, openVersion, interpret, get pending() { return Object.keys(queue).length; } };
  }
  return { STORAGE_KEY, LEGACY_KEYS, PENDING_KEY, load, save, clear, createClient };
});
