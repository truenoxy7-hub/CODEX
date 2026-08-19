(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_SPATIAL_CONSTRAINTS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function delimiterRefs(space) {
    return space && (space.delimiter_refs || space.relation && space.relation.delimiter_refs) || [];
  }

  function explicitContiguity(tacticalIR, leftRef, rightRef) {
    return (tacticalIR.relations || []).some((relation) => relation.type === "contiguous"
      && ((relation.from_ref === leftRef && relation.to_ref === rightRef) || (relation.from_ref === rightRef && relation.to_ref === leftRef))
      && relation.status !== "candidate" && relation.status !== "provisional");
  }

  function contiguity(tacticalIR, leftRef, rightRef) {
    if (!leftRef || !rightRef || leftRef === rightRef) return { status: "conflict", shared_refs: [] };
    if (explicitContiguity(tacticalIR, leftRef, rightRef)) return { status: "resolved", shared_refs: [] };
    const spaces = new Map((tacticalIR.spaces || []).map((space) => [space.id, space]));
    const left = spaces.get(leftRef), right = spaces.get(rightRef);
    if (!left || !right) return { status: "unresolved", shared_refs: [] };
    const shared = delimiterRefs(left).filter((ref) => delimiterRefs(right).includes(ref));
    if (shared.length === 1) return { status: "resolved", shared_refs: shared };
    if (delimiterRefs(left).length && delimiterRefs(right).length) return { status: "conflict", shared_refs: shared };
    return { status: "unresolved", shared_refs: shared };
  }

  function create(tacticalIR) {
    const constraints = [];
    const conflicts = [];

    function add(input) {
      const item = {
        id: input.id || `CONSTRAINT_${String(constraints.length + 1).padStart(4, "0")}`,
        type: input.type,
        strength: input.strength || "hard",
        subject_refs: utils.deepClone(input.subject_refs || []),
        object_refs: utils.deepClone(input.object_refs || []),
        action_ref: input.action_ref || null,
        status: input.status || "resolved",
        source_refs: utils.deepClone(input.source_refs || []),
        authority: input.authority || "derived_from_validated_rule",
        derived_from: utils.deepClone(input.derived_from || [])
      };
      constraints.push(item);
      if (item.status === "conflict") conflicts.push({
        code: input.conflict_code || "CONSTRAINT_CONFLICT",
        constraint_ref: item.id,
        action_ref: item.action_ref,
        reason: input.reason || "Dues relacions obligatòries són incompatibles.",
        source_refs: item.source_refs
      });
      return item;
    }

    function addContiguity(action, initialSpaceRef, targetSpaceRef) {
      const result = contiguity(tacticalIR, initialSpaceRef, targetSpaceRef);
      return add({
        id: `CONSTRAINT_${action.id}_CONTIGUOUS`, type: "CONTIGUOUS", strength: "hard",
        subject_refs: [initialSpaceRef], object_refs: [targetSpaceRef], action_ref: action.id,
        status: result.status, source_refs: action.source_refs || [], authority: "derived_from_validated_rule",
        derived_from: result.shared_refs,
        conflict_code: "FINTA_SPACES_NOT_CONTIGUOUS",
        reason: "La finta exigeix dos espais contigus que comparteixin la referència defensiva adequada."
      });
    }

    return {
      add, addContiguity, constraints, conflicts,
      snapshot: () => ({ constraints: utils.deepClone(constraints), conflicts: utils.deepClone(conflicts) })
    };
  }

  return { delimiterRefs, contiguity, create };
});
