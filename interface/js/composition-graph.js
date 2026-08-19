(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_COMPOSITION_GRAPH = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const NODE_COLLECTIONS = [
    ["participants", "Participant"],
    ["participant_states", "ParticipantState"],
    ["balls", "BallState"],
    ["actions", "ActionInstance"],
    ["materials", "Material"],
    ["spaces", "Space"],
    ["decisions", "Decision"],
    ["phases", "Phase"]
  ];

  const DIRECT_EDGES = [
    ["actor_ref", "actor"], ["target_ref", "target"], ["receiver_ref", "target"],
    ["opponent_ref", "opponent"], ["partner_ref", "partner"],
    ["first_actor_ref", "first_actor"], ["crossing_actor_ref", "crossing_actor"],
    ["crosses_relative_to", "crosses_relative_to"],
    ["from_state_ref", "from_state"], ["to_state_ref", "to_state"],
    ["state_ref", "state"], ["space_ref", "space"],
    ["initial_space_ref", "space"], ["initial_attack_relation", "space"], ["target_space_ref", "space"],
    ["phase_ref", "belongs_to_phase"], ["ball_ref", "ball_before"]
  ];

  const ARRAY_EDGES = [
    ["attacker_refs", "partner"], ["defender_refs", "opponent"],
    ["participant_refs", "partner"], ["actor_refs", "partner"],
    ["after", "follows"], ["before", "precedes"],
    ["simultaneous_with", "simultaneous"]
  ];

  function provenance(source, fallback) {
    return {
      source_refs: utils.deepClone(source && source.source_refs || fallback && fallback.source_refs || []),
      authority: source && source.authority || fallback && fallback.authority || "unknown",
      status: source && source.status || fallback && fallback.status || "unknown"
    };
  }

  function normalizeInput(input) {
    const source = utils.deepClone(input || {});
    NODE_COLLECTIONS.forEach(([collection]) => {
      if (!Array.isArray(source[collection])) source[collection] = [];
    });
    if (!Array.isArray(source.relations)) source.relations = [];
    if (!Array.isArray(source.ball_flow)) source.ball_flow = [];
    source.meta = {
      format: "TRACA_tactical_ir",
      version: "0.1.0",
      source_revision: source.meta && source.meta.source_revision || null,
      knowledge_version: source.meta && source.meta.knowledge_version || null,
      ...(source.meta || {})
    };
    return source;
  }

  function edge(id, type, fromRef, toRef, source, fallback) {
    return { id, type, from_ref: fromRef, to_ref: toRef, ...provenance(source, fallback) };
  }

  function create(input) {
    const tacticalIR = normalizeInput(input);
    const nodes = [];
    NODE_COLLECTIONS.forEach(([collection, nodeType]) => {
      tacticalIR[collection].forEach((item) => nodes.push({
        id: item.id,
        node_type: nodeType,
        payload_ref: `${collection}:${item.id}`,
        ...provenance(item, tacticalIR.meta)
      }));
    });

    const edges = [];
    tacticalIR.actions.forEach((action) => {
      DIRECT_EDGES.forEach(([field, type]) => {
        if (action[field]) edges.push(edge(`EDGE_${action.id}_${field}`, type, action.id, action[field], action, tacticalIR.meta));
      });
      ARRAY_EDGES.forEach(([field, type]) => {
        const values = Array.isArray(action[field]) ? action[field] : action[field] ? [action[field]] : [];
        values.forEach((value, index) => {
          const temporal = type === "follows" ? [value, action.id] : type === "precedes" ? [action.id, value] : [action.id, value];
          edges.push(edge(`EDGE_${action.id}_${field}_${String(index + 1).padStart(2, "0")}`, type, temporal[0], temporal[1], action, tacticalIR.meta));
        });
      });
    });
    tacticalIR.relations.forEach((relation, index) => edges.push(edge(
      relation.id || `EDGE_REL_${String(index + 1).padStart(3, "0")}`,
      relation.type,
      relation.from_ref || relation.subject_ref,
      relation.to_ref || relation.object_ref,
      relation,
      tacticalIR.meta
    )));
    return {
      meta: { format: "TRACA_composition_graph", version: "0.1.0", source_revision: tacticalIR.meta.source_revision },
      nodes: nodes.sort((left, right) => left.id.localeCompare(right.id)),
      edges: edges.sort((left, right) => left.id.localeCompare(right.id)),
      tactical_ir: tacticalIR
    };
  }

  function orderedActions(graph) {
    const actions = graph.tactical_ir.actions.slice().sort((left, right) => left.id.localeCompare(right.id));
    const ids = new Set(actions.map((action) => action.id));
    const incoming = new Map(actions.map((action) => [action.id, new Set()]));
    graph.edges.filter((item) => item.type === "precedes" || item.type === "follows").forEach((item) => {
      if (ids.has(item.from_ref) && ids.has(item.to_ref) && item.from_ref !== item.to_ref) incoming.get(item.to_ref).add(item.from_ref);
    });
    const remaining = new Map(actions.map((action) => [action.id, action]));
    const ordered = [];
    while (remaining.size) {
      const ready = [...remaining.keys()].filter((id) => [...incoming.get(id)].every((dependency) => !remaining.has(dependency))).sort();
      if (!ready.length) return { actions: ordered, cyclic_action_refs: [...remaining.keys()].sort() };
      ready.forEach((id) => { ordered.push(remaining.get(id)); remaining.delete(id); });
    }
    return { actions: ordered, cyclic_action_refs: [] };
  }

  function downstreamCounts(graph) {
    const next = new Map(graph.tactical_ir.actions.map((action) => [action.id, new Set()]));
    graph.edges.filter((item) => item.type === "precedes" || item.type === "follows").forEach((item) => {
      if (next.has(item.from_ref) && next.has(item.to_ref)) next.get(item.from_ref).add(item.to_ref);
    });
    function reachable(start) {
      const seen = new Set();
      const queue = [...(next.get(start) || [])];
      while (queue.length) {
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push(...(next.get(id) || []));
      }
      return seen.size;
    }
    return Object.fromEntries([...next.keys()].sort().map((id) => [id, reachable(id)]));
  }

  return { NODE_COLLECTIONS, normalizeInput, provenance, create, orderedActions, downstreamCounts };
});
