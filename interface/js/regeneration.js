(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_REGENERATION = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const copy = (v) => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // Three-way merge: untouched generated fields may change; coach edits never disappear silently.
  function merge(base, local, incoming, choices) {
    const conflicts = [];
    function visit(b, l, n, path) {
      // Validation is recomputed from the merged board, never a coach-editable field.
      if (path.split("/").at(-1) === "validation") return copy(n);
      if (same(b, l)) return copy(n);
      if (same(b, n) || same(l, n)) return copy(l);
      if (b && l && n && typeof b === "object" && typeof l === "object" && typeof n === "object") {
        if (Array.isArray(b) && Array.isArray(l) && Array.isArray(n) && [...b, ...l, ...n].every((v) => v && typeof v === "object" && v.id)) {
          const ids = [...new Set([...n, ...l, ...b].map((v) => v.id))];
          return ids.map((id) => visit(b.find((v) => v.id === id), l.find((v) => v.id === id), n.find((v) => v.id === id), `${path}/${id}`)).filter((v) => v !== undefined);
        }
        if (!Array.isArray(b) && !Array.isArray(l) && !Array.isArray(n)) {
          const result = {};
          [...new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(n)])].forEach((key) => { const value = visit(b[key], l[key], n[key], `${path}/${key}`); if (value !== undefined) result[key] = value; });
          return result;
        }
      }
      const decision = choices && choices[path];
      conflicts.push({ path, before: copy(b), correction: copy(l), proposal: copy(n), decision: decision || "defer" });
      return copy(decision === "new" ? n : l);
    }
    return { geometry: visit(base, local, incoming, "geometry"), conflicts };
  }
  return { merge };
});
