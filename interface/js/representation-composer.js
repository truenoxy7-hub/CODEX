(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const graphApi = isNode ? require("./composition-graph.js") : root.TRACA_COMPOSITION_GRAPH;
  const stateApi = isNode ? require("./state-registry.js") : root.TRACA_STATE_REGISTRY;
  const ballApi = isNode ? require("./ball-flow.js") : root.TRACA_BALL_FLOW;
  const constraintApi = isNode ? require("./spatial-constraints.js") : root.TRACA_SPATIAL_CONSTRAINTS;
  const operatorsApi = isNode ? require("./composition-operators.js") : root.TRACA_COMPOSITION_OPERATORS;
  const preflightApi = isNode ? require("./composition-preflight.js") : root.TRACA_COMPOSITION_PREFLIGHT;
  const geometryApi = isNode ? require("./generic-geometry-resolver.js") : root.TRACA_GENERIC_GEOMETRY_RESOLVER;
  const api = factory(utils, graphApi, stateApi, ballApi, constraintApi, operatorsApi, preflightApi, geometryApi);
  if (isNode) module.exports = api;
  root.TRACA_REPRESENTATION_COMPOSER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, graphApi, stateApi, ballApi, constraintApi, operatorsApi, preflightApi, geometryApi) {
  "use strict";

  const COMPOSITION_VERSION = "0.1.0";
  const SUPPORTED_PRIMITIVES = [
    "participant_symbol", "participant_temporal_state", "ball_ownership", "movement_path", "dribble_path",
    "pass_path", "shot_path", "feint_path", "blocking_mark", "physical_material", "relational_space_invisible"
  ];

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  function stableStringify(value) { return JSON.stringify(stableValue(value)); }

  function mergeKeys(actions) {
    const result = { pass_targets: {}, reception_states: {} };
    const byId = new Map(actions.map((action) => [action.id, action]));
    actions.filter((action) => action.type === "reception").forEach((reception) => {
      const dependencies = Array.isArray(reception.after) ? reception.after : reception.after ? [reception.after] : [];
      const pass = dependencies.map((id) => byId.get(id)).find((action) => action && action.type === "pass" && (action.receiver_ref === reception.actor_ref || action.to_participant_ref === reception.actor_ref));
      const key = reception.state_ref || `RECEPTION:${reception.id}`;
      result.reception_states[reception.id] = key;
      if (pass) result.pass_targets[pass.id] = key;
    });
    return result;
  }

  function optionList(kind, tacticalIR, exclude) {
    const excluded = new Set(operatorsApi.values(exclude));
    if (kind === "spaces") return (tacticalIR.spaces || []).filter((item) => !excluded.has(item.id)).map((item) => ({ value: item.id, label: item.label || item.id }));
    const participants = (tacticalIR.participants || []).filter((item) => !excluded.has(item.id));
    if (kind === "pivot") return participants.filter((item) => item.role === "pivot" || item.id === "PV").map((item) => ({ value: item.id, label: item.label || item.id }));
    if (kind === "opponents") {
      const materials = (tacticalIR.materials || []).filter((item) => item.opponent_equivalence || item.function === "active_oppositional_substitute");
      return [...participants.filter((item) => item.team === "defense" || item.kind === "defender" || /^D\d|DAV/.test(item.id)), ...materials].map((item) => ({ value: item.id, label: item.label || item.id }));
    }
    return participants.filter((item) => item.team !== "defense" && item.kind !== "defender" && !/^D\d|DAV/.test(item.id)).map((item) => ({ value: item.id, label: item.label || item.id }));
  }

  function compatibleKnowledgeFact(facts, action, spec) {
    return (facts || []).filter((fact) => {
      if (!operatorsApi.OPERATIONAL_AUTHORITIES.has(fact.authority) || fact.status !== "validated") return false;
      if (fact.slot !== spec.slot) return false;
      if (fact.action_ref && fact.action_ref !== action.id) return false;
      if (fact.operator && ![action.type, action.subtype].includes(fact.operator)) return false;
      if (fact.scope_ref && fact.scope_ref !== action.scope_ref && fact.scope_ref !== action.phase_ref) return false;
      return true;
    }).sort((left, right) => String(left.id).localeCompare(String(right.id)))[0] || null;
  }

  function candidateSuggestion(facts, action, spec) {
    return (facts || []).find((fact) => fact.slot === spec.slot && (fact.status === "candidate" || fact.authority === "candidate")
      && (!fact.action_ref || fact.action_ref === action.id)) || null;
  }

  function applyAnswers(tacticalIR, answers) {
    const result = utils.deepClone(tacticalIR);
    (result.actions || []).forEach((action) => {
      Object.entries(answers || {}).forEach(([key, value]) => {
        const prefix = `${action.id}:`;
        if (!key.startsWith(prefix)) return;
        const slot = key.slice(prefix.length);
        if (value === undefined || value === null || value === "") return;
        action[slot] = Array.isArray(value) ? value.slice() : value;
        action.slot_authority = { ...(action.slot_authority || {}), [slot]: "coach_explicit_input" };
        action.source_refs = [...new Set([...(action.source_refs || []), `coach_answer:${key}`])];
      });
    });
    return result;
  }

  function createContext(tacticalIR, graph, registry, states, ball, constraints, knowledgeFacts) {
    const planActions = [];
    const visualPrimitives = [];
    const questions = [];
    const missingSlots = [];
    const appliedKnowledge = [];
    const downstream = graphApi.downstreamCounts(graph);
    const mergeIndex = mergeKeys(tacticalIR.actions || []);

    function rawSlot(action, spec) {
      const fields = [spec.slot, ...(spec.aliases || [])];
      for (const field of fields) {
        const value = action[field];
        const amount = operatorsApi.values(value).length;
        const validAmount = (!spec.min_items || amount >= spec.min_items) && (!spec.max_items || amount <= spec.max_items);
        if (value !== undefined && value !== null && value !== "" && validAmount) {
          const authority = action.slot_authority && action.slot_authority[field] || action.authority || "unknown";
          const status = action.slot_status && action.slot_status[field] || action.status || "unknown";
          if (operatorsApi.OPERATIONAL_AUTHORITIES.has(authority) && status !== "candidate" && status !== "provisional") return value;
        }
      }
      return null;
    }

    function requireSlot(action, spec) {
      const direct = rawSlot(action, spec);
      if (direct !== null) return direct;
      const fact = compatibleKnowledgeFact(knowledgeFacts, action, spec);
      if (fact) {
        appliedKnowledge.push({ ...utils.deepClone(fact), action_ref: action.id, slot: spec.slot });
        return utils.deepClone(fact.value);
      }
      const suggestion = candidateSuggestion(knowledgeFacts, action, spec);
      const question = {
        id: `${action.id}:${spec.slot}`, action_ref: action.id, slot: spec.slot,
        label: spec.label, options: optionList(spec.options, tacticalIR, spec.exclude),
        multiple: Boolean(spec.min_items && spec.min_items > 1),
        required_count: spec.min_items || 1,
        maximum_count: spec.max_items || spec.min_items || 1,
        unlock_count: 1 + (downstream[action.id] || 0),
        suggested_answer: suggestion ? { value: utils.deepClone(suggestion.value), label: suggestion.label || String(suggestion.value), authority: "candidate", source_refs: suggestion.source_refs || [] } : null
      };
      if (!questions.some((item) => item.id === question.id)) questions.push(question);
      if (!missingSlots.some((item) => item.action_ref === action.id && item.slot === spec.slot)) missingSlots.push({ action_ref: action.id, operator: action.type, slot: spec.slot, source_refs: action.source_refs || [] });
      return null;
    }

    function composedAction(action, operator, fields) {
      const record = {
        id: action.id, semantic_type: action.type, subtype: action.subtype || null,
        operator_id: operator.id, status: "composed", phase_ref: action.phase_ref || null,
        after: utils.deepClone(action.after || []), simultaneous_with: utils.deepClone(action.simultaneous_with || []),
        ...utils.deepClone(fields || {}), source_refs: utils.deepClone(action.source_refs || []),
        authority: action.authority || "unknown", trace: { semantic_action_ref: action.id, rule_ref: `operator:${operator.id}@${COMPOSITION_VERSION}` }
      };
      planActions.push(record); return record;
    }

    function unresolvedAction(action, operator, reason) {
      const record = {
        id: action.id, semantic_type: action.type, subtype: action.subtype || null,
        operator_id: operator.id, status: "unresolved", reason: reason || "Falten slots obligatoris.",
        phase_ref: action.phase_ref || null, after: utils.deepClone(action.after || []),
        source_refs: utils.deepClone(action.source_refs || []), authority: action.authority || "unknown"
      };
      planActions.push(record); return record;
    }

    function addPrimitive(action, type, payload) {
      const suffix = payload && payload.id_suffix ? `_${payload.id_suffix}` : "";
      const id = `VIS_${action.id}_${type.toUpperCase()}${suffix}`.replace(/[^A-Za-z0-9_:-]/g, "_");
      visualPrimitives.push({
        id, type, action_ref: action.id, ...utils.deepClone(payload || {}),
        source_refs: utils.deepClone(action.source_refs || []),
        trace: { action_ref: action.id, dictionary_ref: payload && payload.dictionary_ref || null }
      });
      return id;
    }

    return {
      tacticalIR, graph, registry, states, ball, constraints,
      knowledge_facts: knowledgeFacts || [], merge_keys: mergeIndex,
      plan_actions: planActions, visual_primitives: visualPrimitives, questions, missing_slots: missingSlots,
      applied_knowledge: appliedKnowledge, require: requireSlot, composedAction, unresolvedAction, addPrimitive
    };
  }

  function coverage(planActions, sourceActions) {
    const composed = planActions.filter((item) => item.status === "composed").length;
    const unresolved = planActions.filter((item) => item.status === "unresolved").length;
    const unsupported = planActions.filter((item) => item.status === "unsupported").length;
    const total = sourceActions.length;
    return {
      actions_total: total, actions_composed: composed, actions_unresolved: unresolved,
      actions_unsupported: unsupported, ratio: total ? Number((composed / total).toFixed(4)) : 0,
      label: `${composed}/${total}`
    };
  }

  function compositionStatus(plan, preflight) {
    if (preflight.status === "blocked") return "blocked";
    if (!plan.coverage.actions_total) return "unsupported";
    if (plan.coverage.actions_composed === plan.coverage.actions_total) return plan.questions.length ? "needs_input" : "ready";
    if (plan.coverage.actions_composed > 0) return "partial";
    if (plan.questions.length) return "needs_input";
    return "unsupported";
  }

  function compose(input) {
    const rawIR = input && (input.tacticalIR || input.interpretation && input.interpretation.tactical_ir);
    if (!rawIR) {
      return {
        status: "unsupported", composition_status: "unsupported", geometry_status: "needs_input",
        geometry: null, plan: null, questions: [], used_primitives: [],
        coverage: { actions_total: 0, actions_composed: 0, actions_unresolved: 0, actions_unsupported: 0, ratio: 0, label: "0/0" },
        unresolved: ["Falta una entrada tàctica estructurada; el compositor no rellegeix el text lliure."]
      };
    }
    const tacticalIR = graphApi.normalizeInput(applyAnswers(rawIR, input.answers || {}));
    const graph = graphApi.create(tacticalIR);
    const ordered = graphApi.orderedActions(graph);
    const registry = input.registry || operatorsApi.createDefaultRegistry();
    const states = stateApi.create(tacticalIR);
    const ball = ballApi.create(tacticalIR);
    const constraints = constraintApi.create(tacticalIR);
    const context = createContext(tacticalIR, graph, registry, states, ball, constraints, input.knowledgeFacts || input.interpretation && input.interpretation.composition_knowledge || []);

    if (ordered.cyclic_action_refs.length) constraints.conflicts.push({ code: "COMPOSITION_TEMPORAL_CYCLE", reason: `El graf temporal conté un cicle: ${ordered.cyclic_action_refs.join(", ")}.`, source_refs: [] });
    ordered.actions.forEach((action) => {
      const operator = registry.find(action);
      if (!operator) {
        context.plan_actions.push({
          id: action.id, semantic_type: action.type, subtype: action.subtype || null,
          operator_id: null, status: "unsupported", reason: "No hi ha operador registrat.",
          source_refs: utils.deepClone(action.source_refs || []), authority: action.authority || "unknown"
        });
        return;
      }
      try {
        operator.compose(action, context);
      } catch (error) {
        constraints.conflicts.push({ code: "COMPOSITION_OPERATOR_CONFLICT", action_ref: action.id, reason: error.message, source_refs: action.source_refs || [] });
        context.plan_actions.push({ id: action.id, semantic_type: action.type, operator_id: operator.id, status: "unresolved", reason: error.message, source_refs: action.source_refs || [] });
      }
    });

    const sortedQuestions = context.questions.slice().sort((left, right) => right.unlock_count - left.unlock_count || left.id.localeCompare(right.id));
    const constraintSnapshot = constraints.snapshot();
    const ballSnapshot = ball.snapshot();
    const plan = {
      meta: {
        format: "TRACA_composition_plan", version: COMPOSITION_VERSION,
        source_revision: tacticalIR.meta.source_revision || null,
        knowledge_version: tacticalIR.meta.knowledge_version || null,
        fingerprint: null, deterministic: true
      },
      graph: { meta: graph.meta, nodes: graph.nodes, edges: graph.edges },
      operators: context.plan_actions.map((item) => item.operator_id).filter(Boolean),
      actions: context.plan_actions,
      participant_states: states.snapshot(),
      ball_flow: ballSnapshot,
      constraints: constraintSnapshot.constraints,
      constraint_conflicts: constraintSnapshot.conflicts,
      visual_primitives: context.visual_primitives,
      missing_slots: context.missing_slots,
      questions: sortedQuestions,
      applied_knowledge: context.applied_knowledge,
      coverage: coverage(context.plan_actions, tacticalIR.actions || []),
      traceability: context.plan_actions.map((action) => ({ plan_ref: `composition:action:${action.id}`, semantic_ref: action.id, source_refs: action.source_refs || [] }))
    };
    plan.meta.fingerprint = utils.fingerprint(stableStringify({ tacticalIR, plan: { ...plan, meta: { ...plan.meta, fingerprint: null } } }));
    const preflight = preflightApi.run(plan, tacticalIR);
    plan.preflight = preflight;
    plan.composition_status = compositionStatus(plan, preflight);

    let geometryResult = { status: preflight.status === "blocked" ? "blocked" : "needs_input", geometry: null, unresolved: [], coverage: { visual_primitives_total: plan.visual_primitives.length, visual_primitives_resolved: 0, visual_primitives_unresolved: plan.visual_primitives.length } };
    if (preflight.can_resolve_geometry && input.courtProfile) geometryResult = geometryApi.resolve(plan, tacticalIR, input.courtProfile);
    plan.geometry_status = geometryResult.status;
    plan.geometry_coverage = geometryResult.coverage;

    return {
      status: plan.composition_status,
      composition_status: plan.composition_status,
      geometry_status: geometryResult.status,
      geometry: geometryResult.geometry,
      plan,
      questions: sortedQuestions,
      used_primitives: [...new Set(plan.visual_primitives.map((item) => item.type))],
      coverage: plan.coverage,
      unresolved: [
        ...plan.missing_slots.map((item) => `${item.action_ref}:${item.slot}`),
        ...plan.actions.filter((item) => item.status === "unsupported").map((item) => `${item.id}:${item.semantic_type}`),
        ...geometryResult.unresolved.map((item) => item.reason)
      ],
      preflight
    };
  }

  return {
    COMPOSITION_VERSION, SUPPORTED_PRIMITIVES, stableValue, stableStringify,
    mergeKeys, optionList, applyAnswers, createContext, coverage, compositionStatus, compose
  };
});
