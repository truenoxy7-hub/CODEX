(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_GEOMETRY_DEPENDENCIES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function stateMap(geometry) {
    return new Map(((geometry && geometry.participant_states) || []).map((state) => [state.id, state]));
  }

  function allPaths(geometry) {
    const paths = [...((geometry && geometry.common_paths) || [])];
    ((geometry && geometry.branches) || []).forEach((branch) => {
      (branch.alternatives || []).forEach((alternative) => {
        paths.push(alternative);
        if (alternative.return_pass) paths.push(alternative.return_pass);
      });
    });
    return paths;
  }

  function cubicPoint(segment, t) {
    const mt = 1 - t;
    return [
      mt ** 3 * segment.start[0] + 3 * mt ** 2 * t * segment.control1[0] + 3 * mt * t ** 2 * segment.control2[0] + t ** 3 * segment.end[0],
      mt ** 3 * segment.start[1] + 3 * mt ** 2 * t * segment.control1[1] + 3 * mt * t ** 2 * segment.control2[1] + t ** 3 * segment.end[1]
    ].map((value) => Number(value.toFixed(3)));
  }

  function sampledPoints(path, samplesPerCurve) {
    if (Array.isArray(path && path.points)) return path.points.map((point) => point.slice());
    const samples = Math.max(3, samplesPerCurve || 8);
    const points = [];
    (path && path.segments || []).forEach((segment, segmentIndex) => {
      if (!segmentIndex) points.push(segment.start.slice());
      if (segment.type === "cubic") {
        for (let index = 1; index <= samples; index += 1) points.push(cubicPoint(segment, index / samples));
      } else {
        points.push(segment.end.slice());
      }
    });
    return points;
  }

  function reconcilePath(path, states) {
    if (!path || !Array.isArray(path.segments) || !path.segments.length) return;
    const from = states.get(path.from_state_ref);
    const to = states.get(path.to_state_ref);
    if (from) path.segments[0].start = from.position.slice();
    if (to) path.segments[path.segments.length - 1].end = to.position.slice();
    for (let index = 1; index < path.segments.length; index += 1) {
      path.segments[index].start = path.segments[index - 1].end.slice();
    }
    if (path.kind === "feint") {
      const directionBreak = (path.functional_points || []).find((point) => point.role === "direction_break");
      const exit = (path.functional_points || []).find((point) => point.role === "exit");
      if (directionBreak && path.segments[0]) directionBreak.position = path.segments[0].end.slice();
      if (exit && path.segments[1]) exit.position = path.segments[1].end.slice();
    }
  }

  function reconcileGeometry(geometry) {
    if (!geometry) return geometry;
    const states = stateMap(geometry);
    (geometry.entities || []).forEach((entity) => {
      const state = entity.state_ref && states.get(entity.state_ref);
      if (state) entity.position = state.position.slice();
    });
    allPaths(geometry).forEach((path) => reconcilePath(path, states));
    return geometry;
  }

  function derivedEffectsFor(geometry, stateRef) {
    if (!geometry || !stateRef) return [];
    const normalized = stateRef.startsWith("geometry:participant_state:") ? stateRef : `geometry:participant_state:${stateRef}`;
    const dependency = (geometry.dependencies || []).find((item) => item.trigger_ref === normalized);
    return ((dependency && dependency.effect_refs) || []).map((targetRef) => ({
      target_ref: targetRef,
      property: targetRef.includes(":entity:") ? "position" : "segments",
      explanation: targetRef.includes(":entity:")
        ? "La posició visible del participant s’ha sincronitzat amb el seu estat."
        : "La geometria connectada s’ha recalculat des de l’estat mogut.",
      reason: "state_drives_geometry"
    }));
  }

  function selectedAlternativeIds(geometry, selectedMap) {
    const ids = new Set();
    (geometry && geometry.branches || []).forEach((branch) => {
      const selected = selectedMap && selectedMap[branch.id] || (branch.alternatives && branch.alternatives[0] && branch.alternatives[0].id);
      if (selected) ids.add(selected);
    });
    return ids;
  }

  function visibleFutureStates(geometry, selectedMap) {
    const selected = selectedAlternativeIds(geometry, selectedMap);
    return ((geometry && geometry.participant_states) || []).filter((state) => {
      if (state.status !== "future") return false;
      if (state.visibility === "control") return true;
      if (state.visibility !== "selected_alternative") return false;
      return (state.alternative_refs || []).some((ref) => selected.has(ref));
    });
  }

  return { stateMap, allPaths, sampledPoints, reconcileGeometry, derivedEffectsFor, visibleFutureStates };
});
