(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_KNOWLEDGE_LIBRARY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function countSections(library, grammar) {
    return {
      validated_cases: (library.validated_cases || []).length,
      pattern_candidates: (library.pattern_candidates || []).length,
      semantic_rules: (library.semantic_rules || []).length,
      spatial_rules: (library.spatial_rules || []).length,
      geometry_rules: (library.geometry_rules || []).length,
      visual_dictionary: Object.keys((grammar && grammar.paths) || {}).length + Object.keys((grammar && grammar.entities) || {}).length,
      general_rule_candidates: (library.general_rule_candidates || []).length
    };
  }

  function structuredLibrary(snapshot) {
    return {
      sections: countSections(snapshot.knowledgeLibrary, snapshot.workingVisualGrammar),
      validated_cases: utils.deepClone(snapshot.knowledgeLibrary.validated_cases),
      candidates: {
        patterns: utils.deepClone(snapshot.knowledgeLibrary.pattern_candidates),
        general_rules: utils.deepClone(snapshot.knowledgeLibrary.general_rule_candidates)
      },
      visual_dictionary: utils.deepClone(snapshot.workingVisualGrammar)
    };
  }

  return { countSections, structuredLibrary };
});
