(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_CHANGE_EXPLAINER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function printable(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function subject(target) {
    const parts = String(target.ref || "").split(":");
    return parts.slice(2).join(":") || "element";
  }

  function explain(input) {
    const id = subject(input.target || {});
    const property = input.target && input.target.property || "valor";
    const before = printable(input.before);
    const after = printable(input.after);
    if (input.operation === "move") return `${id} s’ha mogut de ${before} a ${after}.`;
    if (input.operation === "move_vertex") {
      const index = String(property).split(/[./]/).pop();
      return `S’ha modificat el punt ${Number(index) + 1} de la trajectòria ${id}: ${before} → ${after}.`;
    }
    if (input.target && input.target.layer === "semantic") return `La interpretació de ${id} ha canviat de ${before} a ${after}.`;
    if (input.target && input.target.layer === "spatial") return `La relació espacial de ${id} ha canviat de ${before} a ${after}.`;
    if (input.target && input.target.layer === "visual") return `La convenció visual ${id}.${property} ha canviat de ${before} a ${after}.`;
    return `${id}.${property} ha canviat de ${before} a ${after}.`;
  }

  function humanSummary(event) {
    return event.coach_explanation
      ? `${event.machine_explanation} Motiu del tècnic: ${event.coach_explanation}`
      : event.machine_explanation;
  }

  return { explain, humanSummary };
});
