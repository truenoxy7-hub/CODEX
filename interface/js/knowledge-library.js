(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_KNOWLEDGE_LIBRARY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const SECTIONS = [
    ["validated_cases", "Casos guardats"],
    ["tactical_pattern_candidates", "Patrons tàctics candidats"],
    ["semantic_rule_candidates", "Regles semàntiques candidates"],
    ["spatial_rule_candidates", "Regles espacials candidates"],
    ["geometry_rule_candidates", "Regles geomètriques candidates"],
    ["visual_rule_candidates", "Regles visuals candidates"],
    ["vocabulary_concept_candidates", "Conceptes de vocabulari candidats"],
    ["validated_visual_dictionary", "Diccionari visual validat"],
    ["unresolved_knowledge", "Coneixement no resolt"]
  ];

  function countSections(library) {
    return Object.fromEntries(SECTIONS.map(([key]) => [key, (library[key] || []).length]));
  }

  function inspectableItems(library) {
    return SECTIONS.map(([key, label]) => ({ key, label, items: utils.deepClone(library[key] || []) }));
  }

  function structuredLibrary(snapshot) {
    return { sections: countSections(snapshot.knowledgeLibrary), groups: inspectableItems(snapshot.knowledgeLibrary) };
  }

  return { SECTIONS, countSections, inspectableItems, structuredLibrary };
});
