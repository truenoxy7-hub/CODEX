(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_MANUAL_GEOMETRY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const ENTITY_KINDS = ["attacker", "defender", "passer", "pivot", "goalkeeper", "ball", "cone", "bench", "cylinder", "generic_participant", "generic_material", "text"];
  const PATH_KINDS = ["movement", "movement_without_ball", "dribble", "pass", "pass_feint", "shot", "shot_feint", "feint", "block", "defensive_block", "future_position", "generic_action"];

  function courtFromProfile(profile) {
    return {
      width_m: profile.court.width_m,
      half_length_m: profile.court.half_length_m,
      goal: utils.deepClone(profile.goal),
      markings: utils.deepClone(profile.markings),
      view_box: [-0.8, -1.0, 21.6, 21.8]
    };
  }

  function createCoachReferenceGeometry(caseId, profile) {
    return {
      meta: {
        format: "TRACA_coach_reference_geometry",
        version: "0.1.0",
        exercise_id: caseId,
        status: "coach_reference",
        authority: "coach",
        canonical_promotion: false
      },
      court: courtFromProfile(profile),
      layout_policy: {
        id: "manual_reference_layout_v0.1",
        status: "coach_reference",
        coordinate_system: "metres_origin_goal_line_left",
        attack_direction: "negative_y",
        notes: ["Les coordenades són una referència manual del cas i no una regla tàctica."]
      },
      zones: [], spaces: [], entities: [], participant_states: [], common_paths: [], branches: [], dependencies: [], traceability: []
    };
  }

  function nextId(geometry, prefix, collections) {
    const all = collections.flatMap((key) => geometry[key] || []);
    let index = all.length + 1;
    while (all.some((item) => item.id === `${prefix}_${index}`)) index += 1;
    return `${prefix}_${index}`;
  }

  function addPrimitive(geometry, input) {
    const next = utils.deepClone(geometry);
    const type = input.primitive_type;
    if (type === "entity") {
      if (!ENTITY_KINDS.includes(input.kind)) throw new Error("MANUAL_ENTITY_KIND_INVALID");
      const id = input.id || nextId(next, "REF", ["entities"]);
      next.entities.push({
        id, kind: input.kind, label: input.label || "", position: utils.deepClone(input.position || [10, 12]),
        source_ref: `coach_reference:${id}`, status: "coach_reference"
      });
      return next;
    }
    if (type === "path") {
      if (!PATH_KINDS.includes(input.kind)) throw new Error("MANUAL_PATH_KIND_INVALID");
      const id = input.id || nextId(next, "PATH", ["common_paths"]);
      next.common_paths.push({ id, kind: input.kind, label: input.label || "", points: utils.deepClone(input.points || [[10, 15], [10, 10]]), source_refs: [`coach_reference:${id}`], status: "coach_reference" });
      return next;
    }
    if (type === "zone") {
      const id = input.id || nextId(next, "ZONE", ["zones"]);
      next.zones.push({ id, label: input.label || id, polygon: utils.deepClone(input.polygon || [[6, 6], [14, 6], [14, 16], [6, 16]]), source_ref: `coach_reference:${id}`, limit_refs: [], defensive_line: [[6, 8], [14, 8]] });
      return next;
    }
    throw new Error("MANUAL_PRIMITIVE_TYPE_INVALID");
  }

  function removePrimitive(geometry, id) {
    const next = utils.deepClone(geometry);
    const before = (next.entities || []).length + (next.common_paths || []).length + (next.zones || []).length;
    next.entities = (next.entities || []).filter((item) => item.id !== id);
    next.participant_states = (next.participant_states || []).filter((item) => item.id !== id && item.participant_ref !== id);
    next.common_paths = (next.common_paths || []).filter((item) => item.id !== id && item.actor_ref !== id && item.from_participant_ref !== id && item.to_participant_ref !== id);
    next.zones = (next.zones || []).filter((item) => item.id !== id);
    next.dependencies = (next.dependencies || []).filter((item) => !item.trigger_ref.endsWith(`:${id}`) && !(item.effect_refs || []).some((ref) => ref.endsWith(`:${id}`)));
    next.traceability = (next.traceability || []).filter((item) => !item.geometry_ref.endsWith(`:${id}`));
    const after = next.entities.length + next.common_paths.length + next.zones.length;
    if (before === after) throw new Error("MANUAL_PRIMITIVE_NOT_FOUND");
    return next;
  }

  return { ENTITY_KINDS, PATH_KINDS, createCoachReferenceGeometry, addPrimitive, removePrimitive };
});
