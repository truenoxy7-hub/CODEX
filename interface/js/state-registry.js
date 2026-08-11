(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_STATE_REGISTRY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function stableToken(value) {
    return String(value || "state").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase() || "STATE";
  }

  function create(tacticalIR) {
    const participants = new Map((tacticalIR.participants || []).map((item) => [item.id, item]));
    const states = [];
    const byId = new Map();
    const bySemanticKey = new Map();
    const current = new Map();

    function add(state, semanticKey, makeCurrent) {
      if (!participants.has(state.participant_ref)) throw new Error(`STATE_PARTICIPANT_UNKNOWN:${state.participant_ref}`);
      const previous = byId.get(state.id);
      if (previous && previous.participant_ref !== state.participant_ref) throw new Error(`STATE_OWNER_CONFLICT:${state.id}`);
      const result = previous || state;
      if (!previous) {
        states.push(result);
        byId.set(result.id, result);
      }
      if (semanticKey) bySemanticKey.set(`${state.participant_ref}|${semanticKey}`, result.id);
      if (makeCurrent !== false) current.set(state.participant_ref, result.id);
      return result;
    }

    (tacticalIR.participant_states || []).slice().sort((a, b) => a.id.localeCompare(b.id)).forEach((state) => add({
      id: state.id,
      participant_ref: state.participant_ref,
      state_key: state.state_key || state.id,
      phase_ref: state.phase_ref || null,
      space_ref: state.space_ref || null,
      functional_position_ref: state.functional_position_ref || null,
      position: Array.isArray(state.position) ? state.position.slice() : null,
      status: state.status || "current",
      authority: state.authority || "unknown",
      source_refs: utils.deepClone(state.source_refs || [])
    }, state.state_key || state.id, state.status !== "future"));

    (tacticalIR.participants || []).slice().sort((a, b) => a.id.localeCompare(b.id)).forEach((participant) => {
      if (current.has(participant.id)) return;
      add({
        id: `STATE_${stableToken(participant.id)}_S0`,
        participant_ref: participant.id,
        state_key: "S0",
        phase_ref: participant.phase_ref || null,
        space_ref: participant.space_ref || null,
        functional_position_ref: null,
        position: Array.isArray(participant.position) ? participant.position.slice() : null,
        status: "current",
        authority: participant.authority || "unknown",
        source_refs: utils.deepClone(participant.source_refs || [])
      }, "initial", true);
    });

    function ensure(participantRef, semanticKey, options) {
      const configuration = options || {};
      if (!participants.has(participantRef)) throw new Error(`STATE_PARTICIPANT_UNKNOWN:${participantRef}`);
      const requestedId = configuration.state_ref || null;
      if (requestedId && byId.has(requestedId)) {
        const existing = byId.get(requestedId);
        if (existing.participant_ref !== participantRef) throw new Error(`STATE_OWNER_CONFLICT:${requestedId}`);
        if (configuration.make_current) current.set(participantRef, existing.id);
        return existing;
      }
      const mapKey = `${participantRef}|${semanticKey}`;
      if (bySemanticKey.has(mapKey)) {
        const existing = byId.get(bySemanticKey.get(mapKey));
        if (configuration.make_current) current.set(participantRef, existing.id);
        return existing;
      }
      const id = requestedId || `STATE_${stableToken(participantRef)}_${stableToken(semanticKey)}`;
      return add({
        id,
        participant_ref: participantRef,
        state_key: semanticKey,
        phase_ref: configuration.phase_ref || null,
        space_ref: configuration.space_ref || null,
        functional_position_ref: configuration.functional_position_ref || null,
        position: Array.isArray(configuration.position) ? configuration.position.slice() : null,
        status: configuration.status || "future",
        authority: configuration.authority || "derived_from_validated_rule",
        source_refs: utils.deepClone(configuration.source_refs || [])
      }, semanticKey, Boolean(configuration.make_current));
    }

    function currentState(participantRef) {
      const id = current.get(participantRef);
      return id ? byId.get(id) : null;
    }

    function setCurrent(participantRef, stateRef) {
      const state = byId.get(stateRef);
      if (!state || state.participant_ref !== participantRef) throw new Error(`STATE_CURRENT_INVALID:${participantRef}:${stateRef}`);
      current.set(participantRef, stateRef);
      return state;
    }

    return {
      participants,
      states,
      byId,
      ensure,
      current: currentState,
      setCurrent,
      snapshot: () => utils.deepClone(states.slice().sort((a, b) => a.id.localeCompare(b.id)))
    };
  }

  return { stableToken, create };
});
