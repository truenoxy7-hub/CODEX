(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./utils.js") : root.TRACA_UTILS, node ? require("./corrections.js") : root.TRACA_CORRECTIONS, node ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES, node ? require("./court-geometry.js") : root.TRACA_COURT_GEOMETRY);
  if (node) module.exports = api;
  root.TRACA_WHITEBOARD = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, corrections, dependencies, courtApi) {
  "use strict";
  const clone = utils.deepClone;
  const collections = ["entities", "participant_states", "common_paths", "branches", "balls", "zones", "spaces", "relations", "actions", "contextual_references", "dependencies", "traceability"];
  const pointKeys = new Set(["position", "start", "end", "control", "control1", "control2", "anchor", "center"]);
  function target(geometry, ref) { return corrections.targetObject(geometry, null, { ref }); }
  function transformPoints(value, transform, key) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && pointKeys.has(key)) return transform(value);
    if (Array.isArray(value) && ["points", "polygon", "calculation_region", "return_ball_points"].includes(key)) return value.map(transform);
    Object.keys(value).forEach((name) => {
      const result = transformPoints(value[name], transform, name);
      if (result) value[name] = result;
    });
  }
  function translate(object, delta) { const result = clone(object); transformPoints(result, (p) => p.map((v, i) => v + delta[i])); return result; }
  function snap(position, court, mode) {
    if (!["6", "9"].includes(String(mode))) return position.slice();
    const radius = String(mode) === "6" ? court.markings.goal_area_radius_m : court.markings.free_throw_distance_m;
    const posts = courtApi.goalPosts(court), x = position[0], y = Math.max(0, position[1]);
    if (x >= posts.left && x <= posts.right) return [x, radius];
    const cx = x < posts.left ? posts.left : posts.right;
    const angle = Math.atan2(y, x - cx);
    let px = cx + radius * Math.cos(angle), py = radius * Math.sin(angle);
    // The 9 m arcs are clipped by the touchlines, not displaced from their radius.
    if (px < 0 || px > court.width_m) {
      px = Math.max(0, Math.min(court.width_m, px));
      py = Math.sqrt(Math.max(0, radius * radius - (px - cx) ** 2));
    }
    return [px, py];
  }
  function move(geometry, ref, delta, settings) {
    const result = clone(geometry), item = target(result, ref);
    if (!item) throw Error("ELEMENT_NOT_FOUND");
    if (item.position) {
      const state = item.state_ref && (result.participant_states || []).find((s) => s.id === item.state_ref);
      const movable = state || item;
      movable.position = snap(movable.position.map((v, i) => v + delta[i]), result.court, settings && settings.snap);
    } else {
      if (item.from_state_ref || item.to_state_ref) throw Error("LINKED_PATH_REQUIRES_DETACH");
      Object.assign(item, translate(item, delta));
    }
    return dependencies.reconcileGeometry(result);
  }
  function handle(geometry, ref, property, position) {
    const result = clone(geometry), item = target(result, ref);
    if (!item) throw Error("ELEMENT_NOT_FOUND");
    let stateRef;
    if (property === "segments.0.start") stateRef = item.from_state_ref;
    if (property === `segments.${(item.segments || []).length - 1}.end`) stateRef = item.to_state_ref;
    const state = stateRef && (result.participant_states || []).find((s) => s.id === stateRef);
    if (state) state.position = position.slice();
    else utils.writePath(item, property, position.slice());
    return dependencies.reconcileGeometry(result);
  }
  function detach(geometry, ref) {
    const result = clone(geometry), item = target(result, ref);
    if (!item) throw Error("ELEMENT_NOT_FOUND");
    item.detached_from = { from_state_ref: item.from_state_ref || null, to_state_ref: item.to_state_ref || null };
    delete item.from_state_ref; delete item.to_state_ref;
    result.dependencies = (result.dependencies || []).map((d) => ({ ...d, effect_refs: (d.effect_refs || []).filter((r) => r !== ref) }));
    return result;
  }
  function collectIds(value, ids) {
    if (!value || typeof value !== "object") return;
    if (value.id) ids.add(value.id);
    Object.values(value).forEach((v) => { if (typeof v === "object") collectIds(v, ids); });
  }
  function refIds(value, known, found) {
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, v]) => {
      if (/source|evidence|action_ref|detached_from/.test(key)) return;
      if (typeof v === "string" && key !== "id") {
        const id = v.startsWith("geometry:") ? v.split(":").slice(2).join(":") : v;
        if (known.has(id)) found.add(id);
      } else if (typeof v === "object") refIds(v, known, found);
    });
  }
  function cloneSelection(geometry, refs, mirror, idFactory) {
    const result = clone(geometry), items = collections.flatMap((key) => (geometry[key] || []).map((item) => ({ key, item })));
    const allIds = new Set(); items.forEach(({ item }) => collectIds(item, allIds));
    const included = new Set(refs ? refs.map((ref) => corrections.parseRef(ref).id) : allIds);
    let changed = true;
    while (changed) {
      const size = included.size;
      items.forEach(({ item }) => {
        const own = new Set(); collectIds(item, own);
        if ([...own].some((id) => included.has(id))) { own.forEach((id) => included.add(id)); refIds(item, allIds, included); }
      });
      changed = size !== included.size;
    }
    const selected = items.filter(({ item }) => { const ids = new Set(); collectIds(item, ids); if (!ids.size) refIds(item, allIds, ids); return [...ids].some((id) => included.has(id)); });
    const makeId = idFactory || (() => utils.durableId("COPY"));
    const actionIds = new Set();
    function collectActions(value) {
      if (!value || typeof value !== "object") return;
      if (value.action_ref) actionIds.add(value.action_ref);
      Object.values(value).filter(v => typeof v === "object").forEach(collectActions);
    }
    selected.forEach(({ item }) => collectActions(item));
    actionIds.forEach(id => included.add(id));
    const mapping = Object.fromEntries([...included].map((id) => [id, makeId(id)]));
    function rewrite(value, key) {
      if (/source|evidence|detached_from/.test(key || "")) return value;
      if (typeof value === "string") {
        if (mapping[value]) return mapping[value];
        if (value.startsWith("geometry:")) { const p = value.split(":"); if (mapping[p.slice(2).join(":")]) return `${p[0]}:${p[1]}:${mapping[p.slice(2).join(":")]}`; }
      }
      if (Array.isArray(value)) return value.map((v) => rewrite(v, key));
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v, k)]));
      return value;
    }
    selected.forEach(({ key, item }) => {
      const copy = rewrite(clone(item));
      if (item.action_ref) copy.source_action_ref = item.action_ref;
      transformPoints(copy, (p) => mirror ? [geometry.court.width_m - p[0], p[1]] : [p[0] + 0.8, p[1] + 0.8]);
      if (mirror && copy.angle !== undefined) copy.angle = 180 - copy.angle;
      if (mirror && copy.holder_state_ref) copy.holder_offset = [-(copy.holder_offset?.[0] ?? 0.38), copy.holder_offset?.[1] ?? -0.3];
      copy.cloned_from = item.id || null;
      if (!result[key]) result[key] = [];
      result[key].push(copy);
    });
    // Copies are editable coach references, not new approved semantic actions.
    actionIds.forEach(id => {
      if (!result.actions) result.actions = [];
      if (!result.actions.some(a => a.id === mapping[id])) result.actions.push({ id: mapping[id], source_action_ref: id, authority: "coach_reference", status: "unlinked_copy" });
    });
    return { geometry: dependencies.reconcileGeometry(result), count: selected.length, mapping };
  }
  function remove(geometry, ref) {
    const result = clone(geometry), id = corrections.parseRef(ref).id;
    const removed = new Set([id]);
    (result.participant_states || []).filter((s) => s.participant_ref === id).forEach((s) => removed.add(s.id));
    dependencies.allPaths(result).forEach((p) => {
      if (removed.has(p.actor_ref) || removed.has(p.from_participant_ref) || removed.has(p.to_participant_ref)) removed.add(p.id);
      else { if (removed.has(p.from_state_ref)) delete p.from_state_ref; if (removed.has(p.to_state_ref)) delete p.to_state_ref; }
    });
    dependencies.allPaths(result).forEach(p => {
      ["opponent_ref", "receiver_ref", "ball_ref"].forEach(key => {
        if (removed.has(p[key])) { p.unresolved_refs = [...(p.unresolved_refs || []), { property: key, removed_ref: p[key] }]; delete p[key]; }
      });
    });
    collections.forEach((key) => { if (Array.isArray(result[key])) result[key] = result[key].filter((item) => !removed.has(item.id) && !removed.has(item.holder_ref)); });
    (result.branches || []).forEach((branch) => {
      branch.alternatives = (branch.alternatives || []).filter((a) => !removed.has(a.id));
      branch.alternatives.forEach(a => { ["approach_path", "return_pass"].forEach(key => { if (a[key] && removed.has(a[key].id)) delete a[key]; }); });
    });
    (result.entities || []).filter(e => removed.has(e.state_ref)).forEach(e => { delete e.state_ref; });
    (result.balls || []).forEach(b => { if (removed.has(b.holder_state_ref)) { delete b.holder_state_ref; b.unresolved_refs = [{ property: "holder_state_ref", removed_ref: id }]; } });
    (result.relations || []).forEach(r => {
      (r.participants || []).forEach(p => {
        ["participant_ref", "state_ref"].forEach(key => { if (removed.has(p[key])) { r.unresolved_refs = [...(r.unresolved_refs || []), { property: key, removed_ref: p[key] }]; delete p[key]; } });
      });
      ["primary_attacker_ref", "supporting_attacker_ref", "defender_ref"].forEach(key => { if (removed.has(r[key])) { r.unresolved_refs = [...(r.unresolved_refs || []), { property: key, removed_ref: r[key] }]; delete r[key]; } });
    });
    const refId = r => r.startsWith("geometry:") ? r.split(":").slice(2).join(":") : r;
    result.dependencies = (result.dependencies || []).filter((d) => !removed.has(refId(d.trigger_ref || ""))).map((d) => ({ ...d, effect_refs: (d.effect_refs || []).filter((r) => !removed.has(refId(r))) }));
    result.traceability = (result.traceability || []).filter(t => !removed.has((t.geometry_ref || "").split(":").slice(2).join(":")));
    return result;
  }
  return { target, translate, snap, move, handle, detach, cloneSelection, remove, transformPoints };
});
