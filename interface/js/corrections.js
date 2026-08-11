(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const explainer = isNode ? require("./change-explainer.js") : root.TRACA_CHANGE_EXPLAINER;
  const api = factory(utils, explainer);
  if (isNode) module.exports = api;
  root.TRACA_CORRECTIONS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, explainer) {
  "use strict";

  const LAYERS = ["semantic", "spatial", "geometry", "visual"];
  const SCOPES = ["case", "pattern_candidate", "general_rule_candidate"];
  const STATUSES = ["draft", "validated"];

  function parseRef(ref) {
    const parts = String(ref || "").split(":");
    if (parts.length < 3) throw new Error("CORRECTION_TARGET_REF_INVALID");
    return { layer: parts[0], collection: parts[1], id: parts.slice(2).join(":") };
  }

  function collectionName(name) {
    return {
      entity: "entities",
      common_path: "common_paths",
      alternative: "alternatives",
      branch: "branches",
      zone: "zones",
      space: "spaces",
      primitive: "paths"
    }[name] || name;
  }

  function findGeometryTarget(geometry, collection, id) {
    const key = collectionName(collection);
    if (key === "alternatives") {
      for (const branch of geometry.branches || []) {
        const found = (branch.alternatives || []).find((item) => item.id === id);
        if (found) return found;
      }
      return null;
    }
    const candidates = geometry[key];
    return Array.isArray(candidates) ? candidates.find((item) => item.id === id) || null : null;
  }

  function findVisualTarget(visualGrammar, collection, id) {
    const key = collectionName(collection);
    if (key === "paths") return visualGrammar.paths[id] || null;
    if (key === "entities") return visualGrammar.entities[id] || null;
    if (key === "overlays") return visualGrammar.overlays[id] || null;
    return null;
  }

  function targetObject(geometry, visualGrammar, target) {
    const parsed = parseRef(target.ref);
    if (parsed.layer === "geometry") return findGeometryTarget(geometry, parsed.collection, parsed.id);
    if (parsed.layer === "visual") return findVisualTarget(visualGrammar, parsed.collection, parsed.id);
    return null;
  }

  function readTarget(geometry, visualGrammar, target) {
    const object = targetObject(geometry, visualGrammar, target);
    return object ? utils.deepClone(utils.readPath(object, target.property)) : undefined;
  }

  function createEvent(input) {
    const event = {
      id: String(input.id || ""),
      timestamp: String(input.timestamp || ""),
      target: utils.deepClone(input.target || {}),
      operation: input.operation || "replace",
      before: utils.deepClone(input.before),
      after: utils.deepClone(input.after),
      author: input.author || "coach",
      scope: input.scope || "case",
      status: input.status || "draft",
      reason: String(input.reason || "Correcció gràfica del tècnic"),
      source_refs: Array.isArray(input.source_refs) ? input.source_refs.slice() : []
    };
    if (!event.id || !event.timestamp) throw new Error("CORRECTION_ID_AND_TIMESTAMP_REQUIRED");
    if (!LAYERS.includes(event.target.layer)) throw new Error("CORRECTION_LAYER_INVALID");
    if (!event.target.ref || !event.target.property) throw new Error("CORRECTION_TARGET_REQUIRED");
    if (!SCOPES.includes(event.scope)) throw new Error("CORRECTION_SCOPE_INVALID");
    if (!STATUSES.includes(event.status)) throw new Error("CORRECTION_STATUS_INVALID");
    if (utils.sameValue(event.before, event.after)) throw new Error("CORRECTION_NO_CHANGE");
    event.machine_diff = {
      operation: event.operation,
      property: event.target.property,
      before: utils.deepClone(event.before),
      after: utils.deepClone(event.after)
    };
    event.machine_explanation = input.machine_explanation || explainer.explain(event);
    event.coach_explanation = String(input.coach_explanation || input.reason || "").trim();
    event.concept_refs = Array.isArray(input.concept_refs) ? input.concept_refs.slice() : [];
    event.context_refs = Array.isArray(input.context_refs) ? input.context_refs.slice() : [];
    event.correction_type = input.correction_type || `${event.target.layer}.${event.operation}`;
    event.target_role = input.target_role || null;
    event.target_relation = input.target_relation || null;
    return event;
  }

  function applyEvent(geometry, visualGrammar, event) {
    if (event.target.layer === "semantic" || event.target.layer === "spatial") {
      return { geometry, visualGrammar, applied: false };
    }
    const target = targetObject(geometry, visualGrammar, event.target);
    if (!target) throw new Error(`CORRECTION_TARGET_NOT_FOUND:${event.target.ref}`);
    utils.writePath(target, event.target.property, event.after);
    return { geometry, visualGrammar, applied: true };
  }

  return { LAYERS, SCOPES, STATUSES, parseRef, readTarget, createEvent, applyEvent };
});
