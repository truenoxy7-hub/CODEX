(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const provider = isNode ? require("./interpretation-provider.js") : root.TRACA_INTERPRETATION_PROVIDER;
  const operators = isNode ? require("./composition-operators.js") : root.TRACA_COMPOSITION_OPERATORS;
  const api = factory(utils, provider, operators);
  if (isNode) module.exports = api;
  root.TRACA_CLARIFICATION_ORCHESTRATOR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, providerApi, operatorsApi) {
  "use strict";

  const DEFAULT_DEFENDER_IDS = new Set(["D1", "D2", "D3"]);

  function unique(values) {
    return [...new Set((values || []).filter((value) => value !== null && value !== undefined && value !== ""))];
  }

  function values(value) {
    return Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value];
  }

  function canonicalDefenders() {
    return (providerApi.DEFENDER_DEFINITIONS || []).filter((item) => DEFAULT_DEFENDER_IDS.has(item.id));
  }

  function canonicalIntervals() {
    return providerApi.CANONICAL_INTERVAL_DEFINITIONS || [];
  }

  function answerValue(record, sourceRevision) {
    if (!record || typeof record !== "object" || Array.isArray(record) || !Object.prototype.hasOwnProperty.call(record, "value")) return record;
    if (record.source_revision && sourceRevision && record.source_revision !== sourceRevision) return undefined;
    return record.value;
  }

  function answerSourceRefs(key, record) {
    if (record && typeof record === "object" && !Array.isArray(record) && Array.isArray(record.source_refs)) return unique(record.source_refs);
    return [`coach_answer:${key}`];
  }

  function definitionForParticipant(id) {
    return [...(providerApi.ROLE_DEFINITIONS || []), ...(providerApi.DEFENDER_DEFINITIONS || [])].find((item) => item.id === id) || null;
  }

  function intervalDefinition(id) {
    return canonicalIntervals().find((item) => item.id === id) || null;
  }

  function upsertParticipant(tacticalIR, id, configuration) {
    const definition = definitionForParticipant(id);
    if (!definition) return null;
    const options = configuration || {};
    const defenders = providerApi.DEFENDER_DEFINITIONS || [];
    const team = defenders.some((item) => item.id === definition.id) ? "defense" : "attack";
    const sourceRefs = unique(options.source_refs || []);
    let participant = (tacticalIR.participants || []).find((item) => item.id === id);
    if (!participant) {
      participant = {
        id: definition.id,
        label: definition.label,
        role: definition.role,
        kind: team === "defense" ? "defender" : "attacker",
        team,
        presence: options.explicit ? "explicit" : "structural_reference",
        functional_participation: options.explicit ? "declared" : "delimiter_only",
        structural_delimiter_refs: unique([options.delimiter_space_ref]),
        authority: options.explicit ? "coach_explicit_input" : "derived_from_validated_rule",
        status: options.explicit ? "explicit" : "validated",
        source_refs: sourceRefs
      };
      tacticalIR.participants.push(participant);
      return participant;
    }
    participant.source_refs = unique([...(participant.source_refs || []), ...sourceRefs]);
    participant.structural_delimiter_refs = unique([...(participant.structural_delimiter_refs || []), options.delimiter_space_ref]);
    if (options.explicit) {
      Object.assign(participant, {
        label: definition.label,
        role: definition.role,
        kind: team === "defense" ? "defender" : "attacker",
        team,
        presence: "explicit",
        functional_participation: "declared",
        authority: "coach_explicit_input",
        status: "explicit"
      });
    }
    return participant;
  }

  function ensureCanonicalSpace(tacticalIR, spaceId, sourceRefs) {
    const definition = intervalDefinition(spaceId);
    if (!definition) return null;
    const sources = unique([...(sourceRefs || []), `canonical:interval:${spaceId}`, "docs/DOMAIN_MODEL.md#3-espais-i-intervals"]);
    const delimiterRefs = definition.delimiters.map((item) => item.id);
    definition.delimiters.forEach((delimiter) => upsertParticipant(tacticalIR, delimiter.id, {
      explicit: false,
      delimiter_space_ref: spaceId,
      source_refs: unique([...sources, `space:${spaceId}`])
    }));
    let space = (tacticalIR.spaces || []).find((item) => item.id === spaceId);
    if (!space) {
      space = {
        id: definition.id,
        label: definition.label,
        type: "interval",
        relation: { type: "between", delimiter_refs: delimiterRefs.slice() },
        delimiter_refs: delimiterRefs.slice(),
        delimiter_derivations: definition.delimiters.map((delimiter) => ({
          delimiter_ref: delimiter.id,
          entity_kind: "defender",
          role: delimiter.role,
          presence: "structural_reference",
          authority: "derived_from_validated_rule",
          status: "validated",
          source_refs: unique([...sources, `space:${spaceId}`])
        })),
        authority: "canonical_spatial",
        status: "validated",
        source_refs: sources
      };
      tacticalIR.spaces.push(space);
    } else {
      space.source_refs = unique([...(space.source_refs || []), ...sources]);
    }
    return space;
  }

  function isParticipantSlot(slot) {
    return [
      "actor_ref", "sender_ref", "receiver_ref", "target_ref", "partner_ref", "blocker_ref",
      "opponent_ref", "blocked_defender_ref", "attacker_refs", "defender_refs", "participant_refs", "actor_refs"
    ].includes(slot);
  }

  function isSpaceSlot(slot) {
    return ["space_ref", "initial_space_ref", "start_space_ref", "from_space_ref", "target_space_ref", "end_space_ref", "to_space_ref", "initial_attack_relation"].includes(slot);
  }

  function materializeAnswer(tacticalIR, action, slot, value, sourceRefs) {
    action[slot] = Array.isArray(value) ? value.slice() : value;
    action.slot_authority = { ...(action.slot_authority || {}), [slot]: "coach_explicit_input" };
    action.slot_status = { ...(action.slot_status || {}), [slot]: "explicit" };
    action.slot_source_refs = { ...(action.slot_source_refs || {}), [slot]: unique(sourceRefs) };
    action.source_refs = unique([...(action.source_refs || []), ...sourceRefs]);
    if (isParticipantSlot(slot)) values(value).forEach((ref) => upsertParticipant(tacticalIR, ref, { explicit: true, source_refs: sourceRefs }));
    if (isSpaceSlot(slot)) values(value).forEach((ref) => ensureCanonicalSpace(tacticalIR, ref, sourceRefs));
  }

  function applyAnswers(tacticalIR, answers) {
    const result = utils.deepClone(tacticalIR || {});
    if (!Array.isArray(result.participants)) result.participants = [];
    if (!Array.isArray(result.spaces)) result.spaces = [];
    const sourceRevision = result.meta && result.meta.source_revision;
    const appliedAnswers = [];
    (result.actions || []).forEach((action) => {
      Object.entries(answers || {}).forEach(([key, record]) => {
        const prefix = `${action.id}:`;
        if (!key.startsWith(prefix)) return;
        const value = answerValue(record, sourceRevision);
        if (value === undefined || value === null || value === "" || Array.isArray(value) && !value.length) return;
        const slot = key.slice(prefix.length);
        const sourceRefs = answerSourceRefs(key, record);
        materializeAnswer(result, action, slot, value, sourceRefs);
        appliedAnswers.push({ question_ref: key, action_ref: action.id, slot, value: utils.deepClone(value), authority: "coach_explicit_input", status: "explicit", source_refs: sourceRefs });
      });
    });
    return { tacticalIR: result, applied_answers: appliedAnswers };
  }

  function intervalContains(spaceId, defenderRef) {
    const definition = intervalDefinition(spaceId);
    return Boolean(definition && definition.delimiters.some((item) => item.id === defenderRef));
  }

  function compatibleFeintTargets(opponentRef, initialSpaceRef) {
    if (!opponentRef || !initialSpaceRef || !intervalContains(initialSpaceRef, opponentRef)) return [];
    return canonicalIntervals().filter((item) => item.id !== initialSpaceRef && item.delimiters.some((delimiter) => delimiter.id === opponentRef));
  }

  function slotAuthority(action, slot) {
    return action.slot_authority && action.slot_authority[slot] || action.authority || "unknown";
  }

  function slotStatus(action, slot) {
    return action.slot_status && action.slot_status[slot] || action.status || "unknown";
  }

  function deriveUniqueFacts(tacticalIR) {
    const derivations = [];
    (tacticalIR.actions || []).filter((action) => ["feint", "one_v_one", "1x1"].includes(action.type) || ["feint", "one_v_one", "1x1"].includes(action.subtype)).forEach((action) => {
      if (action.target_space_ref || !action.opponent_ref || !action.initial_space_ref) return;
      const sourceSlots = ["opponent_ref", "initial_space_ref"];
      if (!sourceSlots.every((slot) => operatorsApi.OPERATIONAL_AUTHORITIES.has(slotAuthority(action, slot)) && !["candidate", "provisional"].includes(slotStatus(action, slot)))) return;
      const candidates = compatibleFeintTargets(action.opponent_ref, action.initial_space_ref);
      if (candidates.length !== 1) return;
      const target = candidates[0];
      const sourceRefs = unique([
        ...(action.slot_source_refs && action.slot_source_refs.opponent_ref || []),
        ...(action.slot_source_refs && action.slot_source_refs.initial_space_ref || []),
        `slot:${action.id}:opponent_ref`,
        `slot:${action.id}:initial_space_ref`,
        "canonical:interval-adjacency",
        "canonical:feint"
      ]);
      action.target_space_ref = target.id;
      action.slot_authority = { ...(action.slot_authority || {}), target_space_ref: "derived_from_validated_rule" };
      action.slot_status = { ...(action.slot_status || {}), target_space_ref: "validated" };
      action.slot_source_refs = { ...(action.slot_source_refs || {}), target_space_ref: sourceRefs };
      action.source_refs = unique([...(action.source_refs || []), ...sourceRefs]);
      ensureCanonicalSpace(tacticalIR, target.id, sourceRefs);
      derivations.push({
        id: `DERIVATION_${action.id}_TARGET_SPACE`,
        action_ref: action.id,
        slot: "target_space_ref",
        value: target.id,
        authority: "derived_from_validated_rule",
        status: "validated",
        source_refs: sourceRefs
      });
    });
    return derivations;
  }

  function prepare(tacticalIR, answers) {
    const answered = applyAnswers(tacticalIR, answers);
    const autoDerivations = deriveUniqueFacts(answered.tacticalIR);
    return { ...answered, auto_derivations: autoDerivations };
  }

  function option(value, label, kind, sourceRefs) {
    return { value, label: label || value, kind, status: "selectable", source_refs: unique(sourceRefs || []) };
  }

  function deduplicateOptions(options) {
    const seen = new Set();
    return options.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }

  function optionList(kind, tacticalIR, configuration) {
    const options = configuration || {};
    const excluded = new Set(values(options.exclude));
    const action = options.action || {};
    if (kind === "spaces") {
      let definitions = canonicalIntervals().slice();
      if (["feint", "one_v_one", "1x1"].includes(action.type) || ["feint", "one_v_one", "1x1"].includes(action.subtype)) {
        if (action.opponent_ref) definitions = definitions.filter((item) => item.delimiters.some((delimiter) => delimiter.id === action.opponent_ref));
        if (options.slot === "target_space_ref" && action.initial_space_ref) definitions = compatibleFeintTargets(action.opponent_ref, action.initial_space_ref);
      }
      const canonical = definitions.map((item) => option(item.id, item.label, "space", [`canonical:interval:${item.id}`]));
      const existing = (tacticalIR.spaces || []).map((item) => option(item.id, item.label || item.id, "space", item.source_refs));
      return deduplicateOptions([...canonical, ...existing]).filter((item) => !excluded.has(item.value));
    }
    const participants = (tacticalIR.participants || []).filter((item) => !excluded.has(item.id));
    if (kind === "pivot") return participants.filter((item) => item.role === "pivot" || item.id === "PV").map((item) => option(item.id, item.label || item.id, "participant", item.source_refs));
    if (kind === "opponents") {
      const canonical = canonicalDefenders().map((item) => option(item.id, item.label, "defensive_reference", [`canonical:defender:${item.id}`]));
      const defenders = participants.filter((item) => item.team === "defense" || item.kind === "defender" || /^D\d|DAV/.test(item.id)).map((item) => option(item.id, item.label || item.id, "defensive_reference", item.source_refs));
      const materials = (tacticalIR.materials || []).filter((item) => item.opponent_equivalence || item.function === "active_oppositional_substitute").map((item) => option(item.id, item.label || item.id, "material", item.source_refs));
      return deduplicateOptions([...canonical, ...defenders, ...materials]).filter((item) => !excluded.has(item.value));
    }
    return participants.filter((item) => item.team !== "defense" && item.kind !== "defender" && !/^D\d|DAV/.test(item.id)).map((item) => option(item.id, item.label || item.id, "participant", item.source_refs));
  }

  function optionsFor(question, tacticalIR) {
    const action = (tacticalIR.actions || []).find((item) => item.id === question.action_ref) || {};
    return optionList(question.option_kind, tacticalIR, { action, slot: question.slot, exclude: question.exclude });
  }

  function orchestrate(questions, tacticalIR, orderedActions) {
    const temporalIndex = new Map((orderedActions || []).map((action, index) => [action.id, index]));
    const pending = new Set((questions || []).map((question) => question.id));
    function rank(left, right) {
      return left.temporal_index - right.temporal_index || right.priority - left.priority || right.unlock_count - left.unlock_count || left.id.localeCompare(right.id);
    }
    const enriched = (questions || []).map((question) => {
      const dependencies = unique(question.depends_on || []);
      const unlocked = dependencies.every((slot) => !pending.has(`${question.action_ref}:${slot}`));
      return {
        ...question,
        options: optionsFor(question, tacticalIR),
        depends_on: dependencies,
        priority: Number(question.priority || 0),
        temporal_index: temporalIndex.has(question.action_ref) ? temporalIndex.get(question.action_ref) : Number.MAX_SAFE_INTEGER,
        orchestration_status: unlocked ? "available" : "waiting_dependency"
      };
    }).sort(rank);
    const active = enriched.filter((question) => question.orchestration_status === "available").sort(rank)[0] || null;
    return { active_question: active ? utils.deepClone(active) : null, remaining_questions: enriched };
  }

  return {
    canonicalDefenders, canonicalIntervals, answerValue, intervalDefinition,
    applyAnswers, deriveUniqueFacts, prepare, optionList, optionsFor,
    compatibleFeintTargets, orchestrate
  };
});
