(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const courtGeometry = isNode ? require("./court-geometry.js") : root.TRACA_COURT_GEOMETRY;
  const api = factory(utils, courtGeometry);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_GENERIC_GEOMETRY_RESOLVER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, courtGeometry) {
  "use strict";

  const GEOMETRY_VERSION = "0.4.0";
  const SCHEMA_REF = "../../schema/traca.geometry.schema.v0.4.json";
  const DEFAULT_POLICY = Object.freeze({
    id: "generic_relational_layout_v0.4",
    version: "0.4.0",
    defensive_area_clearance_m: 1.5,
    minimum_defensive_depth_m: 6.8,
    reception_free_throw_offset_m: 0.9,
    ground_symbol_clearance_m: 0.48,
    surpass_depth_m: 0.5,
    staging_offset_y: 3.0,
    feint_contact_distance_m: 0.9,
    feint_break_lateral_m: 1.05,
    feint_break_depth_m: 0.4,
    feint_bypass_depth_m: 0.9,
    feint_exit_lateral_m: 0.8,
    feint_min_turn_degrees: 28,
    defender_path_clearance_m: 0.58,
    relation_support_distance_m: 1.45,
    relation_min_attacker_separation_m: 1.4,
    relation_max_defender_distance_m: 3.4,
    ball_offset_m: 0.48
  });

  function rounded(point) { return point.map((value) => Number(Number(value).toFixed(3))); }
  function line(start, end) { return { type: "line", start: rounded(start), end: rounded(end) }; }
  function distance(left, right) { return Math.hypot(left[0] - right[0], left[1] - right[1]); }
  function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
  function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
  function sourceRefs(item) { return unique(item && item.source_refs || ["derived:generic_geometry"]); }

  function court(profile, viewBox) {
    return {
      width_m: profile.court.width_m,
      half_length_m: profile.court.half_length_m,
      goal: utils.deepClone(profile.goal),
      markings: utils.deepClone(profile.markings),
      view_box: viewBox || [-0.8, -1.0, profile.court.width_m + 1.6, profile.court.half_length_m + 1.8]
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
        const x = start + step * index;
        const y = Math.max(
          policy.minimum_defensive_depth_m,
          courtGeometry.goalAreaBoundaryY(profile, x) + policy.defensive_area_clearance_m
        );
        assign(state, [x, y], "court_aware_relational_delimiter", [`relation:delimiter:${ref}`, `court:${profile.meta && profile.meta.id || "profile"}`]);
      });
    }

    const spaceAnchors = new Map();
    const spaceRegions = new Map();
    spaces.forEach((space) => {
      if (Array.isArray(space.anchor_position)) spaceAnchors.set(space.id, space.anchor_position.slice());
      const refs = delimiterRefs(space);
      const points = refs.map(positionOfRef).filter(Boolean);
      if (!spaceAnchors.has(space.id) && refs.length === 2 && points.length === 2) {
        spaceAnchors.set(space.id, rounded([(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2]));
      }
      const anchor = spaceAnchors.get(space.id);
      if (!anchor) return;
      const xValues = points.length === 2 ? points.map((point) => point[0]) : [anchor[0] - 1, anchor[0] + 1];
      const left = Math.min(...xValues) + 0.38;
      const right = Math.max(...xValues) - 0.38;
      const defenseY = points.length ? points.reduce((total, point) => total + point[1], 0) / points.length : anchor[1];
      const reception = rounded([
        anchor[0],
        Math.max(courtGeometry.freeThrowBoundaryY(profile, anchor[0]) + policy.reception_free_throw_offset_m, defenseY + 2)
      ]);
      const threat = rounded([anchor[0], defenseY + policy.feint_contact_distance_m]);
      const exit = rounded([
        anchor[0],
        Math.max(
          courtGeometry.minimumGroundCenterY(profile, anchor[0], policy.ground_symbol_clearance_m),
          defenseY - policy.surpass_depth_m
        )
      ]);
      spaceRegions.set(space.id, {
        calculation_region: [
          rounded([left, courtGeometry.minimumGroundCenterY(profile, left, policy.ground_symbol_clearance_m)]),
          rounded([right, courtGeometry.minimumGroundCenterY(profile, right, policy.ground_symbol_clearance_m)]),
          rounded([right, Math.max(reception[1], courtGeometry.freeThrowBoundaryY(profile, right) + policy.reception_free_throw_offset_m)]),
          rounded([left, Math.max(reception[1], courtGeometry.freeThrowBoundaryY(profile, left) + policy.reception_free_throw_offset_m)])
        ],
        functional_anchors: { reception, threat, exit },
        defensive_depth_m: Number(defenseY.toFixed(3))
      });
    });

    (plan.constraints || []).filter((constraint) => constraint.type === "ATTACKS" && constraint.status !== "conflict").forEach((constraint) => {
      const state = states.get(constraint.subject_refs && constraint.subject_refs[0]);
      const spaceRef = constraint.object_refs && constraint.object_refs[0];
      if (state && !state.space_ref && spaces.has(spaceRef)) state.space_ref = spaceRef;
    });

    const actions = plan.actions || [];
    states.forEach((state) => {
      if (Array.isArray(state.position) || !state.space_ref || !spaceAnchors.has(state.space_ref)) return;
      const region = spaceRegions.get(state.space_ref);
      const anchor = spaceAnchors.get(state.space_ref);
      const exitsFeint = actions.some((action) => action.operator_id === "feint" && action.to_state_ref === state.id);
      const receivesOrAttacks = actions.some((action) => (action.operator_id === "reception" && action.state_ref === state.id) || (action.operator_id === "feint" && action.from_state_ref === state.id));
      const position = region
        ? exitsFeint ? region.functional_anchors.exit : receivesOrAttacks ? region.functional_anchors.reception : region.functional_anchors.threat
        : anchor;
      assign(state, position, exitsFeint ? "legal_space_exit_after_defensive_line" : "functional_space_anchor", [`space:${state.space_ref}`]);
    });

    actions.filter((action) => action.operator_id === "pass" && action.status === "composed").forEach((action, index) => {
      const from = states.get(action.from_state_ref), to = states.get(action.to_state_ref);
      const center = profile.court.width_m / 2;
      const receptionDepth = courtGeometry.freeThrowBoundaryY(profile, center) + policy.reception_free_throw_offset_m;
      if (from && to && !Array.isArray(from.position) && !Array.isArray(to.position)) {
        assign(to, [center + 1.7, receptionDepth], "pass_relation_receiver", [`action:${action.id}`]);
        assign(from, [center - 1.7, receptionDepth + policy.staging_offset_y], "pass_relation_sender", [`action:${action.id}`]);
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

    const actionsById = new Map(actions.map((action) => [action.id, action]));
    actions.filter((action) => action.operator_id === "numerical_relation" && action.status === "composed").forEach((action) => {
      const preferred = action.state_refs || [];
      const defenders = (action.defender_refs || []).map((ref) => stateForParticipant(ref, preferred)).filter(Boolean);
      const reference = defenders.find((state) => Array.isArray(state.position));
      const predecessors = (action.after || []).map((ref) => actionsById.get(ref)).filter(Boolean);
      const primaryRef = predecessors.map((candidate) => candidate.actor_ref).find((ref) => (action.attacker_refs || []).includes(ref));
      const primary = primaryRef && stateForParticipant(primaryRef, preferred);
      const companions = (action.attacker_refs || []).filter((ref) => ref !== primaryRef);
      if (!reference || !primary || !Array.isArray(primary.position) || defenders.length !== 1 || companions.length !== 1) return;
      const companion = stateForParticipant(companions[0], preferred);
      if (!companion || Array.isArray(companion.position)) return;
      const side = Math.sign(reference.position[0] - primary.position[0]) || 1;
      const x = reference.position[0] + side * policy.relation_support_distance_m;
      const y = Math.max(
        courtGeometry.minimumGroundCenterY(profile, x, policy.ground_symbol_clearance_m),
        primary.position[1] + 0.15
      );
      assign(companion, [x, y], "connected_two_v_one_support", [`action:${action.id}`, `predecessor:${predecessors[0] && predecessors[0].id || "none"}`]);
    });

    (plan.visual_primitives || []).filter((primitive) => ["movement_path", "dribble_path"].includes(primitive.type)).forEach((primitive) => {
      const from = states.get(primitive.from_state_ref), to = states.get(primitive.to_state_ref);
      if (!from || !to) return;
      if (Array.isArray(from.position) && !Array.isArray(to.position)) assign(to, [from.position[0], from.position[1] - policy.staging_offset_y], "movement_from_origin", [`primitive:${primitive.id}`]);
      else if (!Array.isArray(from.position) && Array.isArray(to.position)) assign(from, [to.position[0], to.position[1] + policy.staging_offset_y], "movement_to_destination", [`primitive:${primitive.id}`]);
    });

    spaces.forEach((space) => {
      const region = spaceRegions.get(space.id);
      if (!region) return;
      const xValues = region.calculation_region.map((point) => point[0]);
      const left = Math.min(...xValues), right = Math.max(...xValues);
      const explicitStates = [...states.values()].filter((state) => state.space_ref === space.id && Array.isArray(state.position) && String(state.layout_decision_ref || "").startsWith("LAYOUT_EXPLICIT_"));
      explicitStates.forEach((state) => {
        if (state.position[0] >= left - 0.4 && state.position[0] <= right + 0.4) return;
        diagnostics.push({ code: "MANUAL_ANCHOR_RELATION_CONFLICT", severity: "error", path: `/participant_states/${state.id}/position`, message: `${state.id} queda fora de la relació espacial ${space.id}.`, state_ref: state.id, space_ref: space.id, source_refs: sourceRefs(state) });
      });
    });

    return { states, spaceAnchors, spaceRegions, decisions, diagnostics, policy };
  }

  function enumerateObligations(plan) {
    const obligations = [];
    (plan.visual_primitives || []).forEach((primitive) => {
      obligations.push({
        id: `OBLIGATION_PRIMITIVE_${primitive.id}`,
        kind: "visual_primitive",
        action_ref: primitive.action_ref || null,
        target_ref: primitive.id,
        required: true,
        status: "pending",
        geometry_refs: [],
        source_refs: sourceRefs(primitive)
      });
      if (["movement_path", "dribble_path", "feint_path"].includes(primitive.type)) obligations.push({
        id: `OBLIGATION_GROUND_PATH_${primitive.id}`,
        kind: "ground_path_outside_goal_area",
        action_ref: primitive.action_ref || null,
        target_ref: primitive.id,
        required: true,
        status: "pending",
        geometry_refs: [],
        source_refs: sourceRefs(primitive)
      });
      if (primitive.type === "feint_path") obligations.push({
        id: `OBLIGATION_FEINT_SHAPE_${primitive.id}`,
        kind: "functional_feint_shape",
        action_ref: primitive.action_ref || null,
        target_ref: primitive.id,
        required: true,
        status: "pending",
        geometry_refs: [],
        source_refs: sourceRefs(primitive)
      });
    });
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
    (plan.ball_flow && plan.ball_flow.states || []).filter((state) => !state.action_ref && state.holder_ref).forEach((state) => obligations.push({
      id: `OBLIGATION_BALL_${state.ball_ref}`,
      kind: "initial_ball_visible",
      action_ref: null,
      target_ref: state.ball_ref,
      required: true,
      status: "pending",
      geometry_refs: [],
      source_refs: sourceRefs(state)
    }));
    return obligations;
  }

  function validationCheck(id, kind, status, subjectRef, message, source, details) {
    return {
      id,
      kind,
      status,
      severity: status === "failed" ? "error" : status === "unknown" ? "pending" : "info",
      subject_ref: subjectRef,
      action_ref: source && source.action_ref || null,
      message,
      source_refs: sourceRefs(source),
      details: details || {}
    };
  }

  function positionIndex(geometry) {
    const states = new Map((geometry.participant_states || []).map((state) => [state.id, state.position]));
    const entities = new Map((geometry.entities || []).map((entity) => [entity.id, entity.position]));
    (geometry.contextual_references || []).forEach((reference) => entities.set(reference.participant_ref, reference.position));
    return { states, entities };
  }

  function validateResolvedGeometry(geometry, profileInput, policyInput) {
    const policy = { ...DEFAULT_POLICY, ...(policyInput || geometry && geometry.layout_policy && geometry.layout_policy.parameters || {}) };
    const profile = profileInput || geometry && geometry.court;
    const checks = [];
    if (!geometry || !profile) {
      checks.push(validationCheck("CHECK_RENDERABLE", "renderability", "failed", "geometry", "Falta geometria o perfil de pista.", null));
      return { renderability: "failed", geometry: "invalid", tactical: "not_validated", checks };
    }
    const index = positionIndex(geometry);
    const branchPaths = (geometry.branches || []).flatMap((branch) => (branch.alternatives || []).flatMap((alternative) => [
      alternative.approach_path,
      alternative.return_pass,
      alternative
    ].filter(Boolean)));
    const paths = [...(geometry.common_paths || []), ...branchPaths];
    const groundPaths = paths.filter((path) => ["movement", "movement_without_ball", "run_without_ball", "continuation", "dribble", "feint"].includes(path.kind));
    // Stationary participants and every temporal state are physical geometry too.
    const entities = geometry.entities || [];
    [...entities, ...(geometry.participant_states || [])].forEach((item) => {
      const participant = entities.find((entity) => entity.id === item.participant_ref) || item;
      if (!Array.isArray(item.position)) return;
      const material = ["ball", "cone", "bench", "cylinder", "text", "label"].includes(participant.kind);
      const exempt = material || participant.kind === "goalkeeper" || item.support === "airborne" && Boolean(item.source_refs && item.source_refs.length);
      const [x, y] = item.position;
      const bounds = x >= 0 && x <= geometry.court.width_m && y >= 0 && y <= (geometry.court.length_m || geometry.court.half_length_m);
      const bottomArea = geometry.court.length_m && courtGeometry.isInsideGoalArea(profile, [x, geometry.court.length_m - y]);
      const legal = bounds && (exempt || !courtGeometry.isInsideGoalArea(profile, item.position) && !bottomArea);
      checks.push(validationCheck(`CHECK_POSITION_${item.id}`, "participant_position_physical", legal ? "passed" : "failed", item.id, legal ? "Posició física admissible." : "Posició fora de pista o dins de l’àrea sense excepció explícita.", item));
    });
    checks.push(validationCheck(
      "CHECK_RENDERABLE",
      "renderability",
      paths.length || (geometry.entities || []).length ? "passed" : "failed",
      "geometry",
      paths.length || (geometry.entities || []).length ? "La geometria conté primitives renderitzables." : "La geometria no conté cap primitiva renderitzable.",
      null
    ));
    groundPaths.forEach((path) => {
      const physical = courtGeometry.validateGroundPath(path, profile, { minimum_clearance_m: 0, maximum_step_m: 0.04, tolerance_m: 0.005 });
      if (geometry.court.length_m) {
        const reflected = { points: courtGeometry.samplePath(path, 0.025).map(sample => [sample.point[0], geometry.court.length_m - sample.point[1]]) };
        const bottom = courtGeometry.validateGroundPath(reflected, profile, { minimum_clearance_m: 0, maximum_step_m: 0.04, tolerance_m: 0.005 });
        if (!bottom.valid) { physical.valid = false; physical.bottom_goal_area = bottom; }
      }
      checks.push(validationCheck(
        `CHECK_GROUND_PHYSICAL_${path.id}`,
        "ground_path_physical_area",
        physical.valid ? "passed" : "failed",
        path.id,
        physical.valid ? "El recorregut terrestre queda fora de l’àrea física." : "El recorregut terrestre entra dins de l’àrea física.",
        path,
        physical
      ));
      const visual = courtGeometry.validateGroundPath(path, profile, { minimum_clearance_m: policy.ground_symbol_clearance_m, maximum_step_m: 0.04, tolerance_m: 0.015 });
      checks.push(validationCheck(
        `CHECK_GROUND_VISUAL_${path.id}`,
        "ground_path_visual_clearance",
        visual.valid ? "passed" : "failed",
        path.id,
        visual.valid ? "El símbol manté el marge visual provisional respecte de l’àrea." : "El recorregut no preserva el marge visual provisional respecte de l’àrea.",
        path,
        visual
      ));
    });
    paths.filter((path) => path.kind === "feint").forEach((path) => {
      const commitment = (path.functional_points || []).find((point) => point.role === "commitment");
      const directionBreak = (path.functional_points || []).find((point) => point.role === "direction_break");
      const clearance = (path.functional_points || []).find((point) => point.role === "clearance");
      const exit = (path.functional_points || []).find((point) => point.role === "exit");
      const opponent = index.entities.get(path.opponent_ref);
      if (!commitment || !directionBreak || !clearance || !exit || !opponent) {
        checks.push(validationCheck(`CHECK_FEINT_FUNCTIONS_${path.id}`, "functional_feint", "unknown", path.id, "Falten punts funcionals o la posició del defensor per comprovar la finta.", path));
        return;
      }
      const distinctDistance = distance(commitment.position, directionBreak.position);
      const turn = courtGeometry.turnAngleDegrees(commitment.position, directionBreak.position, clearance.position);
      const defenderClearance = courtGeometry.minimumDistanceToPath(opponent, path);
      const distinct = distinctDistance >= 0.45;
      const turns = turn >= policy.feint_min_turn_degrees;
      const clears = defenderClearance >= policy.defender_path_clearance_m;
      const samples = courtGeometry.samplePath(path, 0.025).map((sample) => sample.point);
      const start = samples[0];
      const exitSide = Math.sign(exit.position[0] - opponent[0]);
      const firstCrossing = samples.find((point, index) => index && point[1] <= opponent[1] && samples[index - 1][1] > opponent[1]);
      const sequenceValid = Boolean(start && exitSide && directionBreak.position[1] > opponent[1]
        && clearance.position[1] > opponent[1] && Math.sign(clearance.position[0] - opponent[0]) === exitSide
        && firstCrossing && Math.sign(firstCrossing[0] - opponent[0]) === exitSide);
      checks.push(validationCheck(`CHECK_FEINT_SEQUENCE_${path.id}`, "feint_sequence", sequenceValid ? "passed" : "failed", path.id,
        sequenceValid ? "Compromís, canvi de costat davant del defensor i superació pel costat de sortida." : "La finta supera el defensor abans del canvi de costat.", path, { first_crossing: firstCrossing || null }));
      checks.push(validationCheck(
        `CHECK_FEINT_FUNCTIONS_${path.id}`,
        "functional_feint",
        distinct && turns && clears ? "passed" : "failed",
        path.id,
        distinct && turns && clears ? "La finta diferencia compromís, ruptura i evasió sense travessar el defensor." : "La finta no preserva una ruptura funcional llegible o interfereix amb el defensor.",
        path,
        { commitment_break_distance_m: Number(distinctDistance.toFixed(3)), direction_change_degrees: turn, defender_clearance_m: defenderClearance }
      ));
      const targetSpace = (geometry.spaces || []).find((space) => space.id === path.target_space_ref);
      const xValues = targetSpace && targetSpace.calculation_region.map((point) => point[0]) || [];
      const inTarget = xValues.length && exit.position[0] >= Math.min(...xValues) && exit.position[0] <= Math.max(...xValues);
      checks.push(validationCheck(
        `CHECK_FEINT_EXIT_${path.id}`,
        "feint_exit_corridor",
        inTarget ? "passed" : targetSpace ? "failed" : "unknown",
        path.id,
        inTarget ? "La sortida funcional entra al corredor de l’interval contigu." : "No es pot confirmar que la sortida entri al corredor contigu.",
        path,
        { target_space_ref: path.target_space_ref, exit_position: exit.position }
      ));
    });
    (geometry.relations || []).forEach((relation) => {
      if (relation.subtype !== "2x1") return;
      const attackers = (relation.participants || []).filter((item) => ["primary_attacker", "support_attacker"].includes(item.role));
      const defenders = (relation.participants || []).filter((item) => item.role === "defender");
      const attackerPoints = attackers.map((item) => index.states.get(item.state_ref)).filter(Boolean);
      const defenderPoint = defenders.length === 1 && index.states.get(defenders[0].state_ref);
      if (attackers.length !== 2 || defenders.length !== 1 || attackerPoints.length !== 2 || !defenderPoint || !relation.primary_attacker_ref) {
        checks.push(validationCheck(`CHECK_RELATION_${relation.id}`, "numerical_relation_layout", "unknown", relation.id, "Falten rols o estats connectats per comprovar el 2x1.", relation));
        return;
      }
      const attackerSeparation = distance(attackerPoints[0], attackerPoints[1]);
      const defenderDistances = attackerPoints.map((point) => distance(point, defenderPoint));
      const outsideArea = attackerPoints.every((point) => !courtGeometry.isInsideGoalArea(profile, point));
      const readable = attackerSeparation >= policy.relation_min_attacker_separation_m
        && defenderDistances.every((value) => value <= policy.relation_max_defender_distance_m)
        && outsideArea;
      checks.push(validationCheck(
        `CHECK_RELATION_${relation.id}`,
        "numerical_relation_layout",
        readable ? "passed" : "failed",
        relation.id,
        readable ? "Els dos atacants i el defensor formen un dilema local llegible sense tancar-ne la resolució." : "La disposició del 2x1 no permet llegir prou la relació o situa un atacant dins l’àrea.",
        relation,
        { attacker_separation_m: Number(attackerSeparation.toFixed(3)), defender_distances_m: defenderDistances.map((value) => Number(value.toFixed(3))), attackers_outside_goal_area: outsideArea }
      ));
    });
    const visibleBalls = geometry.balls || [];
    const passes = paths.filter((path) => path.kind === "pass" && path.ball_ref);
    [...new Set([...visibleBalls.map((ball) => ball.ball_ref), ...passes.map((path) => path.ball_ref)])].forEach((ballRef) => {
      const visible = visibleBalls.filter((ball) => ball.ball_ref === ballRef && ball.visibility === "initial");
      const ballPasses = passes.filter((path) => path.ball_ref === ballRef);
      const transfers = (geometry.ball_flow || []).filter((transition) => transition.ball_ref === ballRef && transition.path_ref);
      const valid = visible.length === 1 && (!ballPasses.length || transfers.length >= 1)
        && transfers.every((transition) => ballPasses.some((path) => path.id === transition.path_ref && path.ball_ref === ballRef));
      checks.push(validationCheck(
        `CHECK_BALL_${ballRef}`,
        "ball_identity_and_visibility",
        valid ? "passed" : "failed",
        ballRef,
        valid ? "La pilota inicial és única i qualsevol passada conserva la mateixa identitat." : "La pilota no és visible de manera única o el flux no està vinculat a la passada.",
        visible[0] || ballPasses[0],
        { visible_initial_instances: visible.length, linked_transfers: transfers.length }
      ));
    });
    const geometryChecks = checks.filter((check) => check.kind !== "renderability");
    const geometryStatus = geometryChecks.some((check) => check.status === "failed") ? "invalid"
      : geometryChecks.some((check) => check.status === "unknown") ? "pending" : "valid";
    return {
      renderability: checks.find((check) => check.kind === "renderability").status,
      geometry: geometryStatus,
      tactical: "not_validated_by_coach",
      checks
    };
  }

  function resolve(plan, tacticalIR, profile, options) {
    const layout = statePositions(plan, tacticalIR, profile, options && options.layout_policy);
    const positions = layout.states;
    const participants = new Map((tacticalIR.participants || []).map((item) => [item.id, item]));
    const entities = [];
    const contextualReferences = [];
    const participantStates = [];
    const dependencies = [];
    const commonPaths = [];
    const balls = [];
    const ballFlow = [];
    const relations = [];
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
      const stateRef = firstStateByParticipant.get(participant.id);
      const state = stateRef && positions.get(stateRef);
      if (!state || !Array.isArray(state.position)) return;
      if (structuralOnly(participant)) {
        contextualReferences.push({
          id: `CONTEXT_${participant.id}`,
          participant_ref: participant.id,
          kind: "structural_delimiter",
          label: participant.label || participant.id,
          position: state.position.slice(),
          state_ref: stateRef,
          active_participant: false,
          source_refs: sourceRefs(participant)
        });
        return;
      }
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
        const commitmentPoint = rounded([opponent[0] - direction * 0.72, opponent[1] + 1.45]);
        const breakPoint = rounded([opponent[0] - direction * layout.policy.feint_break_lateral_m, opponent[1] + 1.05]);
        const bypassX = opponent[0] + direction * 1.05;
        const bypassPoint = rounded([
          bypassX,
          Math.max(courtGeometry.minimumGroundCenterY(profile, bypassX, layout.policy.ground_symbol_clearance_m), opponent[1] + 1.0)
        ]);
        const exitX = opponent[0] + direction * layout.policy.feint_exit_lateral_m;
        const exitPoint = rounded([
          exitX,
          Math.max(courtGeometry.minimumGroundCenterY(profile, exitX, layout.policy.ground_symbol_clearance_m), end[1])
        ]);
        const id = `PATH_${primitive.id}`;
        const path = {
          id,
          kind: "feint",
          action_type: "movement",
          actor_ref: primitive.actor_ref,
          from_state_ref: primitive.from_state_ref,
          to_state_ref: primitive.to_state_ref,
          segments: [
            line(start, commitmentPoint),
            line(commitmentPoint, breakPoint),
            line(breakPoint, bypassPoint),
            line(bypassPoint, exitPoint),
            line(exitPoint, end)
          ],
          functional_points: [
            { id: `${id}_COMMITMENT`, role: "commitment", position: commitmentPoint.slice() },
            { id: `${id}_DIRECTION_BREAK`, role: "direction_break", position: breakPoint.slice() },
            { id: `${id}_CLEARANCE`, role: "clearance", position: bypassPoint.slice() },
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

    const actionById = new Map((plan.actions || []).map((action) => [action.id, action]));
    function preferredStateRef(participantRef, refs) {
      return (refs || []).find((ref) => {
        const state = positions.get(ref);
        return state && state.participant_ref === participantRef && Array.isArray(state.position);
      }) || firstStateByParticipant.get(participantRef) || null;
    }
    (plan.actions || []).filter((action) => action.operator_id === "numerical_relation" && action.status === "composed").forEach((action) => {
      const predecessors = (action.after || []).map((ref) => actionById.get(ref)).filter(Boolean);
      const primary = predecessors.map((candidate) => candidate.actor_ref).find((ref) => (action.attacker_refs || []).includes(ref)) || null;
      const primaryState = primary && preferredStateRef(primary, action.state_refs);
      const spaceRef = action.space_ref || primaryState && positions.get(primaryState) && positions.get(primaryState).space_ref
        || predecessors.map((candidate) => candidate.target_space_ref).find(Boolean) || null;
      const relationParticipants = [];
      (action.attacker_refs || []).forEach((ref) => relationParticipants.push({
        participant_ref: ref,
        state_ref: preferredStateRef(ref, action.state_refs),
        role: ref === primary ? "primary_attacker" : "support_attacker"
      }));
      (action.defender_refs || []).forEach((ref) => relationParticipants.push({
        participant_ref: ref,
        state_ref: preferredStateRef(ref, action.state_refs),
        role: "defender"
      }));
      relations.push({
        id: `RELATION_${action.id}`,
        kind: "numerical_relation",
        subtype: action.subtype || "2x1",
        action_ref: action.id,
        primary_attacker_ref: primary,
        space_ref: spaceRef,
        participants: relationParticipants,
        resolution: "open",
        source_refs: sourceRefs(action)
      });
    });

    (plan.ball_flow && plan.ball_flow.states || []).filter((state) => !state.action_ref && state.holder_ref).forEach((ballState) => {
      const holderStateRef = firstStateByParticipant.get(ballState.holder_ref);
      const holderPoint = statePoint(holderStateRef);
      if (!holderPoint) return;
      const direction = holderPoint[0] >= profile.court.width_m / 2 ? 1 : -1;
      balls.push({
        id: `BALL_VISUAL_${ballState.ball_ref}_INITIAL`,
        ball_ref: ballState.ball_ref,
        ball_state_ref: ballState.id,
        holder_ref: ballState.holder_ref,
        holder_state_ref: holderStateRef,
        position: rounded([holderPoint[0] + direction * layout.policy.ball_offset_m, holderPoint[1] - 0.04]),
        status: "held",
        visibility: "initial",
        source_refs: sourceRefs(ballState)
      });
    });
    (plan.ball_flow && plan.ball_flow.transitions || []).forEach((transition) => {
      const path = commonPaths.find((candidate) => candidate.action_ref === transition.action_ref && candidate.ball_ref === transition.ball_ref);
      ballFlow.push({
        id: transition.id,
        ball_ref: transition.ball_ref,
        from_ball_state_ref: transition.from_state_ref,
        to_ball_state_ref: transition.to_state_ref,
        from_holder_ref: transition.from_holder_ref,
        to_holder_ref: transition.to_holder_ref,
        path_ref: path && path.id || null,
        receiver_state_ref: path && path.to_state_ref || null,
        source_refs: sourceRefs(transition)
      });
    });

    const resolvedSpaces = [...new Map((tacticalIR.spaces || []).map((space) => [space.id, space])).values()]
      .filter((space) => layout.spaceAnchors.has(space.id))
      .map((space) => {
        const anchor = layout.spaceAnchors.get(space.id);
        const region = layout.spaceRegions.get(space.id);
        return {
          id: space.id,
          kind: "relational_tactical_space",
          relation: { type: space.relation && space.relation.type || "between", delimiter_refs: delimiterRefs(space) },
          anchor: anchor.slice(),
          calculation_region: region ? region.calculation_region : [
            rounded([anchor[0] - 0.45, anchor[1] - 0.45]), rounded([anchor[0] + 0.45, anchor[1] - 0.45]),
            rounded([anchor[0] + 0.45, anchor[1] + 0.45]), rounded([anchor[0] - 0.45, anchor[1] + 0.45])
          ],
          functional_anchors: region ? utils.deepClone(region.functional_anchors) : { reception: anchor.slice(), threat: anchor.slice(), exit: anchor.slice() },
          render_policy: "hidden",
          source_refs: sourceRefs(space)
        };
      });
    const viewPoints = [
      ...participantStates.map((state) => state.position),
      ...balls.map((ball) => ball.position),
      ...commonPaths.flatMap((path) => (path.segments || []).flatMap((segment) => [segment.start, segment.control1, segment.control2, segment.end].filter(Boolean)))
    ];
    const courtInstance = court(profile, courtGeometry.usefulViewBox(profile, viewPoints));
    const validation = validateResolvedGeometry({
      court: courtInstance,
      layout_policy: { parameters: layout.policy },
      spaces: resolvedSpaces,
      entities,
      contextual_references: contextualReferences,
      participant_states: participantStates,
      common_paths: commonPaths,
      relations,
      balls,
      ball_flow: ballFlow
    }, profile, layout.policy);
    const checksBySubject = new Map();
    validation.checks.forEach((check) => {
      if (!checksBySubject.has(check.subject_ref)) checksBySubject.set(check.subject_ref, []);
      checksBySubject.get(check.subject_ref).push(check);
      if (check.status !== "passed") diagnostics.push({
        code: check.status === "failed" ? "GEOMETRY_VALIDATION_FAILED" : "GEOMETRY_VALIDATION_PENDING",
        severity: check.severity,
        path: `/validation/checks/${check.id}`,
        message: check.message,
        action_ref: check.action_ref,
        validation_ref: check.id,
        source_refs: check.source_refs
      });
    });

    const pathByPrimitive = new Map(commonPaths.map((path) => [path.id.replace(/^PATH_/, ""), path]));
    obligations.forEach((obligation) => {
      if (obligation.kind === "visual_primitive") {
        const path = pathByPrimitive.get(obligation.target_ref);
        if (path) { obligation.status = "resolved"; obligation.geometry_refs = [`geometry:common_path:${path.id}`]; }
      } else if (obligation.kind === "ground_path_outside_goal_area") {
        const path = pathByPrimitive.get(obligation.target_ref);
        const checks = path && checksBySubject.get(path.id) || [];
        if (checks.length && checks.filter((check) => check.kind.startsWith("ground_path_")).every((check) => check.status === "passed")) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:common_path:${path.id}`];
        } else if (checks.some((check) => check.kind.startsWith("ground_path_") && check.status === "failed")) obligation.status = "incompatible";
      } else if (obligation.kind === "functional_feint_shape") {
        const path = pathByPrimitive.get(obligation.target_ref);
        const checks = path && checksBySubject.get(path.id) || [];
        if (checks.length && checks.filter((check) => ["functional_feint", "feint_exit_corridor"].includes(check.kind)).every((check) => check.status === "passed")) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:common_path:${path.id}`];
        } else if (checks.some((check) => ["functional_feint", "feint_exit_corridor"].includes(check.kind) && check.status === "failed")) obligation.status = "incompatible";
      } else if (obligation.kind === "shared_reception_state") {
        const action = (plan.actions || []).find((item) => item.id === obligation.action_ref);
        const pass = (plan.actions || []).find((item) => item.operator_id === "pass" && item.to_state_ref === action.state_ref);
        const state = positions.get(action.state_ref);
        if (pass && state && Array.isArray(state.position) && pass.to_state_ref === action.state_ref) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:participant_state:${state.id}`];
        }
      } else if (obligation.kind === "numerical_relation_state") {
        const relation = relations.find((item) => item.action_ref === obligation.action_ref);
        const check = relation && (checksBySubject.get(relation.id) || []).find((item) => item.kind === "numerical_relation_layout");
        if (relation && check && check.status === "passed") {
          obligation.status = "resolved";
          obligation.geometry_refs = relation.participants.map((item) => `geometry:participant_state:${item.state_ref}`);
        } else if (check && check.status === "failed") obligation.status = "incompatible";
      } else if (obligation.kind === "surpasses_defensive_line") {
        const constraint = (plan.constraints || []).find((item) => item.id === obligation.target_ref);
        const state = constraint && statePoint(constraint.subject_refs[0]);
        const defender = constraint && statePoint(constraint.object_refs[0]);
        if (state && defender && state[1] < defender[1]) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:participant_state:${constraint.subject_refs[0]}`];
        }
      } else if (obligation.kind === "initial_ball_visible") {
        const check = (checksBySubject.get(obligation.target_ref) || []).find((item) => item.kind === "ball_identity_and_visibility");
        const ball = balls.find((item) => item.ball_ref === obligation.target_ref);
        if (check && check.status === "passed" && ball) {
          obligation.status = "resolved";
          obligation.geometry_refs = [`geometry:ball:${ball.id}`];
        } else if (check && check.status === "failed") obligation.status = "incompatible";
      }
    });
    obligations.filter((item) => item.status !== "resolved").forEach((item) => diagnostics.push({
      code: item.status === "incompatible" ? "GEOMETRY_OBLIGATION_INCOMPATIBLE" : "GEOMETRY_OBLIGATION_PENDING",
      severity: item.status === "incompatible" ? "error" : "pending",
      path: `/obligations/${item.id}`,
      message: item.status === "incompatible" ? `La geometria incompleix l’obligació ${item.kind}.` : `No s’ha pogut resoldre l’obligació ${item.kind}.`,
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
      court: courtInstance,
      layout_policy: {
        id: layout.policy.id,
        version: layout.policy.version,
        status: "provisional_render_policy",
        coordinate_system: "metres_origin_goal_line_left",
        attack_direction: "negative_y",
        notes: [
          "Distribució derivada de delimitadors, corredors d’interval, dependències d’acció i relacions numèriques connectades.",
          "Les profunditats, separacions, marges de símbol i distàncies de contacte són política visual provisional.",
          "La validesa geomètrica no concedeix validació tàctica de l’entrenador."
        ],
        parameters: utils.deepClone(layout.policy),
        decisions: layout.decisions
      },
      zones: [],
      spaces: resolvedSpaces,
      objects: [],
      phases: [],
      entities,
      contextual_references: contextualReferences,
      participant_states: participantStates,
      balls,
      ball_flow: ballFlow,
      common_paths: commonPaths,
      relations,
      branches: [],
      dependencies,
      obligations,
      diagnostics,
      validation,
      result: {
        status,
        renderability_status: validation.renderability,
        geometry_validation_status: validation.geometry,
        tactical_validation_status: validation.tactical,
        obligations_total: required.length,
        obligations_resolved: resolved.length,
        obligations_pending: required.length - resolved.length,
        incompatible_count: incompatible.length
      },
      traceability: [
        ...entities.map((entity) => ({ geometry_ref: `geometry:entity:${entity.id}`, source_refs: entity.source_refs || [] })),
        ...contextualReferences.map((reference) => ({ geometry_ref: `geometry:contextual_reference:${reference.id}`, source_refs: reference.source_refs || [] })),
        ...balls.map((ball) => ({ geometry_ref: `geometry:ball:${ball.id}`, source_refs: ball.source_refs || [] })),
        ...relations.map((relation) => ({ geometry_ref: `geometry:relation:${relation.id}`, action_ref: relation.action_ref, source_refs: relation.source_refs || [] })),
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
    adapted.layout_policy = {
      ...adapted.layout_policy,
      version: sourceVersion,
      parameters: { ...DEFAULT_POLICY, legacy_layout_preserved: true },
      decisions: [],
      notes: [...(adapted.layout_policy.notes || []), `Adaptat explícitament des del contracte ${sourceVersion}.`, "La geometria legacy es conserva literalment i se sotmet als validadors físics v0.4."]
    };
    adapted.objects = adapted.objects || [];
    adapted.phases = adapted.phases || [];
    adapted.contextual_references = [];
    adapted.relations = [];
    (adapted.entities || []).forEach((entity) => { entity.source_refs = entity.source_refs || unique([entity.source_ref, "derived:legacy_adapter"]); entity.presence = entity.presence || "explicit"; delete entity.source_ref; });
    const legacyBalls = (adapted.entities || []).filter((entity) => entity.kind === "ball");
    adapted.entities = (adapted.entities || []).filter((entity) => entity.kind !== "ball");
    adapted.balls = legacyBalls.map((entity) => {
      const initialPass = (adapted.common_paths || []).find((path) => path.ball_ref === entity.id);
      return {
        id: `BALL_VISUAL_${entity.id}_INITIAL`,
        ball_ref: entity.id,
        ball_state_ref: `BALL_STATE_${entity.id}_S0`,
        holder_ref: initialPass && initialPass.from_participant_ref || "UNKNOWN",
        holder_state_ref: initialPass && initialPass.from_state_ref || "UNKNOWN",
        position: entity.position.slice(),
        status: "held",
        visibility: "initial",
        source_refs: entity.source_refs
      };
    });
    const legacyPaths = [
      ...(adapted.common_paths || []),
      ...(adapted.branches || []).flatMap((branch) => (branch.alternatives || []).flatMap((alternative) => [alternative.return_pass, alternative].filter(Boolean)))
    ];
    adapted.ball_flow = legacyPaths.filter((path) => path.ball_ref).map((path, index) => ({
      id: `BALL_TRANSITION_LEGACY_${String(index + 1).padStart(3, "0")}`,
      ball_ref: path.ball_ref,
      from_ball_state_ref: `BALL_STATE_${path.ball_ref}_${String(index).padStart(3, "0")}`,
      to_ball_state_ref: `BALL_STATE_${path.ball_ref}_${String(index + 1).padStart(3, "0")}`,
      from_holder_ref: path.from_participant_ref || null,
      to_holder_ref: path.to_participant_ref || null,
      path_ref: path.id || null,
      receiver_state_ref: path.to_state_ref || null,
      source_refs: sourceRefs(path)
    }));
    (adapted.spaces || []).forEach((space) => {
      space.source_refs = space.source_refs || unique([space.source_ref, "derived:legacy_adapter"]);
      space.functional_anchors = space.functional_anchors || { reception: space.anchor.slice(), threat: space.anchor.slice(), exit: space.anchor.slice() };
      delete space.source_ref;
      delete space.zone_ref;
      delete space.defender_ref;
    });
    adapted.obligations = [
      ...(adapted.common_paths || []).map((path) => ({ id: `OBLIGATION_LEGACY_PATH_${path.id}`, kind: "legacy_path", action_ref: path.action_ref || null, target_ref: path.id, required: true, status: "resolved", geometry_refs: [`geometry:common_path:${path.id}`], source_refs: sourceRefs(path) })),
      ...(adapted.branches || []).map((branch) => ({ id: `OBLIGATION_LEGACY_BRANCH_${branch.id}`, kind: "legacy_branch", action_ref: null, target_ref: branch.id, required: true, status: "resolved", geometry_refs: [`geometry:branch:${branch.id}`], source_refs: unique([branch.source_ref, "derived:legacy_adapter"]) }))
    ];
    adapted.validation = validateResolvedGeometry(adapted, adapted.court, adapted.layout_policy.parameters);
    adapted.validation.tactical = "preserved_legacy_validation";
    const failedChecks = adapted.validation.checks.filter((check) => check.status === "failed");
    const unknownChecks = adapted.validation.checks.filter((check) => check.status === "unknown");
    adapted.obligations.push({
      id: "OBLIGATION_LEGACY_V04_VALIDATION",
      kind: "legacy_geometry_validation",
      action_ref: null,
      target_ref: adapted.meta.case_id,
      required: true,
      status: failedChecks.length ? "incompatible" : unknownChecks.length ? "pending" : "resolved",
      geometry_refs: [],
      source_refs: ["derived:legacy_adapter:v0.4"]
    });
    adapted.diagnostics = [...failedChecks, ...unknownChecks].map((check) => ({
      code: check.status === "failed" ? "LEGACY_GEOMETRY_VALIDATION_FAILED" : "LEGACY_GEOMETRY_VALIDATION_PENDING",
      severity: check.severity,
      path: `/validation/checks/${check.id}`,
      message: check.message,
      action_ref: check.action_ref,
      validation_ref: check.id,
      source_refs: check.source_refs
    }));
    const legacyStatus = failedChecks.length ? "blocked" : unknownChecks.length ? "partial" : "ready";
    adapted.meta.status = legacyStatus === "ready" ? "resolved" : legacyStatus;
    adapted.result = {
      status: legacyStatus,
      renderability_status: adapted.validation.renderability,
      geometry_validation_status: adapted.validation.geometry,
      tactical_validation_status: adapted.validation.tactical,
      obligations_total: adapted.obligations.length,
      obligations_resolved: adapted.obligations.filter((item) => item.status === "resolved").length,
      obligations_pending: adapted.obligations.filter((item) => item.status !== "resolved").length,
      incompatible_count: failedChecks.length
    };
    return adapted;
  }

  return {
    GEOMETRY_VERSION,
    SCHEMA_REF,
    DEFAULT_POLICY,
    orderedDelimiterRefs,
    statePositions,
    enumerateObligations,
    validateResolvedGeometry,
    adaptLegacyGeometry,
    resolve
  };
});
