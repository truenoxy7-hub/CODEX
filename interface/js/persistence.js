(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_PERSISTENCE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const STORAGE_KEY = "traca.workspace.v0.2";

  function load(storage) {
    try {
      const raw = (storage || window.localStorage).getItem(STORAGE_KEY);
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
      (storage || window.localStorage).removeItem(STORAGE_KEY);
      return true;
    } catch (_error) {
      return false;
    }
  }

  return { STORAGE_KEY, load, save, clear };
});
