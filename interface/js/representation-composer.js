(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const interpretation = isNode ? require("./interpretation-provider.js") : root.TRACA_INTERPRETATION;
  const api = factory(utils, interpretation);
  if (isNode) module.exports = api;
  root.TRACA_REPRESENTATION_COMPOSER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, interpretationApi) {
  "use strict";

  const ROLE_OPTIONS = [
    { id: "role.central", label: "Central" },
    { id: "role.lateral", label: "Lateral" },
    { id: "role.pivot", label: "Pivot" },
    { id: "role.extrem", label: "Extrem" }
  ];
  const SUPPORTED_PRIMITIVES = [
    "participant", "defender", "ball_ownership", "participant_state", "movement", "movement_without_ball",
    "dribble", "pass", "shot", "feint", "pass_feint", "shot_feint", "blocking_mark",
    "defensive_block_mark", "physical_material", "relational_space_invisible"
  ];

  function roleKey(concept) {
    return String(concept && (concept.id || concept.canonical_concept_ref) || "").replace(/^.*role\./, "role.");
  }

  function offensiveRoles(interpretation) {
    const seen = new Set();
    return (interpretation && interpretation.concepts || []).flatMap((concept) => {
      const key = roleKey(concept);
      if (!key.startsWith("role.") || key === "role.goalkeeper" || key === "role.passer" || seen.has(key)) return [];
      seen.add(key);
      return [{ id: key, label: concept.label || key.replace("role.", "") }];
    });
  }

  function hasConcept(interpretation, id) {
    return (interpretation && interpretation.concepts || []).some((concept) => concept.id === id || concept.canonical_concept_ref === id);
  }

  function explicitPassRelation(description, roles) {
    const text = interpretationApi.normalize(description);
    for (const from of roles) {
      for (const to of roles) {
        if (from.id === to.id) continue;
        const fromLabel = interpretationApi.normalize(from.label);
        const toLabel = interpretationApi.normalize(to.label);
        const fromIndex = text.indexOf(fromLabel);
        const passIndex = Math.max(text.indexOf("passa", fromIndex + fromLabel.length), text.indexOf("passada", fromIndex + fromLabel.length));
        const toIndex = text.indexOf(toLabel, passIndex + 4);
        if (fromIndex >= 0 && passIndex > fromIndex && toIndex > passIndex) return { from: from.id, to: to.id, evidence: text.slice(fromIndex, toIndex + toLabel.length) };
      }
    }
    return null;
  }

  function questionsForPass(roles, answers) {
    const options = (roles.length >= 2 ? roles : ROLE_OPTIONS).map((role) => ({ value: role.id, label: role.label }));
    const questions = [];
    if (!answers.pass_from) questions.push({ id: "pass_from", label: "Qui inicia amb la pilota?", options });
    if (!answers.pass_to) questions.push({ id: "pass_to", label: "Qui rep la passada?", options: options.filter((option) => option.value !== answers.pass_from) });
    return questions;
  }

  function point(x, y) { return [Number(x.toFixed(3)), Number(y.toFixed(3))]; }
  function line(start, end) { return { type: "line", start: start.slice(), end: end.slice() }; }
  function cubic(start, control1, control2, end) { return { type: "cubic", start: start.slice(), control1: control1.slice(), control2: control2.slice(), end: end.slice() }; }

  function court(profile) {
    return {
      width_m: profile.court.width_m,
      half_length_m: profile.court.half_length_m,
      goal: utils.deepClone(profile.goal),
      markings: utils.deepClone(profile.markings),
      view_box: [-0.8, -1.0, 21.6, 21.8]
    };
  }

  function composePass(caseData, interpretation, profile, relation, roles) {
    const participants = roles.length >= 2 ? roles : ROLE_OPTIONS.filter((role) => relation.from === role.id || relation.to === role.id);
    const entities = [];
    const states = [];
    const dependencies = [];
    const xPositions = participants.map((_, index) => 5 + index * (10 / Math.max(1, participants.length - 1)));
    const positions = new Map();
    participants.forEach((role, index) => {
      const participantId = `A_${role.id.replace("role.", "").toUpperCase()}`;
      const stateId = `STATE_${participantId}_CURRENT`;
      const position = point(xPositions[index], 13.8);
      positions.set(role.id, { participantId, stateId, position, role });
      states.push({ id: stateId, participant_ref: participantId, state_id: "current", phase: "initial", position, status: "current", visibility: "normal", source_refs: ["coach_input"] });
      entities.push({ id: participantId, kind: "attacker", label: role.label.slice(0, 2).toUpperCase(), position, state_ref: stateId, source_ref: "coach_input", status: "derived" });
      dependencies.push({ id: `DEP_${stateId}`, trigger_ref: `geometry:participant_state:${stateId}`, effect_refs: [`geometry:entity:${participantId}`], rule: "state_drives_geometry" });
    });
    const from = positions.get(relation.from);
    const to = positions.get(relation.to);
    const receivesInMotion = hasConcept(interpretation, "action.reception") && /carrera|moviment|orientad|orientat/.test(interpretationApi.normalize(caseData.description));
    let targetState = to.stateId;
    let targetPosition = to.position;
    const commonPaths = [];
    if (receivesInMotion) {
      targetState = `STATE_${to.participantId}_RECEPTION`;
      targetPosition = point(to.position[0] + (to.position[0] < 10 ? 0.8 : -0.8), 10.8);
      states.push({ id: targetState, participant_ref: to.participantId, state_id: "reception", phase: "reception", position: targetPosition, status: "future", visibility: "normal", source_refs: ["coach_input"] });
      const movementId = `PATH_${to.participantId}_RECEPTION`;
      commonPaths.push({
        id: movementId, kind: "movement_without_ball", action_type: "movement", actor_ref: to.participantId,
        from_state_ref: to.stateId, to_state_ref: targetState,
        segments: [cubic(to.position, point(to.position[0], 12.9), point(targetPosition[0], 11.7), targetPosition)],
        functional_points: [], source_refs: ["coach_input"]
      });
      dependencies.find((item) => item.trigger_ref.endsWith(to.stateId)).effect_refs.push(`geometry:common_path:${movementId}`);
      dependencies.push({ id: `DEP_${targetState}`, trigger_ref: `geometry:participant_state:${targetState}`, effect_refs: [`geometry:common_path:${movementId}`], rule: "state_drives_geometry" });
    }
    const passId = `PATH_PASS_${from.participantId}_${to.participantId}`;
    commonPaths.push({
      id: passId, kind: "pass", action_type: "pass", ball_ref: "BALL_1",
      from_participant_ref: from.participantId, from_state_ref: from.stateId,
      to_participant_ref: to.participantId, to_state_ref: targetState, anchor_mode: "symbol_perimeter",
      segments: [cubic(from.position, point((from.position[0] + targetPosition[0]) / 2, from.position[1] - 0.45), point((from.position[0] + targetPosition[0]) / 2, targetPosition[1] + 0.45), targetPosition)],
      functional_points: [], source_refs: ["coach_input"]
    });
    dependencies.find((item) => item.trigger_ref.endsWith(from.stateId)).effect_refs.push(`geometry:common_path:${passId}`);
    const targetDependency = dependencies.find((item) => item.trigger_ref.endsWith(targetState));
    if (targetDependency) targetDependency.effect_refs.push(`geometry:common_path:${passId}`);
    entities.push({ id: "BALL_1", kind: "ball", label: "", position: point(from.position[0] + 0.38, from.position[1] - 0.14), source_ref: "coach_input", status: "derived", possessor_ref: from.participantId });
    return {
      meta: { format: "TRACA_composed_geometry", version: "0.1.0", exercise_id: caseData.id, status: "provisional_composition", authority: "known_primitives", canonical_promotion: false },
      court: court(profile),
      layout_policy: { id: "generic_primitive_composer_v0.1", status: "provisional", coordinate_system: "metres_origin_goal_line_left", attack_direction: "negative_y", notes: ["Composició de primitives conegudes; no és un resolutor tàctic universal."] },
      zones: [], spaces: [], entities, participant_states: states, common_paths: commonPaths, branches: [], dependencies,
      traceability: [...entities.map((entity) => ({ geometry_ref: `geometry:entity:${entity.id}`, source_refs: ["coach_input"] })), ...commonPaths.map((path) => ({ geometry_ref: `geometry:common_path:${path.id}`, source_refs: ["coach_input"] }))]
    };
  }

  function compose(input) {
    const caseData = input.currentCase;
    const interpretation = input.interpretation || { concepts: [] };
    const answers = input.answers || {};
    const roles = offensiveRoles(interpretation);
    const passKnown = hasConcept(interpretation, "action.pass");
    if (!passKnown) return { status: "unsupported", geometry: null, questions: [], used_primitives: [], unresolved: ["No hi ha cap acció composable explícita."] };
    const explicit = explicitPassRelation(caseData.description, roles);
    const relation = explicit || (answers.pass_from && answers.pass_to ? { from: answers.pass_from, to: answers.pass_to, evidence: "coach_answer" } : null);
    if (!relation || relation.from === relation.to) {
      return { status: "needs_input", geometry: null, questions: questionsForPass(roles, answers), used_primitives: ["participant", "pass"], unresolved: ["La passada necessita emissor i receptor diferents."] };
    }
    const allRoles = roles.some((role) => role.id === relation.from) && roles.some((role) => role.id === relation.to)
      ? roles
      : ROLE_OPTIONS.filter((role) => role.id === relation.from || role.id === relation.to);
    return {
      status: "ready",
      geometry: composePass(caseData, interpretation, input.courtProfile, relation, allRoles),
      questions: [],
      used_primitives: hasConcept(interpretation, "action.reception") ? ["participant", "ball_ownership", "participant_state", "movement_without_ball", "pass"] : ["participant", "ball_ownership", "pass"],
      unresolved: [],
      relation: { type: "pass", from_role: relation.from, to_role: relation.to, evidence: relation.evidence }
    };
  }

  return { ROLE_OPTIONS, SUPPORTED_PRIMITIVES, offensiveRoles, explicitPassRelation, questionsForPass, compose };
});
