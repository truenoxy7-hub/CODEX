(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_PROMOTION = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const TYPES = ["semantic_rule_candidate", "spatial_rule_candidate", "geometry_rule_candidate", "visual_rule_candidate", "tactical_pattern_candidate", "vocabulary_concept_candidate"];
  const SCOPES = ["THIS_CASE", "EXERCISE_FAMILY", "CONCEPT", "TACTICAL_CONTEXT", "GLOBAL_VISUAL_GRAMMAR"];

  function build(input, corrections, timestamp, id) {
    if (!TYPES.includes(input.type)) throw new Error("PROMOTION_TYPE_INVALID");
    if (!SCOPES.includes(input.scope)) throw new Error("PROMOTION_SCOPE_INVALID");
    if (!String(input.title || "").trim() || !String(input.definition || "").trim()) throw new Error("PROMOTION_TITLE_DEFINITION_REQUIRED");
    const selected = new Set(input.correction_refs || []);
    const sourceCorrections = (corrections || []).filter((event) => selected.has(event.id));
    if (selected.size !== sourceCorrections.length) throw new Error("PROMOTION_CORRECTION_REF_INVALID");
    return {
      id,
      type: input.type,
      status: "candidate",
      title: input.title.trim(),
      definition: input.definition.trim(),
      reason: String(input.reason || "").trim(),
      scope: input.scope,
      scope_ref: String(input.scope_ref || "").trim() || null,
      examples: Array.isArray(input.examples) ? input.examples.slice() : String(input.examples || "").split("\n").map((item) => item.trim()).filter(Boolean),
      correction_refs: sourceCorrections.map((event) => event.id),
      source_corrections: utils.deepClone(sourceCorrections),
      created_at: timestamp,
      canonical_promotion: false
    };
  }

  function libraryKey(type) {
    return {
      semantic_rule_candidate: "semantic_rule_candidates",
      spatial_rule_candidate: "spatial_rule_candidates",
      geometry_rule_candidate: "geometry_rule_candidates",
      visual_rule_candidate: "visual_rule_candidates",
      tactical_pattern_candidate: "tactical_pattern_candidates",
      vocabulary_concept_candidate: "vocabulary_concept_candidates"
    }[type];
  }

  return { TYPES, SCOPES, build, libraryKey };
});
