(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const interpretation = isNode ? require("./interpretation-provider.js") : root.TRACA_INTERPRETATION;
  const api = factory(utils, interpretation);
  if (isNode) module.exports = api;
  root.TRACA_KNOWLEDGE_RESOLVER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, interpretationApi) {
  "use strict";

  const AUTHORITY = {
    coach_validated: 0,
    graphic_legend: 1,
    canonical_validated: 2,
    semantic_validated: 3,
    spatial_validated: 4,
    repeated_observation: 5,
    candidate: 6,
    inference: 7,
    provisional: 8
  };

  function authorityRank(value) {
    return AUTHORITY[value] === undefined ? 99 : AUTHORITY[value];
  }

  function matches(text, aliases) {
    const normalized = interpretationApi.normalize(text);
    return (aliases || []).find((alias) => interpretationApi.normalize(alias) && normalized.includes(interpretationApi.normalize(alias))) || null;
  }

  function activeVisualRules(dictionary) {
    const evidence = new Set((dictionary && dictionary.evidence || []).map((item) => item.id));
    return (dictionary && dictionary.entries || []).filter((entry) => {
      return entry.status === "validated"
        && authorityRank(entry.authority) <= authorityRank("spatial_validated")
        && (entry.evidence_refs || []).length
        && entry.evidence_refs.every((ref) => evidence.has(ref));
    }).map((entry) => utils.deepClone(entry));
  }

  function localValidatedMatches(description, library) {
    const evidence = new Set(((library && library.evidence_records) || []).map((item) => item.id));
    return ((library && library.coach_validated_local_knowledge) || []).flatMap((entry) => {
      const matched = matches(description, entry.aliases && entry.aliases.length ? entry.aliases : [entry.label, entry.definition]);
      const evidenceRefs = entry.evidence_refs || [];
      if (!matched || entry.status !== "validated" || entry.authority !== "coach_validated" || !evidenceRefs.length || !evidenceRefs.every((ref) => evidence.has(ref))) return [];
      return [{
        id: entry.semantic_ref || entry.id,
        label: entry.label,
        category: entry.category || "action",
        knowledge_state: "validated",
        match_status: "coach_validated_match",
        source: "coach_validated_local_knowledge",
        authority: "coach_validated",
        confidence: "explicit_coach_rule",
        evidence: matched,
        canonical_concept_ref: entry.semantic_ref || null,
        evidence_refs: utils.deepClone(entry.evidence_refs || []),
        reason: `Criteri reutilitzable validat per l’entrenador: «${entry.label}».`
      }];
    });
  }

  function candidateMatches(description, library) {
    const candidates = Object.entries(library || {})
      .filter(([key]) => key.endsWith("_candidates"))
      .flatMap(([, entries]) => entries || []);
    return candidates.flatMap((entry) => {
      const matched = matches(description, entry.aliases && entry.aliases.length ? entry.aliases : [entry.title]);
      if (!matched) return [];
      return [{
        id: entry.id,
        label: entry.title || entry.id,
        knowledge_state: "candidate",
        source: "knowledge_candidate",
        authority: "candidate",
        evidence: matched,
        reason: "Coincideix amb un candidat; pot suggerir però no decidir.",
        source_case_id: entry.source_case_id || null
      }];
    });
  }

  function mergeConcepts(provisional, validated) {
    const merged = new Map();
    [...(provisional || []), ...(validated || [])].forEach((concept) => {
      const key = concept.id || concept.canonical_concept_ref;
      const previous = merged.get(key);
      const rank = authorityRank(concept.authority || (concept.knowledge_state === "validated" ? "canonical_validated" : "provisional"));
      const previousRank = previous ? authorityRank(previous.authority || (previous.knowledge_state === "validated" ? "canonical_validated" : "provisional")) : 100;
      if (!previous || rank < previousRank) merged.set(key, concept);
    });
    return [...merged.values()];
  }

  function compositionKnowledge(library) {
    const validated = ((library && library.coach_validated_local_knowledge) || []).flatMap((entry) => {
      if (entry.status !== "validated" || entry.authority !== "coach_validated") return [];
      return Object.entries(entry.slot_defaults || {}).map(([slot, value], index) => ({
        id: `${entry.id}:slot:${slot}:${index + 1}`,
        operator: entry.operator || entry.semantic_ref || null,
        slot,
        value: utils.deepClone(value),
        scope_ref: entry.scope_ref || null,
        status: "validated",
        authority: "validated_local_knowledge",
        source_refs: utils.deepClone(entry.evidence_refs || [])
      }));
    });
    const candidates = Object.entries(library || {}).filter(([key]) => key.endsWith("_candidates")).flatMap(([, entries]) => entries || []).flatMap((entry) => {
      return Object.entries(entry.slot_defaults || {}).map(([slot, value], index) => ({
        id: `${entry.id}:candidate-slot:${slot}:${index + 1}`,
        operator: entry.operator || null,
        slot,
        value: utils.deepClone(value),
        label: entry.title || entry.id,
        status: "candidate",
        authority: "candidate",
        source_refs: [entry.id]
      }));
    });
    return [...validated, ...candidates];
  }

  function resolve(currentCase, options) {
    const configuration = options || {};
    const canonical = interpretationApi.canonicalCaseProvider(currentCase, configuration.canonicalCases || []);
    const visualRules = activeVisualRules(configuration.dictionary || { entries: [], evidence: [] });
    if (canonical) {
      return {
        ...canonical,
        providers: ["canonical_case_provider", "visual_functional_dictionary"],
        visual_rules: visualRules,
        composition_knowledge: compositionKnowledge(configuration.library || {}),
        suggestions: [],
        authority_summary: { validated: canonical.concepts.length, provisional: 0, candidate: 0 }
      };
    }

    const base = interpretationApi.localRuleProvider(currentCase, configuration.canonicalKnowledge || { concepts: [] });
    const localValidated = localValidatedMatches(currentCase.description, configuration.library || {});
    const suggestions = candidateMatches(currentCase.description, configuration.library || {});
    const concepts = mergeConcepts(base.concepts, localValidated);
    const unresolved = base.unresolved.slice();
    const ambiguous = (configuration.dictionary && configuration.dictionary.entries || []).filter((entry) => entry.status === "ambiguous");
    if (ambiguous.length) unresolved.push({ id: "UNRESOLVED-AMBIGUOUS-VISUAL", label: `${ambiguous.length} convenció visual continua ambigua.`, knowledge_state: "unresolved" });
    return {
      provider: localValidated.length ? "knowledge_resolver" : base.provider,
      providers: ["canonical_knowledge", "visual_functional_dictionary", "coach_validated_local_knowledge", "candidate_suggestions", "manual_builder_provider"],
      status: localValidated.length ? "partially_validated" : concepts.length || base.unknown_concepts.length ? "provisional" : "unresolved",
      concepts,
      suggested_tags: interpretationApi.suggestedTags(currentCase.description, concepts),
      unknown_concepts: base.unknown_concepts,
      unresolved,
      tactical_ir: utils.deepClone(base.tactical_ir),
      composition_knowledge: compositionKnowledge(configuration.library || {}),
      suggestions,
      visual_rules: visualRules,
      authority_summary: {
        validated: concepts.filter((item) => item.knowledge_state === "validated").length,
        provisional: concepts.filter((item) => item.knowledge_state !== "validated").length,
        candidate: suggestions.length
      },
      notes: ["Resolució per autoritat: els candidats només es mostren com a suggeriments."]
    };
  }

  return { AUTHORITY, authorityRank, activeVisualRules, localValidatedMatches, candidateMatches, mergeConcepts, compositionKnowledge, resolve };
});
