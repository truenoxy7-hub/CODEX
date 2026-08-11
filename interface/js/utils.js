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

  return { deepClone, deepFreeze, sameValue, readPath, writePath, escapeHtml, slug };
});
