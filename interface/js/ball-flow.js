(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_BALL_FLOW = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function create(tacticalIR) {
    const balls = new Map();
    const states = [];
    const transitions = [];
    const diagnostics = [];

    function addInitial(ballRef, holderRef, source) {
      if (balls.has(ballRef)) return balls.get(ballRef);
      const state = {
        id: `BALL_STATE_${ballRef}_S0`, ball_ref: ballRef, holder_ref: holderRef || null,
        status: holderRef ? "held" : "unknown", action_ref: null,
        authority: source && source.authority || "unknown", source_refs: utils.deepClone(source && source.source_refs || [])
      };
      states.push(state); balls.set(ballRef, state); return state;
    }

    (tacticalIR.balls || []).slice().sort((a, b) => a.id.localeCompare(b.id)).forEach((ball) => addInitial(ball.id, ball.holder_ref, ball));
    (tacticalIR.ball_flow || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id))).forEach((flow) => {
      if (!balls.has(flow.ball_ref)) addInitial(flow.ball_ref, flow.holder_ref || flow.from_holder_ref, flow);
    });

    function current(ballRef) { return balls.get(ballRef) || null; }

    function ensureHeld(ballRef, holderRef, action, allowDerivation) {
      let before = current(ballRef);
      if (!before && allowDerivation) {
        before = addInitial(ballRef, holderRef, { authority: "derived_from_validated_rule", source_refs: action.source_refs || [] });
      }
      if (!before) {
        diagnostics.push({ code: "BALL_INITIAL_STATE_MISSING", action_ref: action.id, ball_ref: ballRef, expected_holder_ref: holderRef });
        return null;
      }
      if (before.holder_ref !== holderRef) {
        diagnostics.push({ code: "BALL_HOLDER_CONFLICT", action_ref: action.id, ball_ref: ballRef, expected_holder_ref: holderRef, actual_holder_ref: before.holder_ref });
        return null;
      }
      return before;
    }

    function transition(action, input) {
      const ballRef = input.ball_ref || "B1";
      const before = ensureHeld(ballRef, input.from_holder_ref, action, Boolean(input.allow_derived_initial_holder));
      if (!before) return null;
      const sequence = transitions.filter((item) => item.ball_ref === ballRef).length + 1;
      const after = {
        id: `BALL_STATE_${ballRef}_${String(sequence).padStart(3, "0")}`,
        ball_ref: ballRef,
        holder_ref: input.to_holder_ref === undefined ? input.from_holder_ref : input.to_holder_ref,
        status: input.after_status || (input.to_holder_ref === null ? "in_flight" : "held"),
        action_ref: action.id,
        authority: action.authority || "unknown",
        source_refs: utils.deepClone(action.source_refs || [])
      };
      states.push(after);
      balls.set(ballRef, after);
      const record = {
        id: `BALL_TRANSITION_${action.id}`,
        action_ref: action.id,
        type: input.type,
        ball_ref: ballRef,
        from_state_ref: before.id,
        to_state_ref: after.id,
        from_holder_ref: before.holder_ref,
        to_holder_ref: after.holder_ref,
        source_refs: utils.deepClone(action.source_refs || [])
      };
      transitions.push(record);
      return record;
    }

    function unchanged(action, ballRef) {
      const before = current(ballRef);
      return before ? { action_ref: action.id, ball_ref: ballRef, state_ref: before.id, holder_ref: before.holder_ref, transition: "unchanged" } : null;
    }

    return {
      current, transition, unchanged, diagnostics,
      snapshot: () => ({
        states: utils.deepClone(states),
        transitions: utils.deepClone(transitions),
        diagnostics: utils.deepClone(diagnostics)
      })
    };
  }

  return { create };
});
