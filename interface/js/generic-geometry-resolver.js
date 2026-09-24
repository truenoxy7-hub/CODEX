(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_GENERIC_GEOMETRY_RESOLVER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const GEOMETRY_VERSION = "0.3.0";
  const SCHEMA_REF = "../../schema/traca.geometry.schema.v0.3.json";
  const DEFAULT_POLICY = Object.freeze({
    id: "generic_relational_layout_v0.3",
    version: "0.3.0",
    defensive_line_y: 7.2,
    approach_offset_y: 2.8,
    exit_offset_y: 1.7,
    staging_offset_y: 3.0,
    relation_separation_x: 1.25
  });

  function rounded(point) { return point.map((value) => Number(Number(value).toFixed(3))); }
  function line(start, end) { return { type: "line", start: rounded(start), end: rounded(end) }; }
  function distance(left, right) { return Math.hypot(left[0] - right[0], left[1] - right[1]); }
  function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
  function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
  function sourceRefs(item) { return unique(item && item.source_refs || ["derived:generic_geometry"]); }

  function court(profile) {
    return {
      width_m: profile.court.width_m,
      half_length_m: profile.court.half_length_m,
      goal: utils.deepClone(profile.goal),
      markings: utils.deepClone(profile.markings),
      view_box: [-0.8, -1.0, profile.court.width_m + 1.6, profile.court.half_length_m + 1.8]
    };
  }

  function participantKind(participant) {
    if (participant.kind === "defender" || participant.team === "defense" || /^D\d|DAV/.test(participant.id)) return "defender";
    if (participant.kind === "goalkeeper") return "goalkeeper";
    if (participant.role === "pivot") return "pivot";
    if (participant.role === "passer") return "passer";
    return "attacker";
  }

  function structuralOnly(participant) {
    return participant && participant.presence === "structural_reference" && participant.functional_participation === "delimiter_only";
  }

  function delimiterRefs(space) {
    return space && (space.delimiter_state_refs || space.delimiter_refs || space.relation && space.relation.delimiter_refs) || [];
  }

  function orderedDelimiterRefs(spaces) {
    const nodes = new Set();
    const outgoing = new Map();
    const indegree = new Map();
    (spaces || []).forEach((space) => {
      const refs = delimiterRefs(space);
      refs.forEach((ref) => { nodes.add(ref); if (!outgoing.has(ref)) outgoing.set(ref, new Set()); if (!indegree.has(ref)) indegree.set(ref, 0); });
      if (refs.length !== 2 || outgoing.get(refs[0]).has(refs[1])) return;
      outgoing.get(refs[0]).add(refs[1]);
      indegree.set(refs[1], (indegree.get(refs[1]) || 0) + 1);
    });
    const queue = [...nodes].filter((ref) => !indegree.get(ref)).sort();
    const ordered = [];
    while (queue.length) {
      const ref = queue.shift();
      ordered.push(ref);
      [...(outgoing.get(ref) || [])].sort().forEach((target) => {
        indegree.set(target, indegree.get(target) - 1);
        if (!indegree.get(target)) { queue.push(target); queue.sort(); }
      });
    }
    [...nodes].sort().forEach((ref) => { if (!ordered.includes(ref)) ordered.push(ref); });
    return ordered;
  }

  function statePositions(plan, tacticalIR, profile, policyInput) {
    const policy = { ...DEFAULT_POLICY, ...(policyInput || {}) };
    const states = new Map((plan.participant_states || []).map((state) => [state.id, utils.deepClone(state)]));
    const spaces = new Map((tacticalIR.spaces || []).map((space) => [space.id, space]));
    const participantStates = new Map();
    const decisions = [];
    const diagnostics = [];
    states.forEach((state) => {
      if (!participantStates.has(state.participant_ref)) participantStates.set(state.participant_ref, []);
      participantStates.get(state.participant_ref).push(state);
      if (Array.isArray(state.position)) {
        state.layout_decision_ref = `LAYOUT_EXPLICIT_${state.id}`;
        decisions.push({ id: state.layout_decision_ref, type: "explicit_anchor", target_ref: state.id, status: "preserved", position: state.position.slice(), source_refs: sourceRefs(state) });
      }
    });

    function positionedState(ref) {
      if (states.has(ref) && Array.isArray(states.get(ref).position)) return states.get(ref);
      return (participantStates.get(ref) || []).find((state) => Array.isArray(state.position)) || null;
    }
    function positionOfRef(ref) {
      const state = positionedState(ref);
      return state && state.position || null;
    }
    function assign(state, position, rule, source) {
      if (!state || Array.isArray(state.position) || !Array.isArray(position)) return false;
      state.position = rounded([
        clamp(position[0], 0.6, profile.court.width_m - 0.6),
        clamp(position[1], 0.8, profile.court.half_length_m - 0.8)
      ]);
      state.layout_decision_ref = `LAYOUT_${String(decisions.length + 1).padStart(4, "0")}`;
      decisions.push({
        id: state.layout_decision_ref,
        type: rule,
        target_ref: state.id,
        status: "provisional_visual_policy",
        position: state.position.slice(),
        source_refs: unique([...(source || []), ...sourceRefs(state)])
      });
      return true;
    }
    function stateForParticipant(ref, preferredRefs) {
      const candidates = participantStates.get(ref) || [];
      return (preferredRefs || []).map((stateRef) => states.get(stateRef)).find((state) => state && state.participant_ref === ref)
        || candidates.find((state) => state.state_key === "S0") || candidates[0] || null;
    }

    let changed = true;
    while (changed) {
      changed = false;
      states.forEach((state) => {
        if (Array.isArray(state.position) || !state.functional_position_ref) return;
        const inherited = positionOfRef(state.functional_position_ref);
        if (inherited) changed = assign(state, inherited, "functional_position", [`state:${state.functional_position_ref}`]) || changed;
      });
    }

    const delimiterOrder = orderedDelimiterRefs([...spaces.values()]);
    if (delimiterOrder.length) {
      const span = Math.min(profile.court.width_m - 5, Math.max(4, (delimiterOrder.length - 1) * 4));
      const start = (profile.court.width_m - span) / 2;
      const step = delimiterOrder.length > 1 ? span / (delimiterOrder.length - 1) : 0;
      delimiterOrder.forEach((ref, index) => {
        const state = stateForParticipant(ref);
        assign(state, [start + step * index, policy.defensive_line_y], "relational_delimiter_order", [`relation:delimiter:${ref}`]);
      });
    }

    const spaceAnchors = new Map();
    spaces.forEach((space) => {
      if (Array.isArray(space.anchor_position)) { spaceAnchors.set(space.id, space.anchor_position.slice()); return; }
      const refs = delimiterRefs(space);
      const points = refs.map(positionOfRef).filter(Boolean);
      if (refs.length === 2 && points.length === 2) spaceAnchors.set(space.id, rounded([(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2]));
    });

    (plan.constraints || []).filter((constraint) => constraint.type === "ATTACKS" && constraint.status !== "conflict").forEach((constraint) => {
      const state = states.get(constraint.subject_refs && constraint.subject_refs[0]);
      const spaceRef = constraint.object_refs && constraint.object_refs[0];
      if (state && !state.space_ref && spaces.has(spaceRef)) state.space_ref = spaceRef;
    });

    const actions = plan.actions || [];
    states.forEach((state) => {
      if (Array.isArray(state.position) || !state.space_ref || !spaceAnchors.has(state.space_ref)) return;
      const anchor = spaceAnchors.get(state.space_ref);
      const exitsFeint = actions.some((action) => action.operator_id === "feint" && action.to_state_ref === state.id);
      const receivesOrAttacks = actions.some((action) => (action.operator_id === "reception" && action.state_ref === state.id) || (action.operator_id === "feint" && action.from_state_ref === state.id));
      const y = exitsFeint ? policy.defensive_line_y - policy.exit_offset_y
        : receivesOrAttacks ? policy.defensive_line_y + policy.approach_offset_y : anchor[1] + 1.8;
      assign(state, [anchor[0], y], exitsFeint ? "space_exit_after_defensive_line" : "space_approach_anchor", [`space:${state.space_ref}`]);
    });

    actions.filter((action) => action.operator_id === "pass" && action.status === "composed").forEach((action, index) => {
      const from = states.get(action.from_state_ref), to = states.get(action.to_state_ref);
      const center = profile.court.width_m / 2;
      if (from && to && !Array.isArray(from.position) && !Array.isArray(to.position)) {
        assign(to, [center + 1.7, policy.defensive_line_y + policy.approach_offset_y], "pass_relation_receiver", [`action:${action.id}`]);
        assign(from, [center - 1.7, policy.defensive_line_y + policy.approach_offset_y + policy.staging_offset_y], "pass_relation_sender", [`action:${action.id}`]);
      } else if (from && to && !Array.isArray(from.position) && Array.isArray(to.position)) {
        const direction = to.position[0] <= center ? 1 : -1;
        assign(from, [to.position[0] + direction * 3, to.position[1] + policy.staging_offset_y], "pass_sender_from_receiver", [`action:${action.id}`]);
      } else if (from && to && Array.isArray(from.position) && !Array.isArray(to.position)) {
        const direction = from.position[0] <= center ? 1 : -1;
        assign(to, [from.position[0] + direction * 3, from.position[1] - policy.staging_offset_y], "pass_receiver_from_sender", [`action:${action.id}`]);
      }
      if (from && to && Array.isArray(from.position) && Array.isArray(to.position) && distance(from.position, to.position) < 0.5) {
        diagnostics.push({ code: "LAYOUT_PASS_ENDPOINT_OVERLAP", severity: "error", path: `/actions/${index}`, message: `La passada ${action.id} té emissor i receptor superposats.`, action_ref: action.id, source_refs: sourceRefs(action) });
      }
    });

    actions.filter((action) => action.operator_id === "reception" && action.in_motion).forEach((action) => {
      const from = states.get(action.from_state_ref), to = states.get(action.state_ref);
      if (!from || !to || Array.isArray(from.position) || !Array.isArray(to.position)) return;
      const pass = actions.find((candidate) => candidate.operator_id === "pass" && candidate.to_state_ref === action.state_ref);
      const sender = pass && states.get(pass.from_state_ref);
      const direction = sender && Array.isArray(sender.position) && sender.position[0] > to.position[0] ? -1 : 1;
      assign(from, [to.position[0] + direction * 2.4, to.position[1] + policy.staging_offset_y], "reception_approach", [`action:${action.id}`]);
    });

    actions.filter((action) => action.operator_id === "numerical_relation" && action.status === "composed").forEach((action) => {
      const preferred = action.state_refs || [];
      const defenders = (action.defender_refs || []).map((ref) => stateForParticipant(ref, preferred)).filter(Boolean);
      const reference = defenders.find((state) => Array.isArray(state.position));
      if (!reference) return;
      (action.attacker_refs || []).forEach((ref, index) => {
        const state = stateForParticipant(ref, preferred);
        if (!state || Array.isArray(state.position)) return;
        const side = index % 2 ? 1 : -1;
        assign(state, [reference.position[0] + side * policy.relation_separation_x, reference.position[1] - 0.8 - Math.floor(index / 2) * 0.7], "numerical_relation_participant", [`action:${action.id}`]);
      });
    });

    (plan.visual_primitives || []).filter((primitive) => ["movement_path", "dribble_path"].includes(primitive.type)).forEach((primitive) => {
      const from = states.get(primitive.from_state_ref), to = states.get(primitive.to_state_ref);
      if (!from || !to) return;
      if (Array.isArray(from.position) && !Array.isArray(to.position)) assign(to, [from.position[0], from.position[1] - policy.staging_offset_y], "movement_from_origin", [`primitive:${primitive.id}`]);
      else if (!Array.isArray(from.position) && Array.isArray(to.position)) assign(from, [to.position[0], to.position[1] + policy.staging_offset_y], "movement_to_destination", [`primitive:${primitive.id}`]);
    });

    spaces.forEach((space) => {
      const anchor = spaceAnchors.get(space.id);
      if (!anchor) return;
      const explicitStates = [...states.values()].filter((state) => state.space_ref === space.id && Array.isArray(state.position) && String(state.layout_decision_ref || "").startsWith("LAYOUT_EXPLICIT_"));
      explicitStates.forEach((state) => {
        if (Math.abs(state.position[0] - anchor[0]) <= 4.5) return;
        diagnostics.push({ code: "MANUAL_ANCHOR_RELATION_CONFLICT", severity: "error", path: `/participant_states/${state.id}/position`, message: `${state.id} queda fora de la relació espacial ${space.id}.`, state_ref: state.id, space_ref: space.id, source_refs: sourceRefs(state) });
      });
    });

    return { states, spaceAnchors, decisions, diagnostics, policy };
  }

  function enumerateObligations(plan) {
    const obligations = [];
    (plan.visual_primitives || []).forEach((primitive) => obligations.push({
      id: `OBLIGATION_PRIMITIVE_${primitive.id}`,
      kind: "visual_primitive",
      action_ref: primitive.action_ref || null,
      target_ref: primitive.id,
      required: true,
      status: "pending",
      geometry_refs: [],
      source_refs: sourceRefs(primitive)
    }));
    (plan.actions || []).filter((action) => action.operator_id === "reception" && action.in_motion).forEach((action) => obligations.push({
      id: `OBLIGATION_RECEPTION_${action.id}`,
      kind: "shared_reception_state",
      action_ref: action.id,
      target_ref: action.state_ref,
      required: true,
      status: "pending",
      geometry_refs: [],
      source_refs: sourceRefs(action)
    }));
    (plan.actions || []).filter((action) => action.operator_id === "numerical_relation").forEach((action) => obligations.push({
      id: `OBLIGATION_RELATION_${action.id}`,
      kind: "numerical_relation_state",
      action_ref: action.id,
      target_ref: action.id,
      required: true,
      status: "pending",
      geometry_refs: [],
      source_refs: sourceRefs(action)
    }));
    (plan.constraints || []).filter((constraint) => constraint.type === "SURPASSES_DEFENSIVE_LINE").forEach((constraint) => obligations.push({
      id: `OBLIGATION_CONSTRAINT_${constraint.id}`,
      kind: "surpasses_defensive_line",
      action_ref: constraint.action_ref || null,
      target_ref: constraint.id,
      required: true,
      status: "pending",
      geometry_refs: [],
      source_refs: sourceRefs(constraint)
    }));
    return obligations;
  }

  function resolve(plan, tacticalIR, profile, options) {
    const layout = statePositions(plan, tacticalIR, profile, options && options.layout_policy);
    const positions = layout.states;
    const participants = new Map((tacticalIR.participants || []).map((item) => [item.id, item]));
    const entities = [];
    const participantStates = [];
    const dependencies = [];
    const commonPaths = [];
    const diagnostics = layout.diagnostics.slice();
    const obligations = enumerateObligations(plan);
    const firstStateByParticipant = new Map();

    (plan.participant_states || []).forEach((state) => {
      const resolved = positions.get(state.id);
      if (!resolved || !Array.isArray(resolved.position)) return;
      participantStates.push({ ...utils.deepClone(resolved), status: state.status || "future", visibility: structuralOnly(participants.get(state.participant_ref)) ? "control" : "normal" });
      if (!firstStateByParticipant.has(state.participant_ref) || state.state_key === "S0") firstStateByParticipant.set(state.participant_ref, state.id);
    });
    [...participants.values()].sort((a, b) => a.id.localeCompare(b.id)).forEach((participant) => {
      if (structuralOnly(participant)) return;
      const stateRef = firstStateByParticipant.get(participant.id);
      const state = stateRef && positions.get(stateRef);
      if (!state || !Array.isArray(state.position)) return;
      entities.push({
        id: participant.id,
        kind: participantKind(participant),
        label: participant.label || participant.id,
        position: state.position.slice(),
        state_ref: stateRef,
        status: "derived",
        presence: participant.presence || "explicit",
        source_refs: sourceRefs(participant)
      });
    });

    function addDependency(stateRef, effectRef) {
      if (!stateRef) return;
      let dependency = dependencies.find((item) => item.trigger_ref === `geometry:participant_state:${stateRef}`);
      if (!dependency) {
        dependency = { id: `DEP_${stateRef}`, trigger_ref: `geometry:participant_state:${stateRef}`, effect_refs: [], rule: "state_drives_geometry" };
        dependencies.push(dependency);
      }
      if (!dependency.effect_refs.includes(effectRef)) dependency.effect_refs.push(effectRef);
    }
    entities.forEach((entity) => addDependency(entity.state_ref, `geometry:entity:${entity.id}`));

    function statePoint(ref) {
      const state = ref && (positions.get(ref) || [...positions.values()].find((candidate) => candidate.participant_ref === ref && Array.isArray(candidate.position)));
      return state && Array.isArray(state.position) ? state.position : null;
    }
    function addDiagnostic(code, primitive, message, severity) {
      diagnostics.push({ code, severity: severity || "pending", path: `/visual_primitives/${primitive.id}`, message, action_ref: primitive.action_ref || null, primitive_ref: primitive.id, source_refs: sourceRefs(primitive) });
    }
    function addPath(primitive, kind, start, end, extra) {
      const id = `PATH_${primitive.id}`;
      const path = {
        id,
        kind,
        action_type: kind === "pass" ? "pass" : kind === "shot" ? "shot" : kind === "block" ? "block" : "movement",
        segments: [line(start, end)],
        functional_points: [],
        source_refs: sourceRefs(primitive),
        action_ref: primitive.action_ref,
        ...(extra || {})
      };
      commonPaths.push(path);
      addDependency(path.from_state_ref, `geometry:common_path:${id}`);
      addDependency(path.to_state_ref, `geometry:common_path:${id}`);
      return path;
    }

    (plan.visual_primitives || []).forEach((primitive) => {
      if (primitive.type === "pass_path") {
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref);
        if (!start || !end) { addDiagnostic("GEOMETRY_PASS_POSITION_MISSING", primitive, "Falten posicions justificades de l’emissor o del receptor."); return; }
        addPath(primitive, "pass", start, end, {
          ball_ref: primitive.ball_ref,
          from_participant_ref: primitive.from_participant_ref,
          from_state_ref: primitive.from_state_ref,
          to_participant_ref: primitive.to_participant_ref,
          to_state_ref: primitive.to_state_ref,
          anchor_mode: "symbol_perimeter"
        });
      } else if (primitive.type === "movement_path" || primitive.type === "dribble_path") {
        if (primitive.geometry_support === "unresolved") { addDiagnostic("GEOMETRY_ACTION_UNSUPPORTED", primitive, "La composició és coneguda, però la geometria universal d’aquesta acció encara no està resolta."); return; }
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref);
        if (!start || !end) { addDiagnostic("GEOMETRY_MOVEMENT_POSITION_MISSING", primitive, "Falta una relació espacial suficient per ubicar l’origen o el destí."); return; }
        addPath(primitive, primitive.type === "dribble_path" ? "dribble" : primitive.kind || "movement_without_ball", start, end, {
          actor_ref: primitive.actor_ref,
          from_state_ref: primitive.from_state_ref,
          to_state_ref: primitive.to_state_ref
        });
      } else if (primitive.type === "shot_path") {
        const start = statePoint(primitive.from_state_ref);
        if (!start) { addDiagnostic("GEOMETRY_SHOT_POSITION_MISSING", primitive, "Falta la posició de llançament."); return; }
        addPath(primitive, "shot", start, [profile.court.width_m / 2, 0], { actor_ref: primitive.actor_ref, from_state_ref: primitive.from_state_ref, target_goal_ref: primitive.target_goal_ref, ball_ref: primitive.ball_ref });
      } else if (primitive.type === "feint_path") {
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref), opponent = statePoint(primitive.opponent_ref);
        const initialAnchor = layout.spaceAnchors.get(primitive.initial_space_ref), targetAnchor = layout.spaceAnchors.get(primitive.target_space_ref);
        if (!start || !end || !opponent || !initialAnchor || !targetAnchor) { addDiagnostic("GEOMETRY_FEINT_RELATION_MISSING", primitive, "La finta necessita origen, sortida, defensor i dos espais contigus resolts."); return; }
        const direction = Math.sign(targetAnchor[0] - initialAnchor[0]) || Math.sign(end[0] - start[0]) || 1;
        const breakPoint = rounded([opponent[0] - direction * 0.28, opponent[1] + 0.42]);
        const exitPoint = rounded([opponent[0] + direction * 1.15, opponent[1] - 0.72]);
        const id = `PATH_${primitive.id}`;
        const path = {
          id,
          kind: "feint",
          action_type: "movement",
          actor_ref: primitive.actor_ref,
          from_state_ref: primitive.from_state_ref,
          to_state_ref: primitive.to_state_ref,
          segments: [line(start, breakPoint), line(breakPoint, exitPoint), line(exitPoint, end)],
          functional_points: [
            { id: `${id}_COMMITMENT`, role: "commitment", position: breakPoint.slice() },
            { id: `${id}_DIRECTION_BREAK`, role: "direction_break", position: breakPoint.slice() },
            { id: `${id}_EXIT`, role: "exit", position: exitPoint.slice() }
          ],
          opponent_ref: primitive.opponent_ref,
          initial_space_ref: primitive.initial_space_ref,
          target_space_ref: primitive.target_space_ref,
          source_refs: sourceRefs(primitive),
          action_ref: primitive.action_ref
        };
        commonPaths.push(path);
        addDependency(path.from_state_ref, `geometry:common_path:${id}`);
        addDependency(path.to_state_ref, `geometry:common_path:${id}`);
      } else if (primitive.type === "blocking_mark") {
        const blockerState = (plan.participant_states || []).find((state) => state.participant_ref === primitive.blocker_ref && statePoint(state.id));
        const defenderState = (plan.participant_states || []).find((state) => state.participant_ref === primitive.blocked_defender_ref && statePoint(state.id));
        if (!blockerState || !defenderState) { addDiagnostic("GEOMETRY_BLOCK_POSITION_MISSING", primitive, "Falten posicions relacionals per orientar la marca de bloqueig."); return; }
        addPath(primitive, "block", statePoint(blockerState.id), statePoint(defenderState.id), { actor_ref: primitive.blocker_ref, from_state_ref: blockerState.id, to_state_ref: defenderState.id, blocked_defender_ref: primitive.blocked_defender_ref });
      }
    });

    const pathByPrimitive = new Map(commonPaths.map((path) => [path.id.replace(/^PATH_/, ""), path]));
    obligations.forEach((obligation) => {
      if (obligation.kind === "visual_primitive") {
        const path = pathByPrimitive.get(obligation.target_ref);
        if (path) { obligation.status = "resolved"; obligation.geometry_refs = [`geometry:common_path:${path.id}`]; }
      } else if (obligation.kind === "shared_reception_state") {
        const action = (plan.actions || []).find((item) => item.id === obligation.action_ref);
        const pass = (plan.actions || []).find((item) => item.operator_id === "pass" && item.to_state_ref === action.state_ref);
        const state = positions.get(action.state_ref);
        if (pass && state && Array.isArray(state.position) && pass.to_state_ref === action.state_ref) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:participant_state:${state.id}`];
        }
      } else if (obligation.kind === "numerical_relation_state") {
        const action = (plan.actions || []).find((item) => item.id === obligation.action_ref);
        const stateRefs = action && action.state_refs || [];
        if (stateRefs.length && stateRefs.every((ref) => statePoint(ref))) {
          obligation.status = "resolved";
          obligation.geometry_refs = stateRefs.map((ref) => `geometry:participant_state:${ref}`);
        }
      } else if (obligation.kind === "surpasses_defensive_line") {
        const constraint = (plan.constraints || []).find((item) => item.id === obligation.target_ref);
        const state = constraint && statePoint(constraint.subject_refs[0]);
        const defender = constraint && statePoint(constraint.object_refs[0]);
        if (state && defender && state[1] < defender[1]) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:participant_state:${constraint.subject_refs[0]}`];
        }
      }
    });
    obligations.filter((item) => item.status !== "resolved").forEach((item) => diagnostics.push({
      code: "GEOMETRY_OBLIGATION_PENDING",
      severity: "pending",
      path: `/obligations/${item.id}`,
      message: `No s’ha pogut resoldre l’obligació ${item.kind}.`,
      action_ref: item.action_ref,
      obligation_ref: item.id,
      source_refs: item.source_refs
    }));

    const required = obligations.filter((item) => item.required);
    const resolved = required.filter((item) => item.status === "resolved");
    const incompatible = diagnostics.filter((item) => item.severity === "error");
    const status = incompatible.length ? "blocked" : resolved.length === required.length ? "ready" : commonPaths.length || entities.length ? "partial" : "needs_input";
    const geometry = commonPaths.length || entities.length ? {
      $schema: SCHEMA_REF,
      meta: {
        format: "TRACA_general_geometry",
        version: GEOMETRY_VERSION,
        case_id: tacticalIR.meta.case_id || "CASE",
        source_revision: tacticalIR.meta.source_revision || null,
        status: status === "ready" ? "resolved" : status,
        authority: "provisional_visual_policy",
        composition_fingerprint: plan.meta.fingerprint,
        canonical_promotion: false,
        court_profile_ref: profile.meta && `${profile.meta.id}@${profile.meta.version}` || "court_profile"
      },
      court: court(profile),
      layout_policy: {
        id: layout.policy.id,
        version: layout.policy.version,
        status: "provisional_render_policy",
        coordinate_system: "metres_origin_goal_line_left",
        attack_direction: "negative_y",
        notes: [
          "Distribució derivada de delimitadors, espais, dependències d’acció i relacions numèriques.",
          "Les distàncies són una política visual versionada i no coneixement tàctic."
        ],
        decisions: layout.decisions
      },
      zones: [],
      spaces: [...new Map((tacticalIR.spaces || []).map((space) => [space.id, space])).values()].filter((space) => layout.spaceAnchors.has(space.id)).map((space) => {
        const anchor = layout.spaceAnchors.get(space.id);
        return {
          id: space.id,
          kind: "relational_tactical_space",
          relation: { type: space.relation && space.relation.type || "between", delimiter_refs: delimiterRefs(space) },
          anchor: anchor.slice(),
          calculation_region: [
            rounded([anchor[0] - 0.45, anchor[1] - 0.45]), rounded([anchor[0] + 0.45, anchor[1] - 0.45]),
            rounded([anchor[0] + 0.45, anchor[1] + 0.45]), rounded([anchor[0] - 0.45, anchor[1] + 0.45])
          ],
          render_policy: "hidden",
          source_refs: sourceRefs(space)
        };
      }),
      objects: [],
      phases: [],
      entities,
      participant_states: participantStates,
      common_paths: commonPaths,
      branches: [],
      dependencies,
      obligations,
      diagnostics,
      result: {
        status,
        obligations_total: required.length,
        obligations_resolved: resolved.length,
        obligations_pending: required.length - resolved.length,
        incompatible_count: incompatible.length
      },
      traceability: [
        ...entities.map((entity) => ({ geometry_ref: `geometry:entity:${entity.id}`, source_refs: entity.source_refs || [] })),
        ...commonPaths.map((path) => ({ geometry_ref: `geometry:common_path:${path.id}`, action_ref: path.action_ref, primitive_ref: path.id.replace(/^PATH_/, ""), source_refs: path.source_refs || [] }))
      ]
    } : null;
    return {
      status,
      geometry,
      unresolved: diagnostics.filter((item) => item.severity !== "info").map((item) => ({ code: item.code, action_ref: item.action_ref || null, primitive_ref: item.primitive_ref || null, reason: item.message })),
      obligations,
      diagnostics,
      coverage: {
        visual_primitives_total: (plan.visual_primitives || []).length,
        visual_primitives_resolved: (plan.visual_primitives || []).filter((primitive) => pathByPrimitive.has(primitive.id)).length,
        visual_primitives_unresolved: (plan.visual_primitives || []).filter((primitive) => !pathByPrimitive.has(primitive.id)).length,
        obligations_total: required.length,
        obligations_resolved: resolved.length,
        obligations_pending: required.length - resolved.length
      }
    };
  }

  function adaptLegacyGeometry(legacy) {
    if (!legacy || !legacy.meta) throw new Error("LEGACY_GEOMETRY_INVALID");
    if (legacy.meta.format === "TRACA_general_geometry" && legacy.meta.version === GEOMETRY_VERSION) return utils.deepClone(legacy);
    const adapted = utils.deepClone(legacy);
    const sourceVersion = legacy.meta.version || "unknown";
    adapted.$schema = SCHEMA_REF;
    adapted.meta = {
      format: "TRACA_general_geometry",
      version: GEOMETRY_VERSION,
      case_id: legacy.meta.exercise_id || legacy.meta.case_id || "CASE",
      source_revision: legacy.meta.source_spatial_digest || null,
      status: "resolved",
      authority: "legacy_canonical_adapter",
      composition_fingerprint: legacy.meta.source_spatial_digest || `legacy:${sourceVersion}`,
      canonical_promotion: false,
      court_profile_ref: legacy.meta.court_profile_ref || "legacy:court_profile",
      adapted_from: { format: legacy.meta.format || "unknown", version: sourceVersion }
    };
    adapted.layout_policy = { ...adapted.layout_policy, version: sourceVersion, decisions: [], notes: [...(adapted.layout_policy.notes || []), `Adaptat explícitament des del contracte ${sourceVersion}.`] };
    adapted.objects = adapted.objects || [];
    adapted.phases = adapted.phases || [];
    adapted.obligations = [
      ...(adapted.common_paths || []).map((path) => ({ id: `OBLIGATION_LEGACY_PATH_${path.id}`, kind: "legacy_path", action_ref: path.action_ref || null, target_ref: path.id, required: true, status: "resolved", geometry_refs: [`geometry:common_path:${path.id}`], source_refs: sourceRefs(path) })),
      ...(adapted.branches || []).map((branch) => ({ id: `OBLIGATION_LEGACY_BRANCH_${branch.id}`, kind: "legacy_branch", action_ref: null, target_ref: branch.id, required: true, status: "resolved", geometry_refs: [`geometry:branch:${branch.id}`], source_refs: unique([branch.source_ref, "derived:legacy_adapter"]) }))
    ];
    adapted.diagnostics = [];
    adapted.result = { status: "ready", obligations_total: adapted.obligations.length, obligations_resolved: adapted.obligations.length, obligations_pending: 0, incompatible_count: 0 };
    (adapted.entities || []).forEach((entity) => { entity.source_refs = entity.source_refs || unique([entity.source_ref, "derived:legacy_adapter"]); entity.presence = entity.presence || "explicit"; delete entity.source_ref; });
    (adapted.spaces || []).forEach((space) => { space.source_refs = space.source_refs || unique([space.source_ref, "derived:legacy_adapter"]); delete space.source_ref; delete space.zone_ref; delete space.defender_ref; });
    return adapted;
  }

  return {
    GEOMETRY_VERSION,
    SCHEMA_REF,
    DEFAULT_POLICY,
    orderedDelimiterRefs,
    statePositions,
    enumerateObligations,
    adaptLegacyGeometry,
    resolve
  };
});
