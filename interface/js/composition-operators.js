(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_COMPOSITION_OPERATORS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const OPERATIONAL_AUTHORITIES = new Set([
    "coach_explicit_input", "coach_validated", "canonical_semantic", "canonical_spatial",
    "canonical_validated", "semantic_validated", "spatial_validated",
    "validated_local_knowledge", "derived_from_validated_rule", "graphic_legend"
  ]);

  function values(value) { return Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]; }
  function actionSource(action) { return { authority: action.authority || "unknown", status: action.status || "unknown", source_refs: utils.deepClone(action.source_refs || []) }; }

  function createRegistry() {
    const operators = [];
    function register(operator) {
      if (!operator || !operator.id || !Array.isArray(operator.semantic_types) || typeof operator.compose !== "function") throw new Error("OPERATOR_CONTRACT_INVALID");
      if (operators.some((item) => item.id === operator.id)) throw new Error(`OPERATOR_DUPLICATE:${operator.id}`);
      operators.push(operator);
      return operator;
    }
    function find(action) {
      return operators.find((operator) => operator.semantic_types.includes(action.type) || operator.semantic_types.includes(action.subtype)) || null;
    }
    return { register, find, list: () => operators.slice() };
  }

  function movementOperator() {
    return {
      id: "movement", semantic_types: ["movement", "movement_without_ball", "recovery"],
      required_slots: ["actor_ref"], visual_primitives: ["movement_path"],
      compose(action, context) {
        const actorRef = context.require(action, { slot: "actor_ref", label: "Qui fa el desplaçament?", options: "attackers" });
        if (!actorRef) return context.unresolvedAction(action, this);
        const from = context.states.current(actorRef);
        const to = context.states.ensure(actorRef, action.to_state_ref || `${action.id}:to`, {
          state_ref: action.to_state_ref, phase_ref: action.phase_ref, space_ref: action.to_space_ref || action.target_space_ref,
          position: action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: true
        });
        if (action.to_space_ref || action.target_space_ref) context.constraints.add({
          id: `CONSTRAINT_${action.id}_ATTACKS`, type: "ATTACKS", strength: "hard", subject_refs: [to.id],
          object_refs: [action.to_space_ref || action.target_space_ref], action_ref: action.id, source_refs: action.source_refs
        });
        context.addPrimitive(action, "movement_path", { actor_ref: actorRef, from_state_ref: from.id, to_state_ref: to.id, dictionary_ref: "VF_MOVEMENT_WITHOUT_BALL" });
        return context.composedAction(action, this, { actor_ref: actorRef, from_state_ref: from.id, to_state_ref: to.id });
      }
    };
  }

  function dribbleOperator() {
    return {
      id: "dribble", semantic_types: ["dribble", "movement_with_dribble"],
      required_slots: ["actor_ref"], visual_primitives: ["dribble_path"],
      compose(action, context) {
        const actorRef = context.require(action, { slot: "actor_ref", label: "Qui es desplaça en bot?", options: "attackers" });
        if (!actorRef) return context.unresolvedAction(action, this);
        const from = context.states.current(actorRef);
        const to = context.states.ensure(actorRef, action.to_state_ref || `${action.id}:to`, {
          state_ref: action.to_state_ref, phase_ref: action.phase_ref, space_ref: action.to_space_ref || action.target_space_ref,
          position: action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: true
        });
        const ballRef = action.ball_ref || "B1";
        const ballTransition = context.ball.transition(action, {
          type: "dribble", ball_ref: ballRef, from_holder_ref: actorRef, to_holder_ref: actorRef, allow_derived_initial_holder: true
        });
        context.addPrimitive(action, "dribble_path", { actor_ref: actorRef, from_state_ref: from.id, to_state_ref: to.id, ball_ref: ballRef, dictionary_ref: "VF_DRIBBLE" });
        return context.composedAction(action, this, { actor_ref: actorRef, from_state_ref: from.id, to_state_ref: to.id, ball_transition_ref: ballTransition && ballTransition.id });
      }
    };
  }

  function passOperator() {
    return {
      id: "pass", semantic_types: ["pass"], required_slots: ["actor_ref", "receiver_ref"], visual_primitives: ["pass_path"],
      compose(action, context) {
        const sender = context.require(action, { slot: "actor_ref", aliases: ["sender_ref", "from_participant_ref"], label: "Qui fa la passada?", options: "attackers" });
        const receiver = context.require(action, { slot: "receiver_ref", aliases: ["target_ref", "to_participant_ref"], label: "Qui rep la passada?", options: "attackers", exclude: sender });
        if (sender && sender === receiver) {
          context.constraints.conflicts.push({ code: "PASS_SENDER_EQUALS_RECEIVER", action_ref: action.id, reason: "L’emissor i el receptor d’una passada han de ser participants diferents.", source_refs: action.source_refs || [] });
          return context.unresolvedAction(action, this, "L’emissor i el receptor han de ser diferents.");
        }
        if (!sender || !receiver) return context.unresolvedAction(action, this);
        const from = context.states.current(sender);
        const mergeKey = context.merge_keys.pass_targets[action.id] || action.to_state_ref || `${action.id}:reception`;
        const to = context.states.ensure(receiver, mergeKey, {
          state_ref: action.to_state_ref, phase_ref: action.phase_ref, space_ref: action.to_space_ref,
          position: action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: false
        });
        const ballRef = action.ball_ref || "B1";
        const ballTransition = context.ball.transition(action, {
          type: "pass", ball_ref: ballRef, from_holder_ref: sender, to_holder_ref: receiver, allow_derived_initial_holder: true
        });
        context.addPrimitive(action, "pass_path", {
          ball_ref: ballRef, from_participant_ref: sender, from_state_ref: from.id,
          to_participant_ref: receiver, to_state_ref: to.id, dictionary_ref: "VF_PASS", anchor_mode: "symbol_perimeter"
        });
        return context.composedAction(action, this, {
          actor_ref: sender, receiver_ref: receiver, from_state_ref: from.id, to_state_ref: to.id,
          ball_transition_ref: ballTransition && ballTransition.id
        });
      }
    };
  }

  function receptionOperator() {
    return {
      id: "reception", semantic_types: ["reception"], required_slots: ["actor_ref"], visual_primitives: [],
      compose(action, context) {
        const receiver = context.require(action, { slot: "actor_ref", aliases: ["receiver_ref"], label: "Qui fa la recepció?", options: "attackers" });
        if (!receiver) return context.unresolvedAction(action, this);
        const before = context.states.current(receiver);
        const mergeKey = context.merge_keys.reception_states[action.id] || action.state_ref || `${action.id}:state`;
        const state = context.states.ensure(receiver, mergeKey, {
          state_ref: action.state_ref || action.to_state_ref, phase_ref: action.phase_ref, space_ref: action.space_ref || action.to_space_ref,
          position: action.position || action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: false
        });
        const moving = action.mode === "in_motion" || action.in_motion === true;
        if (moving && before.id !== state.id) context.addPrimitive(action, "movement_path", {
          actor_ref: receiver, from_state_ref: before.id, to_state_ref: state.id,
          kind: "movement_without_ball", dictionary_ref: "VF_MOVEMENT_WITHOUT_BALL", functional_event: "reception_in_motion"
        });
        context.states.setCurrent(receiver, state.id);
        return context.composedAction(action, this, { actor_ref: receiver, state_ref: state.id, from_state_ref: moving ? before.id : null, in_motion: moving });
      }
    };
  }

  function shotOperator() {
    return {
      id: "shot", semantic_types: ["shot", "finish"], required_slots: ["actor_ref"], visual_primitives: ["shot_path"],
      compose(action, context) {
        const actorRef = context.require(action, { slot: "actor_ref", label: "Qui fa el llançament?", options: "attackers" });
        if (!actorRef) return context.unresolvedAction(action, this);
        const from = context.states.current(actorRef);
        const ballRef = action.ball_ref || "B1";
        const targetGoal = action.target_goal_ref || "COURT_GOAL";
        const transition = context.ball.transition(action, {
          type: "shot", ball_ref: ballRef, from_holder_ref: actorRef, to_holder_ref: null,
          after_status: "in_flight", allow_derived_initial_holder: true
        });
        context.addPrimitive(action, "shot_path", { actor_ref: actorRef, from_state_ref: from.id, target_goal_ref: targetGoal, ball_ref: ballRef, dictionary_ref: "VF_SHOT" });
        return context.composedAction(action, this, { actor_ref: actorRef, from_state_ref: from.id, target_goal_ref: targetGoal, ball_transition_ref: transition && transition.id });
      }
    };
  }

  function feintOperator() {
    return {
      id: "feint", semantic_types: ["feint", "one_v_one", "1x1"],
      required_slots: ["actor_ref", "opponent_ref", "initial_space_ref", "target_space_ref"], visual_primitives: ["feint_path"],
      compose(action, context) {
        const actorRef = context.require(action, { slot: "actor_ref", label: "Qui fa la finta?", options: "attackers" });
        const opponentRef = context.require(action, { slot: "opponent_ref", label: "Contra quin defensor fa la finta?", options: "opponents" });
        const initialSpace = context.require(action, { slot: "initial_space_ref", label: "Quin espai ataca inicialment?", options: "spaces" });
        const targetSpace = context.require(action, { slot: "target_space_ref", label: "Quin espai contigu ataca després?", options: "spaces", exclude: initialSpace });
        if (!actorRef || !opponentRef || !initialSpace || !targetSpace) return context.unresolvedAction(action, this);
        const from = context.states.current(actorRef);
        const to = context.states.ensure(actorRef, action.to_state_ref || `${action.id}:exit`, {
          state_ref: action.to_state_ref, phase_ref: action.phase_ref, space_ref: targetSpace,
          position: action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: true
        });
        context.constraints.add({ id: `CONSTRAINT_${action.id}_INITIAL_ATTACK`, type: "ATTACKS", strength: "hard", subject_refs: [from.id], object_refs: [initialSpace], action_ref: action.id, source_refs: action.source_refs });
        context.constraints.addContiguity(action, initialSpace, targetSpace);
        context.constraints.add({ id: `CONSTRAINT_${action.id}_OPPOSES`, type: "OPPOSES", strength: "hard", subject_refs: [actorRef], object_refs: [opponentRef], action_ref: action.id, source_refs: action.source_refs });
        context.constraints.add({ id: `CONSTRAINT_${action.id}_SURPASSES`, type: "SURPASSES_DEFENSIVE_LINE", strength: "hard", subject_refs: [to.id], object_refs: [opponentRef], action_ref: action.id, status: "unresolved", source_refs: action.source_refs });
        context.addPrimitive(action, "feint_path", {
          actor_ref: actorRef, opponent_ref: opponentRef, from_state_ref: from.id, to_state_ref: to.id,
          initial_space_ref: initialSpace, target_space_ref: targetSpace, direction_break: "required",
          waypoints: utils.deepClone(action.waypoints || []), dictionary_ref: "VF_FEINT"
        });
        return context.composedAction(action, this, { actor_ref: actorRef, opponent_ref: opponentRef, from_state_ref: from.id, to_state_ref: to.id, initial_space_ref: initialSpace, target_space_ref: targetSpace });
      }
    };
  }

  function blockOperator() {
    return {
      id: "block", semantic_types: ["block", "screen"], required_slots: ["actor_ref", "blocked_defender_ref"], visual_primitives: ["blocking_mark"],
      compose(action, context) {
        const blocker = context.require(action, { slot: "actor_ref", aliases: ["blocker_ref"], label: "Qui fa el bloqueig?", options: "attackers" });
        const defender = context.require(action, { slot: "blocked_defender_ref", aliases: ["opponent_ref", "target_ref"], label: "A quin defensor bloqueja?", options: "opponents" });
        if (!blocker || !defender) return context.unresolvedAction(action, this);
        context.constraints.add({ id: `CONSTRAINT_${action.id}_BLOCKS`, type: "BLOCKS", strength: "hard", subject_refs: [blocker], object_refs: [defender], action_ref: action.id, source_refs: action.source_refs });
        context.addPrimitive(action, "blocking_mark", { blocker_ref: blocker, blocked_defender_ref: defender, blocking_side: action.blocking_side || null, dictionary_ref: "VF_BLOCK_SCREEN" });
        return context.composedAction(action, this, { actor_ref: blocker, blocked_defender_ref: defender, blocking_side: action.blocking_side || null });
      }
    };
  }

  function numericalRelationOperator() {
    return {
      id: "numerical_relation", semantic_types: ["numerical_relation", "two_v_one", "2x1", "two_v_two", "2x2", "three_v_two", "3x2"],
      required_slots: ["attacker_refs", "defender_refs"], visual_primitives: [],
      compose(action, context) {
        const expected = action.subtype === "2x2" || action.type === "two_v_two" ? [2, 2] : action.subtype === "3x2" || action.type === "three_v_two" ? [3, 2] : [2, 1];
        const attackerValue = context.require(action, { slot: "attacker_refs", label: `Quins són els ${expected[0]} atacants?`, options: "attackers", min_items: expected[0], max_items: expected[0] });
        const defenderValue = context.require(action, { slot: "defender_refs", label: `Quins són els ${expected[1]} defensors?`, options: "opponents", min_items: expected[1], max_items: expected[1] });
        const attackers = values(attackerValue), defenders = values(defenderValue);
        if (attackers.length !== expected[0] || defenders.length !== expected[1]) return context.unresolvedAction(action, this);
        context.constraints.add({ id: `CONSTRAINT_${action.id}_NUMERICAL`, type: "NUMERICAL_RELATION", strength: "hard", subject_refs: attackers, object_refs: defenders, action_ref: action.id, source_refs: action.source_refs });
        return context.composedAction(action, this, {
          subtype: action.subtype || `${expected[0]}x${expected[1]}`, attacker_refs: attackers, defender_refs: defenders,
          state_refs: [...attackers, ...defenders].map((ref) => context.states.current(ref)).filter(Boolean).map((state) => state.id),
          space_ref: action.space_ref || null, dedicated_glyph: false
        });
      }
    };
  }

  function permutationOperator() {
    return {
      id: "permutation", semantic_types: ["permutation", "exchange"], required_slots: ["participant_refs"], visual_primitives: ["movement_path"],
      compose(action, context) {
        const participantValue = context.require(action, { slot: "participant_refs", aliases: ["actor_refs"], label: "Quins dos jugadors intercanvien les posicions?", options: "attackers", min_items: 2, max_items: 2 });
        const participants = values(participantValue);
        if (!participants || participants.length !== 2) return context.unresolvedAction(action, this, "La permuta necessita exactament dues identitats.");
        const starts = participants.map((ref) => context.states.current(ref));
        const ends = participants.map((ref, index) => context.states.ensure(ref, `${action.id}:to:${ref}`, {
          phase_ref: action.phase_ref, functional_position_ref: starts[1 - index].id,
          authority: "derived_from_validated_rule", source_refs: action.source_refs, status: "future", make_current: false
        }));
        participants.forEach((ref, index) => {
          context.states.setCurrent(ref, ends[index].id);
          context.constraints.add({ id: `CONSTRAINT_${action.id}_SWAP_${index + 1}`, type: "OCCUPIES_FUNCTIONAL_POSITION", strength: "hard", subject_refs: [ends[index].id], object_refs: [starts[1 - index].id], action_ref: action.id, source_refs: action.source_refs });
          context.addPrimitive(action, "movement_path", { id_suffix: ref, actor_ref: ref, from_state_ref: starts[index].id, to_state_ref: ends[index].id, dictionary_ref: "VF_MOVEMENT_WITHOUT_BALL" });
        });
        return context.composedAction(action, this, { participant_refs: participants, from_state_refs: starts.map((state) => state.id), to_state_refs: ends.map((state) => state.id), ball_flow_independent: true });
      }
    };
  }

  function crossingOperator() {
    return {
      id: "crossing", semantic_types: ["cross", "crossing"], required_slots: ["actor_refs", "initial_attack_relation", "target_space_ref"], visual_primitives: ["movement_path"],
      compose(action, context) {
        const actorValue = context.require(action, { slot: "actor_refs", aliases: ["participant_refs"], label: "Quins dos jugadors fan l’encreuament?", options: "attackers", min_items: 2, max_items: 2 });
        const actors = values(actorValue);
        const initial = context.require(action, { slot: "initial_attack_relation", aliases: ["initial_space_ref"], label: "Quin espai ataca el primer jugador?", options: "spaces" });
        const target = context.require(action, { slot: "target_space_ref", label: "Quin espai contrari ataca el segon jugador?", options: "spaces", exclude: initial });
        if (!actors || !initial || !target) return context.unresolvedAction(action, this);
        const second = actors[1];
        const from = context.states.current(second);
        const to = context.states.ensure(second, `${action.id}:to`, { phase_ref: action.phase_ref, space_ref: target, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: true });
        context.constraints.add({ id: `CONSTRAINT_${action.id}_CROSSES`, type: "CROSSES_RELATIVE_TO", strength: "hard", subject_refs: [second], object_refs: [actors[0]], action_ref: action.id, status: "unresolved", source_refs: action.source_refs });
        context.constraints.add({ id: `CONSTRAINT_${action.id}_TARGET`, type: "ATTACKS", strength: "hard", subject_refs: [to.id], object_refs: [target], action_ref: action.id, source_refs: action.source_refs });
        context.addPrimitive(action, "movement_path", { actor_ref: second, from_state_ref: from.id, to_state_ref: to.id, geometry_support: "unresolved", dictionary_ref: "VF_MOVEMENT_WITHOUT_BALL" });
        return context.composedAction(action, this, { actor_refs: actors, initial_attack_relation: initial, target_space_ref: target, from_state_ref: from.id, to_state_ref: to.id });
      }
    };
  }

  function pivotSlideOperator() {
    return {
      id: "pivot_slide", semantic_types: ["pivot_slide", "slide"], required_slots: ["actor_ref"], visual_primitives: ["movement_path"],
      compose(action, context) {
        const actor = context.require(action, { slot: "actor_ref", label: "Quin pivot fa el lliscament?", options: "pivot" });
        if (!actor) return context.unresolvedAction(action, this);
        const from = context.states.current(actor);
        const to = context.states.ensure(actor, action.to_state_ref || `${action.id}:to`, {
          state_ref: action.to_state_ref, phase_ref: action.phase_ref, space_ref: action.to_space_ref || action.target_space_ref,
          position: action.to_position, authority: action.authority, source_refs: action.source_refs, status: "future", make_current: true
        });
        context.constraints.add({ id: `CONSTRAINT_${action.id}_NEAR_6M`, type: "NEAR_6M", strength: "hard", subject_refs: [from.id, to.id], object_refs: ["COURT_AREA_6M"], action_ref: action.id, source_refs: action.source_refs });
        if (!action.to_space_ref && !action.target_space_ref && !action.to_position) context.constraints.add({ id: `CONSTRAINT_${action.id}_DIRECTION`, type: "MOVEMENT_DIRECTION", strength: "hard", subject_refs: [from.id], object_refs: [], action_ref: action.id, status: "unresolved", source_refs: action.source_refs });
        context.addPrimitive(action, "movement_path", { actor_ref: actor, from_state_ref: from.id, to_state_ref: to.id, kind: "movement", geometry_support: action.to_position ? "explicit" : "conditional", dictionary_ref: "VF_PIVOT_SLIDE" });
        return context.composedAction(action, this, { actor_ref: actor, from_state_ref: from.id, to_state_ref: to.id, opponent_ref: action.opponent_ref || null, near_6m: true });
      }
    };
  }

  function createDefaultRegistry() {
    const registry = createRegistry();
    [movementOperator(), dribbleOperator(), passOperator(), receptionOperator(), shotOperator(), feintOperator(), blockOperator(), numericalRelationOperator(), permutationOperator(), crossingOperator(), pivotSlideOperator()].forEach((operator) => registry.register(operator));
    return registry;
  }

  return {
    OPERATIONAL_AUTHORITIES, values, actionSource, createRegistry, createDefaultRegistry,
    movementOperator, dribbleOperator, passOperator, receptionOperator, shotOperator, feintOperator,
    blockOperator, numericalRelationOperator, permutationOperator, crossingOperator, pivotSlideOperator
  };
});
