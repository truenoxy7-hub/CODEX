(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_GENERIC_GEOMETRY_RESOLVER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function rounded(point) { return point.map((value) => Number(Number(value).toFixed(3))); }
  function line(start, end) { return { type: "line", start: rounded(start), end: rounded(end) }; }
  function court(profile) {
    return {
      width_m: profile.court.width_m, half_length_m: profile.court.half_length_m,
      goal: utils.deepClone(profile.goal), markings: utils.deepClone(profile.markings),
      view_box: [-0.8, -1.0, 21.6, 21.8]
    };
  }

  function participantKind(participant) {
    if (participant.kind === "defender" || participant.team === "defense" || /^D\d|DAV/.test(participant.id)) return "defender";
    return participant.kind === "goalkeeper" ? "goalkeeper" : "attacker";
  }

  function statePositions(plan, tacticalIR) {
    const states = new Map((plan.participant_states || []).map((state) => [state.id, utils.deepClone(state)]));
    const spaces = new Map((tacticalIR.spaces || []).map((space) => [space.id, space]));
    const participantStates = new Map();
    states.forEach((state) => {
      if (!participantStates.has(state.participant_ref)) participantStates.set(state.participant_ref, []);
      participantStates.get(state.participant_ref).push(state);
    });
    function positionOfRef(ref) {
      if (states.has(ref) && Array.isArray(states.get(ref).position)) return states.get(ref).position;
      const candidates = participantStates.get(ref) || [];
      const explicit = candidates.find((state) => Array.isArray(state.position));
      return explicit && explicit.position || null;
    }
    let changed = true;
    while (changed) {
      changed = false;
      states.forEach((state) => {
        if (Array.isArray(state.position)) return;
        if (state.functional_position_ref) {
          const inherited = positionOfRef(state.functional_position_ref);
          if (inherited) { state.position = inherited.slice(); changed = true; return; }
        }
        const space = spaces.get(state.space_ref);
        if (!space) return;
        if (Array.isArray(space.anchor_position)) { state.position = space.anchor_position.slice(); changed = true; return; }
        const delimiters = space.delimiter_state_refs || space.delimiter_refs || space.relation && space.relation.delimiter_refs || [];
        const points = delimiters.map(positionOfRef).filter(Boolean);
        if (delimiters.length === 2 && points.length === 2) {
          state.position = rounded([(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2]);
          changed = true;
        }
      });
    }
    return states;
  }

  function resolve(plan, tacticalIR, profile) {
    const positions = statePositions(plan, tacticalIR);
    const participants = new Map((tacticalIR.participants || []).map((item) => [item.id, item]));
    const entities = [];
    const participantStates = [];
    const dependencies = [];
    const commonPaths = [];
    const unresolved = [];

    const firstStateByParticipant = new Map();
    (plan.participant_states || []).forEach((state) => {
      const resolved = positions.get(state.id);
      if (!resolved || !Array.isArray(resolved.position)) return;
      participantStates.push({ ...utils.deepClone(resolved), status: state.status || "future", visibility: "normal" });
      if (!firstStateByParticipant.has(state.participant_ref) || state.state_key === "S0") firstStateByParticipant.set(state.participant_ref, state.id);
    });
    [...participants.values()].sort((a, b) => a.id.localeCompare(b.id)).forEach((participant) => {
      const stateRef = firstStateByParticipant.get(participant.id);
      const state = stateRef && positions.get(stateRef);
      if (!state || !Array.isArray(state.position)) return;
      entities.push({
        id: participant.id, kind: participantKind(participant), label: participant.label || participant.id,
        position: state.position.slice(), state_ref: stateRef, status: "derived",
        source_refs: utils.deepClone(participant.source_refs || [])
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
      const state = ref && positions.get(ref);
      return state && Array.isArray(state.position) ? state.position : null;
    }
    function addPath(primitive, kind, start, end, extra) {
      const id = `PATH_${primitive.id}`;
      const path = {
        id, kind, action_type: kind === "pass" ? "pass" : kind === "shot" ? "shot" : kind === "block" ? "block" : "movement",
        segments: [line(start, end)], functional_points: [], source_refs: utils.deepClone(primitive.source_refs || []),
        action_ref: primitive.action_ref, ...(extra || {})
      };
      commonPaths.push(path);
      addDependency(path.from_state_ref, `geometry:common_path:${id}`);
      addDependency(path.to_state_ref, `geometry:common_path:${id}`);
      return path;
    }

    (plan.visual_primitives || []).forEach((primitive) => {
      if (primitive.type === "pass_path") {
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref);
        if (!start || !end) { unresolved.push({ primitive_ref: primitive.id, reason: "Falten posicions justificades de l’emissor o del receptor." }); return; }
        addPath(primitive, "pass", start, end, {
          ball_ref: primitive.ball_ref, from_participant_ref: primitive.from_participant_ref, from_state_ref: primitive.from_state_ref,
          to_participant_ref: primitive.to_participant_ref, to_state_ref: primitive.to_state_ref, anchor_mode: "symbol_perimeter"
        });
      } else if (primitive.type === "movement_path" || primitive.type === "dribble_path") {
        if (primitive.geometry_support === "unresolved") { unresolved.push({ primitive_ref: primitive.id, reason: "La composició és coneguda, però la geometria universal d’aquesta acció encara no està resolta." }); return; }
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref);
        if (!start || !end) { unresolved.push({ primitive_ref: primitive.id, reason: "Falta una relació espacial suficient per ubicar l’origen o el destí." }); return; }
        addPath(primitive, primitive.type === "dribble_path" ? "dribble" : primitive.kind || "movement_without_ball", start, end, {
          actor_ref: primitive.actor_ref, from_state_ref: primitive.from_state_ref, to_state_ref: primitive.to_state_ref
        });
      } else if (primitive.type === "shot_path") {
        const start = statePoint(primitive.from_state_ref);
        if (!start) { unresolved.push({ primitive_ref: primitive.id, reason: "Falta la posició de llançament." }); return; }
        addPath(primitive, "shot", start, [profile.court.width_m / 2, 0], { actor_ref: primitive.actor_ref, from_state_ref: primitive.from_state_ref, target_goal_ref: primitive.target_goal_ref, ball_ref: primitive.ball_ref });
      } else if (primitive.type === "feint_path") {
        const start = statePoint(primitive.from_state_ref), end = statePoint(primitive.to_state_ref);
        const waypoints = primitive.waypoints || [];
        if (!start || !end || waypoints.length < 2) { unresolved.push({ primitive_ref: primitive.id, reason: "La finta és composta, però falta geometria explícita per preservar aproximació, ruptura i sortida." }); return; }
        const breakPoint = waypoints[0], exitPoint = waypoints[1];
        const id = `PATH_${primitive.id}`;
        const path = {
          id, kind: "feint", action_type: "movement", actor_ref: primitive.actor_ref,
          from_state_ref: primitive.from_state_ref, to_state_ref: primitive.to_state_ref,
          segments: [line(start, breakPoint), line(breakPoint, exitPoint), line(exitPoint, end)],
          functional_points: [{ role: "direction_break", position: rounded(breakPoint) }, { role: "exit", position: rounded(exitPoint) }],
          opponent_ref: primitive.opponent_ref, source_refs: utils.deepClone(primitive.source_refs || []), action_ref: primitive.action_ref
        };
        commonPaths.push(path); addDependency(path.from_state_ref, `geometry:common_path:${id}`); addDependency(path.to_state_ref, `geometry:common_path:${id}`);
      } else if (primitive.type === "blocking_mark") {
        const blockerState = (plan.participant_states || []).find((state) => state.participant_ref === primitive.blocker_ref && statePoint(state.id));
        const defenderState = (plan.participant_states || []).find((state) => state.participant_ref === primitive.blocked_defender_ref && statePoint(state.id));
        if (!blockerState || !defenderState) { unresolved.push({ primitive_ref: primitive.id, reason: "Falten posicions relacionals per orientar la marca de bloqueig." }); return; }
        addPath(primitive, "block", statePoint(blockerState.id), statePoint(defenderState.id), { actor_ref: primitive.blocker_ref, from_state_ref: blockerState.id, to_state_ref: defenderState.id, blocked_defender_ref: primitive.blocked_defender_ref });
      }
    });

    const visualCount = (plan.visual_primitives || []).length;
    const resolvedCount = commonPaths.length;
    const status = unresolved.length ? resolvedCount || entities.length ? "partial" : "needs_input" : "ready";
    const geometry = resolvedCount || entities.length ? {
      meta: {
        format: "TRACA_composed_geometry", version: "0.2.0", exercise_id: tacticalIR.meta.case_id || "CASE",
        status: status === "ready" ? "resolved" : "partial", authority: "explicit_spatial_constraints",
        composition_fingerprint: plan.meta.fingerprint, canonical_promotion: false
      },
      court: court(profile),
      layout_policy: { id: "generic_constraint_resolver_v0.1", status: "deterministic", coordinate_system: "metres_origin_goal_line_left", attack_direction: "negative_y", notes: ["Només utilitza posicions explícites o derivades de constraints resolts."] },
      zones: [], spaces: (tacticalIR.spaces || []).filter((space) => Array.isArray(space.anchor_position)).map((space) => ({ id: space.id, anchor: space.anchor_position.slice(), render_policy: "hidden", source_refs: space.source_refs || [] })),
      entities, participant_states: participantStates, common_paths: commonPaths, branches: [], dependencies,
      traceability: [
        ...entities.map((entity) => ({ geometry_ref: `geometry:entity:${entity.id}`, source_refs: entity.source_refs || [] })),
        ...commonPaths.map((path) => ({ geometry_ref: `geometry:common_path:${path.id}`, action_ref: path.action_ref, primitive_ref: path.id.replace(/^PATH_/, ""), source_refs: path.source_refs || [] }))
      ]
    } : null;
    return { status, geometry, unresolved, coverage: { visual_primitives_total: visualCount, visual_primitives_resolved: resolvedCount, visual_primitives_unresolved: unresolved.length } };
  }

  return { statePositions, resolve };
});
