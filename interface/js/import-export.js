(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_IMPORT_EXPORT = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function exportPackage(snapshot, clock) {
    return {
      format: "TRACA_training_case",
      version: "0.3.0",
      metadata: { exported_at: (clock || (() => new Date().toISOString()))(), application: "TRAÇA universal workspace", canonical_promotion: false },
      case: utils.deepClone(snapshot.currentCase),
      description: snapshot.currentCase.description,
      source_refs: utils.deepClone(snapshot.currentCase.source_refs || []),
      interpretation: utils.deepClone(snapshot.interpretation),
      semantic_model: utils.deepClone(snapshot.semanticModel),
      spatial_model: utils.deepClone(snapshot.spatialModel),
      geometry_state: utils.deepClone(snapshot.geometryState),
      generated_geometry: utils.deepClone(snapshot.generatedGeometry),
      coach_reference_geometry: utils.deepClone(snapshot.coachReferenceGeometry),
      working_geometry: utils.deepClone(snapshot.workingGeometry),
      base_visual_grammar: utils.deepClone(snapshot.baseVisualGrammar),
      case_visual_overrides: utils.deepClone(snapshot.caseVisualOverrides),
      corrections: utils.deepClone(snapshot.corrections),
      coach_observations: utils.deepClone(snapshot.coachObservations),
      validated_geometry: utils.deepClone(snapshot.validatedGeometry),
      validated_visual_grammar: utils.deepClone(snapshot.validatedVisualGrammar),
      selected_alternatives: utils.deepClone(snapshot.selectedAlternatives),
      validation: utils.deepClone(snapshot.validation),
      knowledge_library: utils.deepClone(snapshot.knowledgeLibrary)
    };
  }

  function validatePackage(payload) {
    const errors = [];
    if (!payload || payload.format !== "TRACA_training_case") errors.push("format");
    if (!payload || !["0.2.0", "0.3.0"].includes(payload.version)) errors.push("version");
    ["case", "corrections", "validation", "knowledge_library"].forEach((key) => {
      if (!payload || payload[key] === undefined || payload[key] === null) errors.push(key);
    });
    if (payload && !Array.isArray(payload.corrections)) errors.push("corrections_type");
    if (payload && payload.version === "0.3.0" && payload.generated_geometry && payload.geometry_state && payload.geometry_state.status === "coach_reference") errors.push("generated_geometry_conflicts_with_coach_reference");
    return { valid: errors.length === 0, errors };
  }

  function parsePackage(text) {
    let payload;
    try { payload = JSON.parse(text); } catch (_error) { throw new Error("TRAINING_CASE_JSON_INVALID"); }
    const validation = validatePackage(payload);
    if (!validation.valid) throw new Error(`TRAINING_CASE_PACKAGE_INVALID:${validation.errors.join(",")}`);
    return payload;
  }

  function downloadPackage(snapshot, documentObject) {
    const payload = exportPackage(snapshot);
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = (documentObject || document).createElement("a");
    anchor.href = url;
    anchor.download = `${snapshot.currentCase.id.toLowerCase()}-training-case.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return { exportPackage, validatePackage, parsePackage, downloadPackage };
});
