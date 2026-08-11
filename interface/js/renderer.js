(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const visual = isNode ? require("./visual-grammar.js") : root.TRACA_VISUAL_GRAMMAR;
  const dependencies = isNode ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES;
  const api = factory(visual, dependencies);
  if (isNode) module.exports = api;
  root.TRACA_RENDERER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (visualApi, dependenciesApi) {
  "use strict";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function pathData(pathOrPoints) {
    if (Array.isArray(pathOrPoints)) {
      if (pathOrPoints.length < 2) return "";
      return pathOrPoints.map((point, index) => `${index ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");
    }
    const segments = pathOrPoints && pathOrPoints.segments || [];
    if (!segments.length) return "";
    const commands = [`M ${segments[0].start[0]} ${segments[0].start[1]}`];
    segments.forEach((segment) => {
      if (segment.type === "cubic") commands.push(`C ${segment.control1[0]} ${segment.control1[1]} ${segment.control2[0]} ${segment.control2[1]} ${segment.end[0]} ${segment.end[1]}`);
      else commands.push(`L ${segment.end[0]} ${segment.end[1]}`);
    });
    return commands.join(" ");
  }

  function pointString(points) {
    return (points || []).map((point) => `${point[0]},${point[1]}`).join(" ");
  }

  function svgNode(documentObject, name, attributes) {
    const node = documentObject.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") node.setAttribute(key, String(value));
    });
    return node;
  }

  function append(documentObject, parent, name, attributes) {
    const node = svgNode(documentObject, name, attributes);
    parent.appendChild(node);
    return node;
  }

  function addMarker(documentObject, defs, id, color) {
    const marker = append(documentObject, defs, "marker", {
      id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto"
    });
    append(documentObject, marker, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color });
  }

  function addCourt(documentObject, svg, court) {
    const goalLeft = (court.width_m - court.goal.width_m) / 2;
    const goalRight = goalLeft + court.goal.width_m;
    const radius = court.markings.goal_area_radius_m;
    const freeRadius = court.markings.free_throw_distance_m;
    const defs = append(documentObject, svg, "defs");
    const wood = append(documentObject, defs, "linearGradient", { id: "court-floor", x1: 0, y1: 0, x2: 0, y2: 1 });
    append(documentObject, wood, "stop", { offset: "0%", "stop-color": "#d9a36f" });
    append(documentObject, wood, "stop", { offset: "100%", "stop-color": "#bf7f49" });
    const clip = append(documentObject, defs, "clipPath", { id: "court-clip" });
    append(documentObject, clip, "rect", { x: 0, y: 0, width: court.width_m, height: court.half_length_m });
    addMarker(documentObject, defs, "traca-arrow-dark", "#173f33");
    addMarker(documentObject, defs, "traca-arrow-pass", "#d55832");
    addMarker(documentObject, defs, "traca-arrow-shot", "#b3232b");

    append(documentObject, svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: "url(#court-floor)" });
    for (let x = 1; x < 20; x += 1.5) {
      append(documentObject, svg, "line", { x1: x, y1: 0, x2: x, y2: 20, stroke: "#fff", "stroke-opacity": 0.05, "stroke-width": 0.025 });
    }
    append(documentObject, svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: "none", stroke: "#fff", "stroke-width": 0.08 });
    const goalAreaPath = `M ${goalLeft - radius} 0 A ${radius} ${radius} 0 0 0 ${goalLeft} ${radius} L ${goalRight} ${radius} A ${radius} ${radius} 0 0 0 ${goalRight + radius} 0`;
    append(documentObject, svg, "path", { d: goalAreaPath, fill: "#78b8ad", "fill-opacity": 0.34, stroke: "#fff", "stroke-width": 0.08 });
    const freeThrowPath = `M ${goalLeft - freeRadius} 0 A ${freeRadius} ${freeRadius} 0 0 0 ${goalLeft} ${freeRadius} L ${goalRight} ${freeRadius} A ${freeRadius} ${freeRadius} 0 0 0 ${goalRight + freeRadius} 0`;
    append(documentObject, svg, "path", {
      d: freeThrowPath, fill: "none", stroke: "#fff", "stroke-width": 0.08,
      "stroke-dasharray": `${court.markings.free_throw_segment_m} ${court.markings.free_throw_gap_m}`,
      "clip-path": "url(#court-clip)"
    });
    const penaltyHalf = court.markings.penalty_line_length_m / 2;
    const goalkeeperHalf = court.markings.goalkeeper_line_length_m / 2;
    append(documentObject, svg, "line", { x1: 10 - penaltyHalf, y1: court.markings.penalty_line_distance_m, x2: 10 + penaltyHalf, y2: court.markings.penalty_line_distance_m, stroke: "#fff", "stroke-width": 0.08 });
    append(documentObject, svg, "line", { x1: 10 - goalkeeperHalf, y1: court.markings.goalkeeper_line_distance_m, x2: 10 + goalkeeperHalf, y2: court.markings.goalkeeper_line_distance_m, stroke: "#fff", "stroke-width": 0.08 });
    append(documentObject, svg, "line", { x1: 0, y1: 20, x2: 20, y2: 20, stroke: "#fff", "stroke-width": 0.08 });
    append(documentObject, svg, "path", { d: "M 8 20 A 2 2 0 0 1 12 20", fill: "none", stroke: "#fff", "stroke-width": 0.08 });
    append(documentObject, svg, "rect", { x: goalLeft, y: -0.72, width: 3, height: 0.72, fill: "#f8f5ec", stroke: "#c83d37", "stroke-width": 0.12 });
    for (let x = goalLeft + 0.25; x < goalRight; x += 0.5) {
      append(documentObject, svg, "line", { x1: x, y1: -0.72, x2: x, y2: 0, stroke: "#c83d37", "stroke-width": 0.12 });
    }
  }

  function targetRef(collection, id) { return `geometry:${collection}:${id}`; }
  function selectedClass(selection, ref) { return selection && selection.ref === ref ? " is-selected" : ""; }

  function pointToward(from, toward, distance) {
    const dx = toward[0] - from[0], dy = toward[1] - from[1], length = Math.hypot(dx, dy);
    if (!length) return from.slice();
    return [Number((from[0] + dx / length * distance).toFixed(3)), Number((from[1] + dy / length * distance).toFixed(3))];
  }

  function visiblePath(path, geometry, grammar, primitive) {
    const candidate = JSON.parse(JSON.stringify(path));
    if (!candidate.segments || !candidate.segments.length || primitive !== "pass" || candidate.anchor_mode !== "symbol_perimeter") return candidate;
    const entities = new Map((geometry.entities || []).map((entity) => [entity.id, entity]));
    const from = entities.get(candidate.from_participant_ref), to = entities.get(candidate.to_participant_ref);
    const first = candidate.segments[0], last = candidate.segments[candidate.segments.length - 1];
    const fromStyle = from && (grammar.entities[from.kind] || grammar.entities.generic_participant);
    const toStyle = to && (grammar.entities[to.kind] || grammar.entities.generic_participant);
    if (fromStyle) first.start = pointToward(first.start, first.type === "cubic" ? first.control1 : first.end, fromStyle.radius || 0.34);
    if (toStyle) last.end = pointToward(last.end, last.type === "cubic" ? last.control2 : last.start, toStyle.radius || 0.34);
    return candidate;
  }

  function addControlOverlays(documentObject, svg, geometry, grammar, selection) {
    const zoneStyle = grammar.overlays.spatial_zone;
    (geometry.zones || []).forEach((zone) => {
      const ref = targetRef("zone", zone.id);
      append(documentObject, svg, "polygon", {
        points: pointString(zone.polygon), fill: "none",
        stroke: zoneStyle.stroke, "stroke-opacity": 0.38, "stroke-width": 0.035, "stroke-dasharray": "0.14 0.18",
        class: `selectable overlay-zone${selectedClass(selection, ref)}`, "data-ref": ref, "data-kind": "zone"
      });
      append(documentObject, svg, "line", {
        x1: zone.defensive_line[0][0], y1: zone.defensive_line[0][1],
        x2: zone.defensive_line[1][0], y2: zone.defensive_line[1][1],
        stroke: grammar.overlays.defensive_reference.stroke, "stroke-width": grammar.overlays.defensive_reference.width,
        "stroke-dasharray": grammar.overlays.defensive_reference.dash, "pointer-events": "none"
      });
      const label = append(documentObject, svg, "text", { x: (zone.polygon[0][0] + zone.polygon[1][0]) / 2, y: 15.0, "text-anchor": "middle", fill: "#173f33", "fill-opacity": 0.58, "font-size": 0.22, "font-weight": 750, "pointer-events": "none" });
      label.textContent = `límit ${zone.id}`;
    });
    (geometry.spaces || []).forEach((space) => {
      const ref = targetRef("space", space.id);
      append(documentObject, svg, "circle", {
        cx: space.anchor[0], cy: space.anchor[1], r: 0.055, fill: "#173f33", "fill-opacity": 0.55,
        stroke: "none",
        class: `selectable overlay-space${selectedClass(selection, ref)}`, "data-ref": ref, "data-kind": "space"
      });
      const label = append(documentObject, svg, "text", {
        x: space.anchor[0] + 0.11, y: space.anchor[1] - 0.08, "text-anchor": "start", fill: "#173f33", "fill-opacity": 0.62,
        "font-size": 0.17, "font-weight": 700, "pointer-events": "none"
      });
      label.textContent = space.id;
    });
  }

  function addPath(documentObject, svg, path, collection, grammar, selection, view, suffix, geometry) {
    const primitive = visualApi.primitiveForPath(path.kind, grammar);
    const style = grammar.paths[primitive] || grammar.paths.movement;
    const ref = targetRef(collection, path.id);
    const marker = style.marker === "arrow"
      ? primitive === "pass" ? "url(#traca-arrow-pass)" : primitive === "shot" ? "url(#traca-arrow-shot)" : "url(#traca-arrow-dark)"
      : null;
    const renderedPath = visiblePath(path, geometry || {}, grammar, primitive);
    append(documentObject, svg, "path", {
      d: pathData(renderedPath.segments ? renderedPath : renderedPath.points), fill: "none", stroke: style.stroke, "stroke-width": style.width,
      "stroke-dasharray": style.dash, "stroke-linecap": "round", "stroke-linejoin": "miter",
      "marker-end": marker, class: `selectable exercise-path${selectedClass(selection, ref)}`,
      "data-ref": ref, "data-kind": "path", "data-path-suffix": suffix || (path.segments ? "segments" : "points")
    });
    if (view === "control" && selection && selection.ref === ref) {
      if (path.segments) (path.segments || []).forEach((segment, index) => {
        const handles = [];
        if (segment.type === "cubic") handles.push(["control1", segment.control1], ["control2", segment.control2]);
        if (index < path.segments.length - 1 || !path.to_state_ref) handles.push(["end", segment.end]);
        handles.forEach(([property, point]) => append(documentObject, svg, "circle", {
          cx: point[0], cy: point[1], r: 0.14, fill: "#fff", stroke: "#173f33", "stroke-width": 0.055,
          class: "path-handle", "data-ref": ref, "data-property": `segments.${index}.${property}`
        }));
      });
      else (path.points || []).forEach((point, index) => {
        append(documentObject, svg, "circle", {
          cx: point[0], cy: point[1], r: 0.16, fill: "#fff", stroke: "#173f33", "stroke-width": 0.065,
          class: "path-handle", "data-ref": ref, "data-index": index, "data-property": suffix || "points"
        });
      });
    }
  }

  function addEntity(documentObject, svg, entity, grammar, selection) {
    const style = grammar.entities[entity.kind] || grammar.entities.attacker;
    const ref = targetRef("entity", entity.id);
    const group = append(documentObject, svg, "g", {
      class: `selectable entity-node${selectedClass(selection, ref)}`,
      "data-ref": ref, "data-kind": "entity", tabindex: 0, role: "button", "aria-label": `${entity.kind} ${entity.id}`
    });
    if (entity.state_ref) group.dataset.stateRef = entity.state_ref;
    const x = entity.position[0];
    const y = entity.position[1];
    if (style.shape === "text") {
      const text = append(documentObject, group, "text", { x, y, "text-anchor": "middle", fill: style.text, "font-size": 0.34, "font-weight": 750 });
      text.textContent = entity.label || entity.id;
    } else if (style.shape === "triangle") {
      append(documentObject, group, "polygon", { points: `${x},${y - 0.3} ${x - 0.27},${y + 0.24} ${x + 0.27},${y + 0.24}`, fill: style.fill, stroke: style.stroke, "stroke-width": 0.045 });
    } else if (style.shape === "rect") {
      append(documentObject, group, "rect", { x: x - style.radius, y: y - 0.24, width: style.radius * 2, height: 0.48, rx: 0.05, fill: style.fill, stroke: style.stroke, "stroke-width": 0.045 });
    } else {
      append(documentObject, group, "circle", { cx: x, cy: y, r: style.radius, fill: style.fill, stroke: style.stroke, "stroke-width": 0.055 });
    }
    if (entity.label && style.shape !== "text") {
      const label = append(documentObject, group, "text", { x, y: y + 0.11, "text-anchor": "middle", fill: style.text, "font-size": 0.31, "font-weight": 850, "pointer-events": "none" });
      label.textContent = entity.label;
    }
  }

  function addFutureState(documentObject, svg, state, geometry, grammar, selection) {
    const participant = (geometry.entities || []).find((entity) => entity.id === state.participant_ref);
    if (!participant) return;
    const style = grammar.entities[participant.kind] || grammar.entities.generic_participant;
    const ref = targetRef("participant_state", state.id);
    const group = append(documentObject, svg, "g", {
      class: `selectable participant-state-node${selectedClass(selection, ref)}`,
      "data-ref": ref, "data-kind": "participant_state", tabindex: 0, role: "button", "aria-label": `Posició futura ${participant.label || participant.id}`
    });
    append(documentObject, group, "circle", { cx: state.position[0], cy: state.position[1], r: style.radius || 0.34, fill: "none", stroke: style.stroke, "stroke-opacity": 0.62, "stroke-width": 0.07, "stroke-dasharray": "0.13 0.1" });
  }

  function selectedAlternatives(geometry, selectionMap) {
    return (geometry.branches || []).map((branch) => {
      const selectedId = selectionMap[branch.id] || (branch.alternatives[0] && branch.alternatives[0].id);
      return (branch.alternatives || []).find((item) => item.id === selectedId) || branch.alternatives[0];
    }).filter(Boolean);
  }

  function addGhostGeometry(documentObject, svg, geometry, selectedMap) {
    if (!geometry) return;
    const group = append(documentObject, svg, "g", { class: "comparison-ghost", opacity: 0.42, "pointer-events": "none" });
    const paths = [...(geometry.common_paths || []), ...selectedAlternatives(geometry, selectedMap || {})];
    paths.forEach((path) => {
      if (path.return_pass) append(documentObject, group, "path", { d: pathData(path.return_pass.segments ? path.return_pass : path.return_pass.points), fill: "none", stroke: "#ffffff", "stroke-width": 0.1, "stroke-dasharray": "0.18 0.12" });
      append(documentObject, group, "path", { d: pathData(path.segments ? path : path.points), fill: "none", stroke: "#ffffff", "stroke-width": 0.12, "stroke-dasharray": "0.18 0.12" });
    });
    (geometry.entities || []).forEach((entity) => append(documentObject, group, "circle", { cx: entity.position[0], cy: entity.position[1], r: 0.42, fill: "none", stroke: "#ffffff", "stroke-width": 0.1 }));
  }

  function render(container, options) {
    const documentObject = container.ownerDocument;
    const geometry = options.geometry;
    const grammar = options.visualGrammar;
    const view = options.view || "control";
    const selection = options.selection;
    const alternatives = selectedAlternatives(geometry, options.selectedAlternatives || {});
    container.replaceChildren();
    const svg = append(documentObject, container, "svg", {
      viewBox: geometry.court.view_box.join(" "), class: `traca-court view-${view}`,
      role: "img", "aria-label": `Representació editable de ${geometry.meta.exercise_id}`
    });
    addCourt(documentObject, svg, geometry.court);
    if (options.comparisonGeometry) addGhostGeometry(documentObject, svg, options.comparisonGeometry, options.selectedAlternatives || {});
    if (view === "control") addControlOverlays(documentObject, svg, geometry, grammar, selection);
    (geometry.common_paths || []).forEach((path) => addPath(documentObject, svg, path, "common_path", grammar, selection, view, null, geometry));
    alternatives.forEach((alternative) => {
      if (alternative.return_pass) {
        addPath(documentObject, svg, alternative.return_pass, "return_pass", grammar, selection, view, "segments", geometry);
      } else if (alternative.return_ball_points && alternative.return_ball_points.length > 1) {
        addPath(documentObject, svg, { ...alternative, kind: "return_pass", points: alternative.return_ball_points }, "alternative", grammar, selection, view, "return_ball_points", geometry);
      }
      addPath(documentObject, svg, alternative, "alternative", grammar, selection, view, alternative.segments ? "segments" : "points", geometry);
    });
    if (view === "control") dependenciesApi.visibleFutureStates(geometry, options.selectedAlternatives || {}).forEach((state) => addFutureState(documentObject, svg, state, geometry, grammar, selection));
    (geometry.entities || []).forEach((entity) => addEntity(documentObject, svg, entity, grammar, selection));
    return svg;
  }

  return { pathData, pathForDisplay: visiblePath, selectedAlternatives, render };
});
