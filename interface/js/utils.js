(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_UTILS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function deepClone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
    return value;
  }

  function sameValue(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function pathParts(path) {
    if (Array.isArray(path)) return path.map(String);
    return String(path || "").split(/[./]/).filter(Boolean);
  }

  function readPath(target, path) {
    return pathParts(path).reduce((cursor, part) => (
      cursor === undefined || cursor === null ? undefined : cursor[part]
    ), target);
  }

  function writePath(target, path, value) {
    const parts = pathParts(path);
    if (!parts.length) throw new Error("CORRECTION_PROPERTY_REQUIRED");
    let cursor = target;
    parts.slice(0, -1).forEach((part) => {
      if (cursor[part] === undefined) cursor[part] = /^\d+$/.test(part) ? [] : {};
      cursor = cursor[part];
    });
    cursor[parts[parts.length - 1]] = deepClone(value);
    return target;
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slug(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function fingerprint(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function durableId(prefix) {
    const cryptoObject = typeof globalThis !== "undefined" && globalThis.crypto;
    const token = cryptoObject && typeof cryptoObject.randomUUID === "function"
      ? cryptoObject.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix || "ID"}-${token}`;
  }

  return { deepClone, deepFreeze, sameValue, readPath, writePath, escapeHtml, slug, fingerprint, durableId };
});
