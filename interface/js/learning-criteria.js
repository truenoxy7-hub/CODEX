(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES, node ? require("./generic-geometry-resolver.js") : root.TRACA_GENERIC_GEOMETRY_RESOLVER);
  if (node) module.exports = api;
  root.TRACA_LEARNING_CRITERIA = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (dependencies, validator) {
  "use strict";
  const copy = (v) => v === undefined ? null : JSON.parse(JSON.stringify(v));
  function derive(snapshot, event, input) {
    const details = input || {}, geometry = snapshot.workingGeometry;
    const id = event.target.ref.split(":").slice(2).join(":"), entity = (geometry.entities || []).find((e) => e.id === id);
    const stateId = entity && entity.state_ref || id;
    const paths = dependencies.allPaths(geometry).filter((p) => p.to_state_ref === stateId && p.from_state_ref);
    const path = paths.find((p) => ["pass", "initial_pass", "return_pass"].includes(p.kind)) || paths[0];
    const criterion = {
      id: details.id, version: 1, label: details.label || "Correcció reutilitzable", definition: details.definition || "",
      state: "registered", approval: null, scope: "matching_action_bindings", source_case_uid: snapshot.currentCase.case_uid,
      source_case_code: snapshot.currentCase.short_code || snapshot.currentCase.id,
      source_revision: snapshot.revision, source_refs: event.source_refs || [], correction_refs: [event.id],
      evidence: { before: copy(event.before), after: copy(event.after), target: copy(event.target), author: event.author },
      bindings: null, condition: null, effect: null, implementation: "pending", applications: []
    };
    const feint = dependencies.allPaths(geometry).find(p => p.kind === "feint" && (p.id === id || p.from_state_ref === stateId || p.to_state_ref === stateId || (event.action_refs || []).includes(p.action_ref)));
    if (details.type === "feint_sequence" && feint) {
      criterion.condition = { action_kind: "feint" }; criterion.bindings = { action: "matching_path" };
      criterion.effect = { type: "validate_feint_sequence", checks: ["feint_sequence", "functional_feint", "feint_exit_corridor"] }; criterion.implementation = "supported";
    } else if (details.type !== "feint_sequence" && path && event.target.property === "position" && Array.isArray(event.after) && event.after.length === 2) {
      const origin = (geometry.participant_states || []).find((s) => s.id === path.from_state_ref);
      const before = event.before, side = origin && Math.sign(before[0] - origin.position[0]);
      if (origin && side) {
        criterion.condition = { action_kind: path.kind, distinct_states: true };
        criterion.bindings = { target: "to_state_ref", anchor: "from_state_ref", lateral_axis: "anchor_to_original_target" };
        criterion.effect = { type: "relative_position", lateral_m: (event.after[0] - origin.position[0]) * side, depth_m: event.after[1] - origin.position[1] };
        criterion.implementation = "supported";
      }
    }
    return criterion;
  }
  function approve(criterion, author, revision) {
    const next = copy(criterion); next.approval = { author, source_revision: revision, date: new Date().toISOString() };
    next.state = next.implementation === "supported" ? "executable" : "coach_approved"; return next;
  }
  function apply(geometry, criteria, context) {
    const output = copy(geometry), proposals = new Map(), applications = [], rejected = [], conflicts = [], validation = [];
    const states = new Map((output.participant_states || []).map((s) => [s.id, s]));
    (criteria || []).forEach((criterion) => {
      if (!criterion.approval || criterion.revoked || !["executable", "applied"].includes(criterion.state)) { rejected.push({ id: criterion.id, reason: criterion.revoked ? "REVOKED" : "NOT_EXECUTABLE" }); return; }
      if (criterion.version !== 1 || !criterion.condition || !criterion.effect || !["relative_position", "validate_feint_sequence"].includes(criterion.effect.type) || criterion.effect.type === "relative_position" && ![criterion.effect.lateral_m, criterion.effect.depth_m].every(Number.isFinite)) { rejected.push({ id: criterion.id, reason: "INVALID_TYPED_EFFECT" }); return; }
      const paths = dependencies.allPaths(output).filter((p) => p.kind === criterion.condition.action_kind);
      if (!paths.length) { rejected.push({ id: criterion.id, reason: "INCOMPATIBLE_ACTION" }); return; }
      paths.forEach((path) => {
        if (criterion.effect.type === "validate_feint_sequence") {
          const report = validator.validateResolvedGeometry(output);
          const checks = report.checks.filter((c) => c.subject_ref === path.id && criterion.effect.checks.includes(c.kind));
          validation.push({ criterion_ref: criterion.id, path_ref: path.id, checks });
          applications.push({ criterion_ref: criterion.id, version: criterion.version, path_ref: path.id, effect: "validation", result: checks.some(c => c.status === "failed") ? "failed" : !checks.length || checks.some(c => c.status === "unknown") ? "unknown" : "passed" }); return;
        }
        const target = states.get(path.to_state_ref), anchor = states.get(path.from_state_ref);
        const side = target && anchor && Math.sign(target.position[0] - anchor.position[0]);
        if (!side || target === anchor) { rejected.push({ id: criterion.id, path_ref: path.id, reason: "BINDING_UNRESOLVED" }); return; }
        const after = [anchor.position[0] + side * criterion.effect.lateral_m, anchor.position[1] + criterion.effect.depth_m];
        const next = { criterion_ref: criterion.id, version: criterion.version, target_ref: target.id, anchor_ref: anchor.id, path_ref: path.id, before: target.position.slice(), after, source_refs: criterion.source_refs };
        const existing = proposals.get(target.id) || [];
        existing.push(next); proposals.set(target.id, existing);
      });
    });
    proposals.forEach((items, target) => {
      if (new Set(items.map((item) => JSON.stringify(item.after))).size > 1) conflicts.push({ target_ref: target, criteria: items.map((item) => item.criterion_ref), proposals: items });
      else { states.get(target).position = items[0].after; applications.push(...items); }
    });
    dependencies.reconcileGeometry(output);
    const baseline = new Set(validator.validateResolvedGeometry(geometry).checks.filter(c => c.status === "failed").map(c => c.id));
    const checked = validator.validateResolvedGeometry(output);
    if (checked.checks.some(c => c.status === "failed" && !baseline.has(c.id))) {
      return { geometry: copy(geometry), applications: [], rejected: [...rejected, ...applications.map(a => ({ id: a.criterion_ref, reason: "GEOMETRY_CONSTRAINT_VIOLATION" }))], conflicts, validation: [...validation, checked] };
    }
    output.validation = checked;
    output.learning_applied = [...(output.learning_applied || []), ...applications.map((a) => ({ ...a, case_uid: context && context.case_uid, applied_at_revision: context && context.revision }))];
    return { geometry: output, applications, rejected, conflicts, validation };
  }
  return { derive, approve, apply };
});
