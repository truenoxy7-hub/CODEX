(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const visual = isNode ? require("./visual-grammar.js") : root.TRACA_VISUAL_GRAMMAR;
  const api = factory(visual);
  if (isNode) module.exports = api;
  root.TRACA_RENDERER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (visualApi) {
  "use strict";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function pathData(points) {
    if (!Array.isArray(points) || points.length < 2) return "";
    return points.map((point, index) => `${index ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");
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

  function addControlOverlays(documentObject, svg, geometry, grammar, selection) {
    const zoneStyle = grammar.overlays.spatial_zone;
    (geometry.zones || []).forEach((zone) => {
      const ref = targetRef("zone", zone.id);
      append(documentObject, svg, "polygon", {
        points: pointString(zone.polygon), fill: zoneStyle.fill, "fill-opacity": zoneStyle.opacity,
        stroke: zoneStyle.stroke, "stroke-width": 0.045, "stroke-dasharray": zoneStyle.dash,
        class: `selectable overlay-zone${selectedClass(selection, ref)}`, "data-ref": ref, "data-kind": "zone"
      });
      append(documentObject, svg, "line", {
        x1: zone.defensive_line[0][0], y1: zone.defensive_line[0][1],
        x2: zone.defensive_line[1][0], y2: zone.defensive_line[1][1],
        stroke: grammar.overlays.defensive_reference.stroke, "stroke-width": grammar.overlays.defensive_reference.width,
        "stroke-dasharray": grammar.overlays.defensive_reference.dash, "pointer-events": "none"
      });
      const label = append(documentObject, svg, "text", {
        x: (zone.polygon[0][0] + zone.polygon[1][0]) / 2, y: 15.0, "text-anchor": "middle",
        fill: "#173f33", "font-size": 0.28, "font-weight": 800, "pointer-events": "none"
      });
      label.textContent = zone.id;
    });
    (geometry.spaces || []).forEach((space) => {
      const ref = targetRef("space", space.id);
      append(documentObject, svg, "polygon", {
        points: pointString(space.polygon), fill: "#ffffff", "fill-opacity": 0.08,
        stroke: "#ffffff", "stroke-opacity": 0.5, "stroke-width": 0.025,
        class: `selectable overlay-space${selectedClass(selection, ref)}`, "data-ref": ref, "data-kind": "space"
      });
      const label = append(documentObject, svg, "text", {
        x: space.center[0], y: 6.1, "text-anchor": "middle", fill: "#173f33",
        "font-size": 0.22, "font-weight": 750, "pointer-events": "none"
      });
      label.textContent = space.id;
    });
  }

  function addPath(documentObject, svg, path, collection, grammar, selection, view, suffix) {
    const primitive = visualApi.primitiveForPath(path.kind, grammar);
    const style = grammar.paths[primitive] || grammar.paths.movement;
    const ref = targetRef(collection, path.id);
    const marker = style.marker === "arrow"
      ? primitive === "pass" ? "url(#traca-arrow-pass)" : primitive === "shot" ? "url(#traca-arrow-shot)" : "url(#traca-arrow-dark)"
      : null;
    append(documentObject, svg, "path", {
      d: pathData(path.points), fill: "none", stroke: style.stroke, "stroke-width": style.width,
      "stroke-dasharray": style.dash, "stroke-linecap": "round", "stroke-linejoin": "miter",
      "marker-end": marker, class: `selectable exercise-path${selectedClass(selection, ref)}`,
      "data-ref": ref, "data-kind": "path", "data-path-suffix": suffix || "points"
    });
    if (view === "control" && selection && selection.ref === ref) {
      (path.points || []).forEach((point, index) => {
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
    const x = entity.position[0];
    const y = entity.position[1];
    if (style.shape === "triangle") {
      append(documentObject, group, "polygon", { points: `${x},${y - 0.3} ${x - 0.27},${y + 0.24} ${x + 0.27},${y + 0.24}`, fill: style.fill, stroke: style.stroke, "stroke-width": 0.045 });
    } else if (style.shape === "rect") {
      append(documentObject, group, "rect", { x: x - style.radius, y: y - 0.24, width: style.radius * 2, height: 0.48, rx: 0.05, fill: style.fill, stroke: style.stroke, "stroke-width": 0.045 });
    } else {
      append(documentObject, group, "circle", { cx: x, cy: y, r: style.radius, fill: style.fill, stroke: style.stroke, "stroke-width": 0.055 });
    }
    if (entity.label) {
      const label = append(documentObject, group, "text", { x, y: y + 0.11, "text-anchor": "middle", fill: style.text, "font-size": 0.31, "font-weight": 850, "pointer-events": "none" });
      label.textContent = entity.label;
    }
  }

  function selectedAlternatives(geometry, selectionMap) {
    return (geometry.branches || []).map((branch) => {
      const selectedId = selectionMap[branch.id] || (branch.alternatives[0] && branch.alternatives[0].id);
      return (branch.alternatives || []).find((item) => item.id === selectedId) || branch.alternatives[0];
    }).filter(Boolean);
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
    if (view === "control") addControlOverlays(documentObject, svg, geometry, grammar, selection);
    (geometry.common_paths || []).forEach((path) => addPath(documentObject, svg, path, "common_path", grammar, selection, view));
    alternatives.forEach((alternative) => {
      if (alternative.return_ball_points && alternative.return_ball_points.length > 1) {
        addPath(documentObject, svg, { ...alternative, kind: "return_pass", points: alternative.return_ball_points }, "alternative", grammar, selection, view, "return_ball_points");
      }
      addPath(documentObject, svg, alternative, "alternative", grammar, selection, view, "points");
    });
    (geometry.entities || []).forEach((entity) => addEntity(documentObject, svg, entity, grammar, selection));
    return svg;
  }

  return { pathData, selectedAlternatives, render };
});
