(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (isNode) module.exports = api;
  root.TRACA_INTERPRETATION = api;
  root.TRACA_INTERPRETATION_PROVIDER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function includesAlias(text, alias) {
    const normalizedAlias = normalize(alias);
    if (/^[a-z0-9]+$/.test(normalizedAlias)) {
      return new RegExp(`(^|[^a-z0-9])${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text);
    }
    return text.includes(normalizedAlias);
  }

  function matchLocalKnowledge(description, knowledge) {
    const text = normalize(description);
    const concepts = [];
    (knowledge.concepts || []).forEach((concept) => {
      const matched = (concept.aliases || []).find((alias) => includesAlias(text, alias));
      if (!matched) return;
      concepts.push({
        id: concept.id,
        label: concept.label,
        category: concept.category,
        knowledge_state: "provisional",
        match_status: "provisional_match",
        source: "local_rule_provider",
        confidence: "explicit_term",
        evidence: matched,
        canonical_concept_ref: concept.canonical_ref,
        reason: `Coincidència explícita amb «${matched}».`
      });
    });
    const unknownConcepts = [];
    (knowledge.candidate_phrases || []).forEach((candidate, index) => {
      const matched = (candidate.aliases || []).find((alias) => includesAlias(text, alias));
      if (!matched) return;
      unknownConcepts.push({
        id: `UNKNOWN-${String(index + 1).padStart(3, "0")}`,
        label: candidate.label,
        knowledge_state: "unknown",
        source: "coach_text",
        evidence: matched,
        definition: "",
        reason: candidate.reason
      });
    });
    return { concepts, unknownConcepts };
  }

  function suggestedTags(description, concepts) {
    const priorities = { action: 0, tactical_context: 1, space: 2, participant_role: 3, defensive_role: 3, material: 4 };
    const ordered = (concepts || []).slice().sort((left, right) => (priorities[left.category] ?? 9) - (priorities[right.category] ?? 9));
    const tags = [];
    ordered.forEach((concept) => {
      const label = String(concept.label || "").trim();
      if (label && !tags.includes(label)) tags.push(label);
    });
    const explicitRelations = normalize(description).match(/\b\d+\s*(?:x|v)\s*\d+\b/g) || [];
    explicitRelations.map((tag) => tag.replace(/\s+/g, "").replace("v", "x")).reverse().forEach((tag) => {
      if (!tags.includes(tag)) tags.unshift(tag);
    });
    return tags.slice(0, 8);
  }

  const ROLE_DEFINITIONS = [
    { id: "CE", role: "central", label: "CE", pattern: "central|ce" },
    { id: "L", role: "lateral", label: "L", pattern: "lateral|laterals" },
    { id: "PV", role: "pivot", label: "PV", pattern: "pivot|pv" },
    { id: "EXT", role: "extrem", label: "EXT", pattern: "extrem|extrems" },
    { id: "P", role: "passer", label: "P", pattern: "passador|passadora" }
  ];
  const DEFENDER_DEFINITIONS = [
    { id: "D1", role: "first", label: "D1", pattern: "d1|primer defensor|1r defensor" },
    { id: "D2", role: "second", label: "D2", pattern: "d2|segon defensor|2n defensor" },
    { id: "D3", role: "third", label: "D3", pattern: "d3|tercer defensor|3r defensor" },
    { id: "DAV", role: "advanced", label: "DAV", pattern: "dav|avancat defensiu|avancat" }
  ];
  const CANONICAL_INTERVAL_DEFINITIONS = Object.freeze([
    {
      id: "INT_12", label: "Interval 1–2", token: /\b(?:1\s*[-–]\s*2|12)\b/g,
      delimiters: [{ id: "D1", role: "first", label: "D1" }, { id: "D2", role: "second", label: "D2" }]
    },
    {
      id: "INT_23", label: "Interval 2–3", token: /\b(?:2\s*[-–]\s*3|23)\b/g,
      delimiters: [{ id: "D2", role: "second", label: "D2" }, { id: "D3", role: "third", label: "D3" }]
    },
    {
      id: "INT_33", label: "Interval 3–3", token: /\b(?:3\s*[-–]\s*3|33)\b/g,
      delimiters: [{ id: "D3_LOCAL", role: "third", label: "D3 local" }, { id: "D3_OPOSAT", role: "third", label: "D3 oposat" }]
    }
  ]);

  function roleRegex(definitions) {
    return definitions.map((item) => `(?:${item.pattern})`).join("|");
  }

  function definitionForMention(value, definitions) {
    const mention = normalize(value).trim();
    return definitions.find((item) => new RegExp(`^(?:${item.pattern})$`).test(mention)) || null;
  }

  function nearestRole(text, index, definitions) {
    const prefix = text.slice(Math.max(0, index - 120), index);
    let best = null;
    definitions.forEach((definition) => {
      const matches = [...prefix.matchAll(new RegExp(`\\b(?:${definition.pattern})\\b`, "g"))];
      const last = matches.at(-1);
      if (last && (!best || last.index > best.index)) best = { definition, index: last.index };
    });
    return best && best.definition || null;
  }

  const ACTION_SPATIAL_CONTRACT = Object.freeze({
    reception: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["space_ref", "to_space_ref", "target_space_ref", "end_space_ref"] },
    movement: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    movement_without_ball: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    recovery: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    dribble: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    movement_with_dribble: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    feint: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    one_v_one: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    "1x1": { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    pivot_slide: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: ["target_space_ref", "to_space_ref", "end_space_ref"] },
    shot: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: [] },
    finish: { initial_fields: ["initial_space_ref", "from_space_ref"], terminal_fields: [] }
  });

  const CONTINUITY_AUTHORITIES = new Set([
    "coach_explicit_input", "coach_validated", "canonical_semantic", "canonical_spatial",
    "canonical_validated", "semantic_validated", "spatial_validated",
    "validated_local_knowledge", "derived_from_validated_rule", "graphic_legend"
  ]);

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function spatialSlot(action, fields) {
    const field = (fields || []).find((candidate) => action && action[candidate] !== undefined && action[candidate] !== null && action[candidate] !== "");
    if (!field) return null;
    return {
      field,
      value: action[field],
      authority: action.slot_authority && action.slot_authority[field] || action.authority || "unknown",
      status: action.slot_status && action.slot_status[field] || action.status || "unknown",
      source_refs: unique(action.slot_source_refs && action.slot_source_refs[field] || action.source_refs || [])
    };
  }

  function initialSpace(action) {
    const contract = action && ACTION_SPATIAL_CONTRACT[action.type];
    return contract ? spatialSlot(action, contract.initial_fields) : null;
  }

  function terminalSpace(action) {
    const contract = action && ACTION_SPATIAL_CONTRACT[action.type];
    return contract ? spatialSlot(action, contract.terminal_fields) : null;
  }

  function continuityActor(action) {
    if (!action) return null;
    if (action.actor_ref) return action.actor_ref;
    const actorRefs = action.actor_refs || [];
    return actorRefs.length === 1 ? actorRefs[0] : null;
  }

  function addSpatialConflict(action, predecessor, predecessorTerminal, currentInitial, relations) {
    const sourceRefs = unique([
      ...(predecessorTerminal.source_refs || []), ...(currentInitial && currentInitial.source_refs || []),
      `derived:spatial_continuity:${predecessor.id}->${action.id}`
    ]);
    const conflict = {
      code: "ACTION_SPATIAL_CONTINUITY_CONFLICT",
      predecessor_action_ref: predecessor.id,
      action_ref: action.id,
      predecessor_terminal_space_ref: predecessorTerminal.value,
      action_initial_space_ref: currentInitial && currentInitial.value || null,
      authority: "derived_from_validated_rule",
      status: "unresolved",
      source_refs: sourceRefs
    };
    action.spatial_conflicts = [...(action.spatial_conflicts || []), conflict];
    relations.push({
      id: `REL_${action.id}_SPATIAL_CONTINUITY_CONFLICT_${action.spatial_conflicts.length}`,
      type: "spatial_continuity_conflict",
      from_ref: predecessor.id,
      to_ref: action.id,
      space_refs: unique([predecessorTerminal.value, currentInitial && currentInitial.value]),
      authority: conflict.authority,
      status: conflict.status,
      source_refs: sourceRefs
    });
  }

  function resolveSpatialContinuity(actions) {
    const relations = [];
    const byId = new Map((actions || []).map((action) => [action.id, action]));
    (actions || []).forEach((action) => {
      const contract = ACTION_SPATIAL_CONTRACT[action.type];
      const actorRef = continuityActor(action);
      if (!contract || !contract.initial_fields.length || !actorRef) return;
      const candidates = unique(action.after || []).map((ref) => byId.get(ref)).filter((predecessor) => {
        return predecessor && continuityActor(predecessor) === actorRef;
      }).map((predecessor) => ({ predecessor, terminal: terminalSpace(predecessor) })).filter((item) => {
        return item.terminal && CONTINUITY_AUTHORITIES.has(item.terminal.authority) && !["candidate", "provisional", "unknown"].includes(item.terminal.status);
      });
      if (!candidates.length) return;

      const currentInitial = initialSpace(action);
      const candidateValues = unique(candidates.map((item) => item.terminal.value));
      if (candidateValues.length > 1) {
        candidates.forEach((item) => addSpatialConflict(action, item.predecessor, item.terminal, currentInitial, relations));
        return;
      }
      const candidate = candidates[0];
      if (currentInitial && currentInitial.value !== candidate.terminal.value) {
        addSpatialConflict(action, candidate.predecessor, candidate.terminal, currentInitial, relations);
        return;
      }

      const sourceRef = `derived:spatial_continuity:${candidate.predecessor.id}->${action.id}`;
      const sourceRefs = unique([...(candidate.terminal.source_refs || []), sourceRef]);
      if (!currentInitial) {
        const field = contract.initial_fields[0];
        action[field] = candidate.terminal.value;
        action.slot_authority = { ...(action.slot_authority || {}), [field]: "derived_from_validated_rule" };
        action.slot_status = { ...(action.slot_status || {}), [field]: "validated" };
        action.slot_source_refs = { ...(action.slot_source_refs || {}), [field]: sourceRefs };
        action.spatial_derivations = [...(action.spatial_derivations || []), {
          slot: field,
          relation: "terminal_space_to_initial_space",
          predecessor_action_ref: candidate.predecessor.id,
          predecessor_slot: candidate.terminal.field,
          value: candidate.terminal.value,
          authority: "derived_from_validated_rule",
          status: "validated",
          source_refs: sourceRefs
        }];
      }
      relations.push({
        id: `REL_${action.id}_SPATIAL_CONTINUITY_${relations.length + 1}`,
        type: "spatial_continuity",
        from_ref: candidate.predecessor.id,
        to_ref: action.id,
        space_ref: candidate.terminal.value,
        actor_ref: actorRef,
        authority: "derived_from_validated_rule",
        status: "validated",
        source_refs: sourceRefs
      });
    });
    return relations;
  }

  function setExplicitSpatialSlot(action, field, mention) {
    if (!action || !mention || action[field]) return;
    action[field] = mention.id;
    action.slot_authority = { ...(action.slot_authority || {}), [field]: "coach_explicit_input" };
    action.slot_status = { ...(action.slot_status || {}), [field]: "explicit" };
    action.slot_source_refs = { ...(action.slot_source_refs || {}), [field]: [mention.source_ref] };
    action.source_refs = unique([...(action.source_refs || []), mention.source_ref]);
  }

  function attachExplicitActionSpaces(actions, spaceMentions, text) {
    (actions || []).forEach((action, index) => {
      const nextIndex = actions[index + 1] && actions[index + 1]._index || text.length;
      const mentions = (spaceMentions || []).filter((mention) => mention.index >= action._index && mention.index < nextIndex);
      if (!mentions.length) return;
      if (action.type === "reception") {
        setExplicitSpatialSlot(action, "space_ref", mentions[0]);
        return;
      }
      if (!["feint", "one_v_one", "1x1"].includes(action.type)) return;
      if (mentions.length > 1) {
        setExplicitSpatialSlot(action, "initial_space_ref", mentions[0]);
        setExplicitSpatialSlot(action, "target_space_ref", mentions.at(-1));
        return;
      }
      const beforeMention = text.slice(action._index, mentions[0].index);
      const isTarget = /\b(?:surt|sortir|acaba|finalitza|va|ataca)\b[^.;]*\b(?:cap\s+a|a|en)\b|\bcap\s+a\b/.test(beforeMention);
      setExplicitSpatialSlot(action, isTarget ? "target_space_ref" : "initial_space_ref", mentions[0]);
    });
  }

  function buildTacticalIR(description, concepts, options) {
    const text = normalize(description);
    const caseId = options && options.case_id || "CASE";
    const sourceRevision = utils.fingerprint(description);
    const participants = new Map();
    const actions = [];
    const spaces = [];
    const spaceMentions = [];
    const rolePattern = roleRegex(ROLE_DEFINITIONS);
    const defenderPattern = roleRegex(DEFENDER_DEFINITIONS);

    function addParticipant(definition, team, sourceRef, metadata) {
      if (!definition) return null;
      const configuration = metadata || {};
      const presence = configuration.presence || "explicit";
      const authority = presence === "structural_reference" ? "derived_from_validated_rule" : "coach_explicit_input";
      const status = presence === "structural_reference" ? "validated" : "explicit";
      const sourceRefs = unique([sourceRef || "coach_input", ...(configuration.source_refs || [])]);
      const existing = participants.get(definition.id);
      if (!existing) {
        const participant = {
          id: definition.id, label: definition.label, role: definition.role,
          kind: team === "defense" ? "defender" : "attacker", team,
          presence, functional_participation: presence === "structural_reference" ? "delimiter_only" : "declared",
          structural_delimiter_refs: unique([configuration.delimiter_space_ref]),
          authority, status, source_refs: sourceRefs
        };
        participants.set(definition.id, participant);
        return participant;
      }
      existing.source_refs = unique([...(existing.source_refs || []), ...sourceRefs]);
      existing.structural_delimiter_refs = unique([...(existing.structural_delimiter_refs || []), configuration.delimiter_space_ref]);
      if (presence !== "structural_reference" && existing.presence === "structural_reference") {
        Object.assign(existing, {
          label: definition.label, role: definition.role,
          kind: team === "defense" ? "defender" : "attacker", team,
          presence: "explicit", functional_participation: "declared",
          authority: "coach_explicit_input", status: "explicit"
        });
      }
      return existing;
    }

    [...ROLE_DEFINITIONS, ...DEFENDER_DEFINITIONS].forEach((definition) => {
      const match = text.match(new RegExp(`\\b(?:${definition.pattern})\\b`));
      if (match) addParticipant(definition, DEFENDER_DEFINITIONS.includes(definition) ? "defense" : "attack", `coach_input:span:${match.index}-${match.index + match[0].length}`);
    });

    const explicitSpaces = CANONICAL_INTERVAL_DEFINITIONS;
    explicitSpaces.forEach((space) => {
      const matches = [...text.matchAll(new RegExp(space.token.source, space.token.flags))];
      matches.forEach((match) => spaceMentions.push({
        id: space.id,
        index: match.index,
        end: match.index + match[0].length,
        source_ref: `coach_input:span:${match.index}-${match.index + match[0].length}`
      }));
      const match = matches[0];
      if (match) {
        const mentionSource = `coach_input:span:${match.index}-${match.index + match[0].length}`;
        const canonicalSource = `canonical:interval:${space.id}`;
        const contractSource = "docs/DOMAIN_MODEL.md#3-espais-i-intervals";
        const delimiterRefs = space.delimiters.map((delimiter) => delimiter.id);
        const delimiterDerivations = space.delimiters.map((delimiter) => ({
          delimiter_ref: delimiter.id,
          entity_kind: "defender",
          role: delimiter.role,
          presence: "structural_reference",
          authority: "derived_from_validated_rule",
          status: "validated",
          source_refs: [`space:${space.id}`, canonicalSource, contractSource, mentionSource]
        }));
        space.delimiters.forEach((delimiter) => addParticipant(delimiter, "defense", mentionSource, {
          presence: "structural_reference",
          delimiter_space_ref: space.id,
          source_refs: [`space:${space.id}`, canonicalSource, contractSource]
        }));
        spaces.push({
          id: space.id, label: space.label, type: "interval",
          relation: { type: "between", delimiter_refs: delimiterRefs.slice() },
          delimiter_refs: delimiterRefs.slice(), delimiter_derivations: delimiterDerivations,
          authority: "canonical_spatial", status: "validated",
          source_refs: [mentionSource, canonicalSource, contractSource]
        });
      }
    });
    spaceMentions.sort((left, right) => left.index - right.index);

    function addAction(index, type, payload, endIndex) {
      actions.push({
        _index: index, _end: endIndex || index + 1, type, ...payload,
        authority: "coach_explicit_input", status: "explicit",
        source_refs: [`coach_input:span:${index}-${endIndex || index + 1}`]
      });
    }

    const passRegex = new RegExp(`\\b(${rolePattern})\\b\\s+(?:passa|passada\\s+(?:a|cap a)|passar\\s+(?:a|cap a))\\s+(?:a\\s+|al\\s+|a la\\s+|a l['’])?\\b(${rolePattern})\\b`, "g");
    for (const match of text.matchAll(passRegex)) {
      const sender = definitionForMention(match[1], ROLE_DEFINITIONS), receiver = definitionForMention(match[2], ROLE_DEFINITIONS);
      if (!sender || !receiver) continue;
      addParticipant(sender, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`);
      addParticipant(receiver, "attack", `coach_input:span:${match.index}-${match.index + match[0].length}`);
      addAction(match.index, "pass", { actor_ref: sender.id, receiver_ref: receiver.id, ball_ref: "B1" }, match.index + match[0].length);
    }
    if (!actions.some((action) => action.type === "pass")) {
      const genericPass = text.match(/\b(?:passada|passa|passar)\b/);
      if (genericPass) addAction(genericPass.index, "pass", { ball_ref: "B1" }, genericPass.index + genericPass[0].length);
    }

    const receptionRegex = new RegExp(`(?:\\b(${rolePattern})\\b\\s+|\\bque\\s+)(?:rep|rebre|recepcio)\\b`, "g");
    for (const match of text.matchAll(receptionRegex)) {
      const explicit = match[1] && definitionForMention(match[1], ROLE_DEFINITIONS);
      const priorPass = actions.filter((action) => action.type === "pass" && action._index < match.index).sort((a, b) => b._index - a._index)[0];
      const actor = explicit && explicit.id || priorPass && priorPass.receiver_ref;
      if (!actor) continue;
      const movingSlice = text.slice(match.index, Math.min(text.length, match.index + 90));
      addAction(match.index, "reception", { actor_ref: actor, mode: /en carrera|en moviment|orientad/.test(movingSlice) ? "in_motion" : "stationary" }, match.index + match[0].length);
    }
    if (!actions.some((action) => action.type === "reception")) {
      const genericReception = text.match(/\b(?:recepcio|rebre|rep)\b/);
      if (genericReception) addAction(genericReception.index, "reception", { mode: /en carrera|en moviment|orientad/.test(text.slice(genericReception.index, genericReception.index + 90)) ? "in_motion" : "stationary" }, genericReception.index + genericReception[0].length);
    }

    for (const match of text.matchAll(/\b(?:fa\s+|realitza\s+)?(?:una\s+)?finta\b/g)) {
      const actor = nearestRole(text, match.index, ROLE_DEFINITIONS) || (() => {
        const prior = actions.filter((action) => action._index < match.index && (action.receiver_ref || action.actor_ref)).sort((a, b) => b._index - a._index)[0];
        return prior && ROLE_DEFINITIONS.find((item) => item.id === (prior.receiver_ref || prior.actor_ref));
      })();
      const tail = text.slice(match.index, Math.min(text.length, match.index + 180));
      const defenderMatch = tail.match(new RegExp(`\\b(${defenderPattern})\\b`));
      const opponent = defenderMatch && definitionForMention(defenderMatch[1], DEFENDER_DEFINITIONS);
      if (opponent) addParticipant(opponent, "defense", `coach_input:span:${match.index + defenderMatch.index}-${match.index + defenderMatch.index + defenderMatch[0].length}`);
      addAction(match.index, "feint", {
        actor_ref: actor && actor.id, opponent_ref: opponent && opponent.id
      }, match.index + match[0].length);
    }

    for (const match of text.matchAll(/\b(2\s*[xv]\s*1|2\s+contra\s+1)\b/g)) {
      const prior = actions.filter((action) => action._index < match.index).sort((a, b) => b._index - a._index)[0];
      const actor = prior && (prior.actor_ref || prior.receiver_ref);
      const tail = text.slice(match.index, Math.min(text.length, match.index + 150));
      const partnerMatch = tail.match(new RegExp(`\\bamb\\s+(?:el\\s+|la\\s+)?(${rolePattern})\\b`));
      const defenderMatch = tail.match(new RegExp(`\\bcontra\\s+(?:el\\s+|la\\s+)?(${defenderPattern})\\b`));
      const partner = partnerMatch && definitionForMention(partnerMatch[1], ROLE_DEFINITIONS);
      const defender = defenderMatch && definitionForMention(defenderMatch[1], DEFENDER_DEFINITIONS);
      if (partner) addParticipant(partner, "attack", `coach_input:span:${match.index + partnerMatch.index}-${match.index + partnerMatch.index + partnerMatch[0].length}`);
      if (defender) addParticipant(defender, "defense", `coach_input:span:${match.index + defenderMatch.index}-${match.index + defenderMatch.index + defenderMatch[0].length}`);
      addAction(match.index, "numerical_relation", { subtype: "2x1", attacker_refs: [actor, partner && partner.id].filter(Boolean), defender_refs: [defender && defender.id].filter(Boolean) }, match.index + match[0].length);
    }

    const blockRegex = new RegExp(`\\b(${rolePattern})\\b\\s+(?:bloqueja|fa\\s+(?:un\\s+)?bloqueig\\s+(?:a|sobre))\\s+(?:el\\s+|la\\s+)?(${defenderPattern})\\b`, "g");
    for (const match of text.matchAll(blockRegex)) {
      const blocker = definitionForMention(match[1], ROLE_DEFINITIONS), defender = definitionForMention(match[2], DEFENDER_DEFINITIONS);
      addParticipant(blocker, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`); addParticipant(defender, "defense", `coach_input:span:${match.index}-${match.index + match[0].length}`);
      addAction(match.index, "block", { actor_ref: blocker.id, blocked_defender_ref: defender.id }, match.index + match[0].length);
    }

    for (const match of text.matchAll(/\bpermuta\s+(central|lateral)\s*[-–]\s*(central|lateral)\b/g)) {
      const first = definitionForMention(match[1], ROLE_DEFINITIONS), second = definitionForMention(match[2], ROLE_DEFINITIONS);
      addParticipant(first, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`); addParticipant(second, "attack", `coach_input:span:${match.index}-${match.index + match[0].length}`);
      addAction(match.index, "permutation", { participant_refs: [first.id, second.id], notation: `${first.role}-${second.role}` }, match.index + match[0].length);
    }

    const crossRegex = new RegExp(`\\b(${rolePattern})\\b\\s+(?:encreua|fa\\s+(?:un\\s+)?encreuament)\\s+(?:amb\\s+)?(?:el\\s+|la\\s+)?(${rolePattern})\\b`, "g");
    for (const match of text.matchAll(crossRegex)) {
      const first = definitionForMention(match[1], ROLE_DEFINITIONS), second = definitionForMention(match[2], ROLE_DEFINITIONS);
      const tail = text.slice(match.index, Math.min(text.length, match.index + 150));
      const foundSpaces = explicitSpaces.filter((space) => { space.token.lastIndex = 0; const found = space.token.test(tail); space.token.lastIndex = 0; return found; });
      addParticipant(first, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`); addParticipant(second, "attack", `coach_input:span:${match.index}-${match.index + match[0].length}`);
      addAction(match.index, "cross", { actor_refs: [first.id, second.id], initial_attack_relation: foundSpaces[0] && foundSpaces[0].id, target_space_ref: foundSpaces[1] && foundSpaces[1].id }, match.index + match[0].length);
    }

    const slideRegex = new RegExp(`\\b(${rolePattern})\\b\\s+(?:llisca|fa\\s+(?:un\\s+)?lliscament)\\b`, "g");
    for (const match of text.matchAll(slideRegex)) {
      const actor = definitionForMention(match[1], ROLE_DEFINITIONS); addParticipant(actor, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`);
      addAction(match.index, "pivot_slide", { actor_ref: actor.id }, match.index + match[0].length);
    }

    const shotRegex = new RegExp(`\\b(${rolePattern})\\b\\s+(?:llanca|finalitza|fa\\s+(?:un\\s+)?llancament)\\b`, "g");
    for (const match of text.matchAll(shotRegex)) {
      const actor = definitionForMention(match[1], ROLE_DEFINITIONS); addParticipant(actor, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`);
      addAction(match.index, "shot", { actor_ref: actor.id, ball_ref: "B1", target_goal_ref: "COURT_GOAL" }, match.index + match[0].length);
    }

    const dribbleRegex = new RegExp(`\\b(${rolePattern})\\b[^.;]{0,50}\\b(?:en bot|botant)\\b`, "g");
    for (const match of text.matchAll(dribbleRegex)) {
      const actor = definitionForMention(match[1], ROLE_DEFINITIONS); addParticipant(actor, "attack", `coach_input:span:${match.index}-${match.index + match[1].length}`);
      addAction(match.index, "dribble", { actor_ref: actor.id, ball_ref: "B1" }, match.index + match[0].length);
    }

    actions.sort((left, right) => left._index - right._index || left.type.localeCompare(right.type));
    attachExplicitActionSpaces(actions, spaceMentions, text);
    actions.forEach((action, index) => { action.id = `A${String(index + 1).padStart(3, "0")}`; });
    actions.forEach((action, index) => {
      if (!index) return;
      const previous = actions[index - 1];
      const connector = text.slice(previous._end, action._index);
      if (/\b(?:despres|tot seguit|aleshores|que|i)\b|[,;]/.test(connector)) action.after = [previous.id];
    });
    actions.filter((action) => action.type === "reception").forEach((reception) => {
      const pass = actions.filter((action) => action.type === "pass" && action._index < reception._index && action.receiver_ref === reception.actor_ref).at(-1);
      if (pass) reception.after = [...new Set([...(reception.after || []), pass.id])];
    });
    const spatialContinuityRelations = resolveSpatialContinuity(actions);
    actions.forEach((action) => { delete action._index; delete action._end; });

    const relations = [];
    actions.forEach((action) => {
      if (action.actor_ref) relations.push({ id: `REL_${action.id}_PERFORMS`, type: "performs", from_ref: action.actor_ref, to_ref: action.id, authority: action.authority, status: action.status, source_refs: action.source_refs });
      if (action.receiver_ref) relations.push({ id: `REL_${action.id}_PASSES_TO`, type: "passes_to", from_ref: action.actor_ref, to_ref: action.receiver_ref, authority: action.authority, status: action.status, source_refs: action.source_refs });
      if (action.opponent_ref) relations.push({ id: `REL_${action.id}_OPPOSES`, type: "opposes", from_ref: action.actor_ref, to_ref: action.opponent_ref, authority: action.authority, status: action.status, source_refs: action.source_refs });
      (action.after || []).forEach((ref, index) => relations.push({ id: `REL_${action.id}_FOLLOWS_${index + 1}`, type: "follows", from_ref: ref, to_ref: action.id, authority: action.authority, status: action.status, source_refs: action.source_refs }));
    });
    relations.push(...spatialContinuityRelations);
    const firstBallAction = actions.find((action) => ["pass", "dribble", "shot"].includes(action.type) && action.actor_ref);
    const balls = firstBallAction ? [{ id: "B1", holder_ref: firstBallAction.actor_ref, authority: "derived_from_validated_rule", status: "validated", source_refs: firstBallAction.source_refs }] : [];
    return {
      meta: { format: "TRACA_tactical_ir", version: "0.1.0", case_id: caseId, source_revision: sourceRevision, knowledge_version: options && options.knowledge_version || null },
      participants: [...participants.values()].sort((left, right) => left.id.localeCompare(right.id)),
      participant_states: [], balls, materials: [], spaces, actions,
      decisions: [], phases: [], ball_flow: [], relations
    };
  }

  function canonicalCaseProvider(currentCase, canonicalCases) {
    const match = (canonicalCases || []).find((item) => item.id === currentCase.id && currentCase.case_type === "canonical_specimen");
    if (!match) return null;
    return {
      provider: "canonical_case_provider",
      status: "validated",
      concepts: utils.deepClone(match.canonical_concepts || []),
      suggested_tags: suggestedTags(currentCase.description, match.canonical_concepts || []),
      unknown_concepts: [],
      unresolved: [],
      tactical_ir: match.tactical_ir ? utils.deepClone(match.tactical_ir) : null,
      notes: ["Interpretació recuperada d’un cas canònic validat."]
    };
  }

  function localRuleProvider(currentCase, knowledge) {
    const matched = matchLocalKnowledge(currentCase.description, knowledge);
    const unresolved = [];
    if (!matched.concepts.length) unresolved.push({ id: "UNRESOLVED-001", label: "No s’ha reconegut cap concepte canònic.", knowledge_state: "unresolved" });
    matched.unknownConcepts.forEach((concept) => unresolved.push({ id: `UNRESOLVED-${concept.id}`, label: `Cal definir «${concept.label}» abans d’utilitzar-ho com a coneixement.`, knowledge_state: "unresolved", concept_ref: concept.id }));
    return {
      provider: "local_rule_provider",
      status: "provisional",
      concepts: matched.concepts,
      suggested_tags: suggestedTags(currentCase.description, matched.concepts),
      unknown_concepts: matched.unknownConcepts,
      unresolved,
      tactical_ir: buildTacticalIR(currentCase.description, matched.concepts, { case_id: currentCase.id, knowledge_version: knowledge.version || null }),
      notes: ["Coincidències lèxiques locals; no són una interpretació tàctica validada."]
    };
  }

  function interpret(currentCase, options) {
    const canonical = canonicalCaseProvider(currentCase, options.canonicalCases);
    if (canonical) return canonical;
    const partial = localRuleProvider(currentCase, options.knowledge || { concepts: [] });
    return {
      ...partial,
      providers: ["local_rule_provider", "manual_builder_provider"],
      status: partial.concepts.length || partial.unknown_concepts.length ? "provisional" : "unresolved"
    };
  }

  return {
    ROLE_DEFINITIONS, DEFENDER_DEFINITIONS, CANONICAL_INTERVAL_DEFINITIONS,
    ACTION_SPATIAL_CONTRACT, normalize, matchLocalKnowledge, suggestedTags,
    initialSpace, terminalSpace, resolveSpatialContinuity, buildTacticalIR,
    canonicalCaseProvider, localRuleProvider, interpret
  };
});
