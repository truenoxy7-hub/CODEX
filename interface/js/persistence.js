(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_PERSISTENCE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const STORAGE_KEY = "traca.workspace.v0.4";
  const LEGACY_KEYS = ["traca.workspace.v0.3", "traca.workspace.v0.2"];

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

  return { STORAGE_KEY, LEGACY_KEYS, load, save, clear };
});
