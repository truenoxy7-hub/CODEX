(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (isNode) module.exports = api;
  root.TRACA_INTERPRETATION = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function includesAlias(text, alias) {
    const normalizedAlias = normalize(alias);
    if (/^[a-z0-9]+$/.test(normalizedAlias)) {
      return new RegExp(`(^|[^a-z0-9])${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text);
    }
    return text.includes(normalizedAlias);
  }

  function matchLocalKnowledge(description, knowledge) {
    const text = normalize(description);
    const concepts = [];
    (knowledge.concepts || []).forEach((concept) => {
      const matched = (concept.aliases || []).find((alias) => includesAlias(text, alias));
      if (!matched) return;
      concepts.push({
        id: concept.id,
        label: concept.label,
        category: concept.category,
        knowledge_state: "provisional",
        match_status: "provisional_match",
        source: "local_rule_provider",
        confidence: "explicit_term",
        evidence: matched,
        canonical_concept_ref: concept.canonical_ref,
        reason: `Coincidència explícita amb «${matched}».`
      });
    });
    const unknownConcepts = [];
    (knowledge.candidate_phrases || []).forEach((candidate, index) => {
      const matched = (candidate.aliases || []).find((alias) => includesAlias(text, alias));
      if (!matched) return;
      unknownConcepts.push({
        id: `UNKNOWN-${String(index + 1).padStart(3, "0")}`,
        label: candidate.label,
        knowledge_state: "unknown",
        source: "coach_text",
        evidence: matched,
        definition: "",
        reason: candidate.reason
      });
    });
    return { concepts, unknownConcepts };
  }

  function suggestedTags(description, concepts) {
    const priorities = { action: 0, tactical_context: 1, space: 2, participant_role: 3, defensive_role: 3, material: 4 };
    const ordered = (concepts || []).slice().sort((left, right) => (priorities[left.category] ?? 9) - (priorities[right.category] ?? 9));
    const tags = [];
    ordered.forEach((concept) => {
      const label = String(concept.label || "").trim();
      if (label && !tags.includes(label)) tags.push(label);
    });
    const explicitRelations = normalize(description).match(/\b\d+\s*(?:x|v)\s*\d+\b/g) || [];
    explicitRelations.map((tag) => tag.replace(/\s+/g, "").replace("v", "x")).reverse().forEach((tag) => {
      if (!tags.includes(tag)) tags.unshift(tag);
    });
    return tags.slice(0, 8);
  }

  function canonicalCaseProvider(currentCase, canonicalCases) {
    const match = (canonicalCases || []).find((item) => item.id === currentCase.id && currentCase.case_type === "canonical_specimen");
    if (!match) return null;
    return {
      provider: "canonical_case_provider",
      status: "validated",
      concepts: utils.deepClone(match.canonical_concepts || []),
      suggested_tags: suggestedTags(currentCase.description, match.canonical_concepts || []),
      unknown_concepts: [],
      unresolved: [],
      notes: ["Interpretació recuperada d’un cas canònic validat."]
    };
  }

  function localRuleProvider(currentCase, knowledge) {
    const matched = matchLocalKnowledge(currentCase.description, knowledge);
    const unresolved = [];
    if (!matched.concepts.length) unresolved.push({ id: "UNRESOLVED-001", label: "No s’ha reconegut cap concepte canònic.", knowledge_state: "unresolved" });
    unresolved.push({ id: "UNRESOLVED-SEQUENCE", label: "Seqüència temporal completa pendent de confirmació.", knowledge_state: "unresolved" });
    return {
      provider: "local_rule_provider",
      status: "provisional",
      concepts: matched.concepts,
      suggested_tags: suggestedTags(currentCase.description, matched.concepts),
      unknown_concepts: matched.unknownConcepts,
      unresolved,
      notes: ["Coincidències lèxiques locals; no són una interpretació tàctica validada."]
    };
  }

  function interpret(currentCase, options) {
    const canonical = canonicalCaseProvider(currentCase, options.canonicalCases);
    if (canonical) return canonical;
    const partial = localRuleProvider(currentCase, options.knowledge || { concepts: [] });
    return {
      ...partial,
      providers: ["local_rule_provider", "manual_builder_provider"],
      status: partial.concepts.length || partial.unknown_concepts.length ? "provisional" : "unresolved"
    };
  }

  return { normalize, matchLocalKnowledge, suggestedTags, canonicalCaseProvider, localRuleProvider, interpret };
});
