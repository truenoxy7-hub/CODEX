(function (root, factory) {
  const operators = typeof module === "object" && module.exports ? require("./composition-operators.js") : root.TRACA_COMPOSITION_OPERATORS;
  const api = factory(operators);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_COMPOSITION_PREFLIGHT = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (operatorsApi) {
  "use strict";

  function diagnostic(level, code, message, details) {
    return { level, code, message, ...(details || {}) };
  }

  function structuralDelimiterDerivation(space, delimiterRef) {
    return (space.delimiter_derivations || []).find((item) => {
      return item.delimiter_ref === delimiterRef &&
        item.entity_kind === "defender" &&
        item.presence === "structural_reference" &&
        item.status === "validated" &&
        operatorsApi.OPERATIONAL_AUTHORITIES.has(item.authority);
    }) || null;
  }

  function structuralOnly(participant) {
    return participant && participant.presence === "structural_reference" && participant.functional_participation === "delimiter_only";
  }

  function run(plan, tacticalIR) {
    const diagnostics = [];
    const participantMap = new Map((tacticalIR.participants || []).map((item) => [item.id, item]));
    const participants = new Set(participantMap.keys());
    const materials = new Map((tacticalIR.materials || []).map((item) => [item.id, item]));
    const spaces = new Map((tacticalIR.spaces || []).map((item) => [item.id, item]));
    const states = new Map((plan.participant_states || []).map((item) => [item.id, item]));

    spaces.forEach((space) => {
      const delimiters = space.delimiter_refs || space.relation && space.relation.delimiter_refs || [];
      delimiters.forEach((ref) => {
        if (!participants.has(ref) && !materials.has(ref) && !String(ref).startsWith("COURT_") && !structuralDelimiterDerivation(space, ref)) {
          diagnostics.push(diagnostic("error", "SPACE_DELIMITER_MISSING", `${space.id} depèn del delimitador ${ref}, que TRAÇA no pot derivar d’una relació validada.`, { space_ref: space.id, target_ref: ref }));
        }
      });
    });

    (plan.participant_states || []).forEach((state) => {
      if (!participants.has(state.participant_ref)) diagnostics.push(diagnostic("error", "COMPOSITION_STATE_OWNER_MISSING", `${state.id} referencia un participant inexistent.`, { state_ref: state.id }));
    });
    (plan.actions || []).forEach((action) => {
      const participantFields = [
        ["actor_ref", action.actor_ref], ["receiver_ref", action.receiver_ref],
        ["opponent_ref", action.opponent_ref], ["blocked_defender_ref", action.blocked_defender_ref],
        ...(action.attacker_refs || []).map((ref) => ["attacker_refs", ref]),
        ...(action.defender_refs || []).map((ref) => ["defender_refs", ref]),
        ...(action.participant_refs || []).map((ref) => ["participant_refs", ref]),
        ...(action.actor_refs || []).map((ref) => ["actor_refs", ref])
      ].filter((item) => item[1]);
      participantFields.forEach(([field, ref]) => {
        if (!participants.has(ref) && !materials.has(ref)) diagnostics.push(diagnostic("error", "COMPOSITION_PARTICIPANT_MISSING", `${action.id} referencia ${ref}, que no existeix.`, { action_ref: action.id, target_ref: ref }));
        else if (structuralOnly(participantMap.get(ref))) diagnostics.push(diagnostic("error", "STRUCTURAL_REFERENCE_USED_AS_ACTIVE_PARTICIPANT", `${ref} només és una referència estructural de delimitació i no pot ocupar ${field} sense participació explícita.`, { action_ref: action.id, target_ref: ref, field }));
      });
      [action.from_state_ref, action.to_state_ref, action.state_ref, ...(action.from_state_refs || []), ...(action.to_state_refs || [])].filter(Boolean).forEach((ref) => {
        if (!states.has(ref)) diagnostics.push(diagnostic("error", "COMPOSITION_STATE_MISSING", `${action.id} referencia l’estat inexistent ${ref}.`, { action_ref: action.id, state_ref: ref }));
      });
      [action.space_ref, action.initial_space_ref, action.initial_attack_relation, action.target_space_ref].filter(Boolean).forEach((ref) => {
        if (!spaces.has(ref)) diagnostics.push(diagnostic("error", "COMPOSITION_SPACE_MISSING", `${action.id} referencia l’espai inexistent ${ref}.`, { action_ref: action.id, space_ref: ref }));
      });
      if (action.semantic_type === "pass" && action.actor_ref && action.actor_ref === action.receiver_ref) diagnostics.push(diagnostic("error", "PASS_SENDER_EQUALS_RECEIVER", `${action.id} té el mateix emissor i receptor.`, { action_ref: action.id }));
      [action.opponent_ref, action.blocked_defender_ref, ...(action.defender_refs || [])].filter(Boolean).forEach((ref) => {
        if (!materials.has(ref)) return;
        const material = materials.get(ref);
        const functionName = material.function || material.functional_role;
        if (!material.opponent_equivalence && functionName !== "active_oppositional_substitute") diagnostics.push(diagnostic("error", "MATERIAL_OPPONENT_EQUIVALENCE_MISSING", `${ref} és material i no pot actuar com a defensor sense equivalència declarada.`, { action_ref: action.id, material_ref: ref }));
      });
    });
    const sourceActions = new Map((tacticalIR.actions || []).map((item) => [item.id, item]));
    (plan.actions || []).filter((item) => item.semantic_type === "reception" && item.status === "composed").forEach((reception) => {
      const source = sourceActions.get(reception.id) || {};
      const dependencies = Array.isArray(source.after) ? source.after : source.after ? [source.after] : [];
      const pass = (plan.actions || []).find((item) => dependencies.includes(item.id) && item.semantic_type === "pass" && item.receiver_ref === reception.actor_ref);
      if (pass && pass.to_state_ref !== reception.state_ref) diagnostics.push(diagnostic("error", "RECEPTION_STATE_NOT_SHARED", `${reception.id} no comparteix estat amb la passada ${pass.id}.`, { action_ref: reception.id, pass_ref: pass.id }));
    });
    (plan.applied_knowledge || []).forEach((fact) => {
      if (!operatorsApi.OPERATIONAL_AUTHORITIES.has(fact.authority) || fact.status === "candidate" || fact.status === "provisional") diagnostics.push(diagnostic("error", "NON_AUTHORITATIVE_KNOWLEDGE_APPLIED", `${fact.id || fact.slot} no pot omplir un slot obligatori.`, { source_refs: fact.source_refs || [] }));
    });
    (plan.ball_flow && plan.ball_flow.diagnostics || []).forEach((item) => diagnostics.push(diagnostic("error", item.code, item.code === "BALL_HOLDER_CONFLICT" ? `La pilota ${item.ball_ref} no és de ${item.expected_holder_ref} quan comença ${item.action_ref}.` : `Falta l’estat inicial de la pilota ${item.ball_ref}.`, item)));
    (plan.constraint_conflicts || []).forEach((item) => diagnostics.push(diagnostic("error", item.code, item.reason, item)));
    (plan.questions || []).forEach((question) => diagnostics.push(diagnostic("info", "COMPOSITION_INPUT_REQUIRED", question.label, { question_ref: question.id, action_ref: question.action_ref })));
    (plan.actions || []).filter((action) => action.status === "unsupported").forEach((action) => diagnostics.push(diagnostic("warning", "COMPOSITION_OPERATOR_UNSUPPORTED", `Encara no hi ha operador per a ${action.semantic_type}.`, { action_ref: action.id })));

    const blocked = diagnostics.some((item) => item.level === "error");
    return {
      status: blocked ? "blocked" : plan.questions.length ? "needs_input" : "ready",
      can_compose: !blocked,
      can_resolve_geometry: !blocked && !plan.questions.length,
      diagnostics
    };
  }

  return { structuralDelimiterDerivation, structuralOnly, run };
});
