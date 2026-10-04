(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const visual = isNode ? require("./visual-grammar.js") : root.TRACA_VISUAL_GRAMMAR;
  const dependencies = isNode ? require("./geometry-dependencies.js") : root.TRACA_GEOMETRY_DEPENDENCIES;
  const courtGeometry = isNode ? require("./court-geometry.js") : root.TRACA_COURT_GEOMETRY;
  const api = factory(visual, dependencies, courtGeometry);
  if (isNode) module.exports = api;
  root.TRACA_RENDERER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (visualApi, dependenciesApi, courtGeometryApi) {
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

  function wavyPathData(path, wavePolicy) {
    const policy = wavePolicy || {};
    const source = dependenciesApi.sampledPoints(path, 28);
    if (source.length < 2) return pathData(path.segments ? path : path.points);
    const points = [];
    source.slice(0, -1).forEach((start, segmentIndex) => {
      const end = source[segmentIndex + 1];
      for (let step = 0; step < 6; step += 1) {
        if (segmentIndex && !step) continue;
        const ratio = step / 6;
        points.push([start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio]);
      }
    });
    points.push(source.at(-1));
    const waved = points.map((point, index) => {
      if (!index || index === points.length - 1) return point;
      const before = points[index - 1], after = points[index + 1];
      const dx = after[0] - before[0], dy = after[1] - before[1], length = Math.hypot(dx, dy) || 1;
      const offset = Math.sin(index * Math.PI * (policy.frequency || 0.72)) * (policy.amplitude || 0.095);
      return [Number((point[0] - dy / length * offset).toFixed(3)), Number((point[1] + dx / length * offset).toFixed(3))];
    });
    return pathData(waved);
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

  function addMetadata(documentObject, svg, geometry, grammar) {
    const metadata = append(documentObject, svg, "metadata", { id: "traca-export-metadata" });
    metadata.textContent = JSON.stringify({
      format: "TRACA_rendered_graphic",
      case_ref: geometry.meta && (geometry.meta.case_id || geometry.meta.exercise_id) || null,
      source_revision: geometry.meta && geometry.meta.source_revision || null,
      geometry_version: geometry.meta && geometry.meta.version || null,
      visual_grammar_version: grammar.meta && grammar.meta.version || null,
      visual_policy_ref: grammar.meta && grammar.meta.visual_policy_ref || null,
      tactical_validation: geometry.result && geometry.result.tactical_validation_status || geometry.validation && geometry.validation.tactical || null
    });
  }

  function addMarker(documentObject, defs, id, color, arrows) {
    const policy = arrows || {};
    const marker = append(documentObject, defs, "marker", {
      id, viewBox: policy.view_box || "0 0 10 10", refX: policy.ref_x || 9, refY: policy.ref_y || 5,
      markerWidth: policy.width || 5, markerHeight: policy.height || 5, orient: "auto"
    });
    append(documentObject, marker, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color });
  }

  function addCourt(documentObject, svg, court, grammar) {
    const style = grammar && grammar.court || {};
    const posts = courtGeometryApi.goalPosts(court);
    const goalLeft = posts.left;
    const goalRight = posts.right;
    const defs = append(documentObject, svg, "defs");
    const clip = append(documentObject, defs, "clipPath", { id: "court-clip" });
    append(documentObject, clip, "rect", { x: 0, y: 0, width: court.width_m, height: court.half_length_m });
    addMarker(documentObject, defs, "traca-arrow-dark", grammar.paths.movement.stroke, grammar.arrows);
    addMarker(documentObject, defs, "traca-arrow-pass", grammar.paths.pass.stroke, grammar.arrows);
    addMarker(documentObject, defs, "traca-arrow-shot", grammar.paths.shot.stroke, grammar.arrows);

    append(documentObject, svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: style.floor || "#fbfaf7" });
    for (let x = 1; x < 20; x += 1.5) {
      append(documentObject, svg, "line", { x1: x, y1: 0, x2: x, y2: 20, stroke: style.floor_detail || "#dedbd2", "stroke-opacity": style.floor_detail_opacity || 0.45, "stroke-width": style.floor_detail_width || 0.02 });
    }
    append(documentObject, svg, "rect", { x: 0, y: 0, width: 20, height: 20, fill: "none", stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "path", { d: courtGeometryApi.goalAreaPath(court), fill: style.goal_area_fill || "#eef3ef", stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "path", {
      d: courtGeometryApi.freeThrowPath(court), fill: "none", stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075,
      "stroke-dasharray": `${court.markings.free_throw_segment_m} ${court.markings.free_throw_gap_m}`,
      "clip-path": "url(#court-clip)"
    });
    const penaltyHalf = court.markings.penalty_line_length_m / 2;
    const goalkeeperHalf = court.markings.goalkeeper_line_length_m / 2;
    append(documentObject, svg, "line", { x1: 10 - penaltyHalf, y1: court.markings.penalty_line_distance_m, x2: 10 + penaltyHalf, y2: court.markings.penalty_line_distance_m, stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "line", { x1: 10 - goalkeeperHalf, y1: court.markings.goalkeeper_line_distance_m, x2: 10 + goalkeeperHalf, y2: court.markings.goalkeeper_line_distance_m, stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "line", { x1: 0, y1: 20, x2: 20, y2: 20, stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "path", { d: "M 8 20 A 2 2 0 0 1 12 20", fill: "none", stroke: style.line || "#aeb8b0", "stroke-width": style.line_width || 0.075 });
    append(documentObject, svg, "rect", { x: goalLeft, y: -0.72, width: 3, height: 0.72, fill: style.goal_fill || "#ffffff", stroke: style.goal || "#a7433f", "stroke-width": style.goal_width || 0.11 });
    for (let x = goalLeft + 0.25; x < goalRight; x += 0.5) {
      append(documentObject, svg, "line", { x1: x, y1: -0.72, x2: x, y2: 0, stroke: style.goal || "#a7433f", "stroke-width": style.goal_width || 0.11 });
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
    const stateLinked = candidate.from_state_ref && candidate.to_state_ref;
    const canAnchor = candidate.action_type === "movement" || (primitive === "pass" && candidate.anchor_mode === "symbol_perimeter");
    if (!candidate.segments || !candidate.segments.length || !stateLinked || !canAnchor) return candidate;
    const entities = new Map((geometry.entities || []).map((entity) => [entity.id, entity]));
    const from = entities.get(candidate.action_type === "pass" ? candidate.from_participant_ref : candidate.actor_ref);
    const to = entities.get(candidate.action_type === "pass" ? candidate.to_participant_ref : candidate.actor_ref);
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
    const renderedData = style.path_mode === "wavy_segments" || style.line === "wavy"
      ? wavyPathData(renderedPath, grammar.wave)
      : pathData(renderedPath.segments ? renderedPath : renderedPath.points);
    if (style.render_mode === "double_stroke") {
      append(documentObject, svg, "path", {
        d: renderedData, fill: "none", stroke: style.stroke, "stroke-width": style.width,
        "stroke-linecap": "round", "stroke-linejoin": "miter", "pointer-events": "none"
      });
    }
    append(documentObject, svg, "path", {
      d: renderedData, fill: "none", stroke: style.render_mode === "double_stroke" ? (grammar.court && grammar.court.page_background || "#ffffff") : style.stroke, "stroke-width": style.render_mode === "double_stroke" ? style.gap_width || Math.max(0.04, style.width * 0.36) : style.width,
      "stroke-dasharray": style.dash, "stroke-linecap": "round", "stroke-linejoin": "miter",
      "marker-end": marker, class: `selectable exercise-path${selectedClass(selection, ref)}`,
      "data-ref": ref, "data-kind": "path", "data-path-suffix": suffix || (path.segments ? "segments" : "points")
    });
    const sampled = dependenciesApi.sampledPoints(renderedPath, 10);
    if (style.cancellation_mark && sampled.length) {
      const middle = sampled[Math.floor(sampled.length / 2)];
      const half = grammar.marks && grammar.marks.cancellation_half_length || 0.18;
      append(documentObject, svg, "line", { x1: middle[0] - half, y1: middle[1] + half, x2: middle[0] + half, y2: middle[1] - half, stroke: style.stroke, "stroke-width": grammar.marks && grammar.marks.cancellation_width || 0.08, "stroke-linecap": "round", "pointer-events": "none" });
    }
    if (style.terminal_mark && sampled.length > 1) {
      const end = sampled.at(-1), before = sampled.at(-2);
      const dx = end[0] - before[0], dy = end[1] - before[1], length = Math.hypot(dx, dy) || 1;
      const half = grammar.marks && grammar.marks.terminal_half_length || 0.23;
      const px = -dy / length * half, py = dx / length * half;
      append(documentObject, svg, "line", { x1: end[0] - px, y1: end[1] - py, x2: end[0] + px, y2: end[1] + py, stroke: style.stroke, "stroke-width": grammar.marks && grammar.marks.terminal_width || 0.09, "stroke-linecap": "round", "pointer-events": "none" });
    }
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
    const radius = style.radius || 0.34;
    const outlineWidth = grammar.meta.mode === "monochrome" || ["attacker", "defender", "passer", "pivot", "goalkeeper", "generic_participant"].includes(entity.kind) ? 0.055 : 0.045;
    if (style.shape === "text") {
      const text = append(documentObject, group, "text", { x, y, "text-anchor": "middle", fill: style.text, "font-size": 0.34, "font-weight": 750 });
      text.textContent = entity.label || entity.id;
    } else if (style.shape === "triangle") {
      append(documentObject, group, "polygon", { points: `${x},${y - radius} ${x - radius * 0.82},${y + radius * 0.72} ${x + radius * 0.82},${y + radius * 0.72}`, fill: style.fill, stroke: style.stroke, "stroke-width": outlineWidth });
    } else if (style.shape === "rect") {
      append(documentObject, group, "rect", { x: x - radius, y: y - radius * 0.7, width: radius * 2, height: radius * 1.4, rx: 0.05, fill: style.fill, stroke: style.stroke, "stroke-width": outlineWidth });
    } else {
      append(documentObject, group, "circle", { cx: x, cy: y, r: radius, fill: style.fill, stroke: style.stroke, "stroke-width": outlineWidth });
    }
    if (entity.label && style.shape !== "text") {
      const label = append(documentObject, group, "text", { x, y: y + (grammar.labels && grammar.labels.offset_y || 0.11), "text-anchor": "middle", fill: style.text, "font-size": grammar.labels && grammar.labels.participant_size || 0.31, "font-weight": grammar.labels && grammar.labels.weight || 800, "pointer-events": "none" });
      label.textContent = entity.label;
    }
  }

  function addContextualReference(documentObject, svg, reference, grammar) {
    const style = grammar.overlays.contextual_delimiter || { stroke: "#8f2624", dash: "0.12 0.1", text: "#5d4039" };
    const x = reference.position[0], y = reference.position[1];
    const group = append(documentObject, svg, "g", {
      class: "contextual-reference-node",
      role: "img",
      "aria-label": `Referència estructural ${reference.label || reference.participant_ref}`,
      "data-ref": targetRef("contextual_reference", reference.id),
      "data-participant-ref": reference.participant_ref,
      "data-active-participant": "false",
      "pointer-events": "none"
    });
    append(documentObject, group, "polygon", {
      points: `${x},${y - 0.3} ${x - 0.27},${y + 0.24} ${x + 0.27},${y + 0.24}`,
      fill: "none", stroke: style.stroke, "stroke-opacity": 0.62, "stroke-width": 0.055, "stroke-dasharray": style.dash
    });
    const label = append(documentObject, group, "text", {
      x, y: y + 0.12, "text-anchor": "middle", fill: style.text, "fill-opacity": 0.78,
      "font-size": 0.34, "font-weight": 760
    });
    label.textContent = reference.label || reference.participant_ref;
  }

  function addBall(documentObject, svg, ball, grammar) {
    const style = grammar.entities.ball;
    const group = append(documentObject, svg, "g", {
      class: "ball-node",
      role: "img",
      "aria-label": `Pilota ${ball.ball_ref} amb ${ball.holder_ref}`,
      "data-ball-ref": ball.ball_ref,
      "data-ball-state-ref": ball.ball_state_ref,
      "data-holder-state-ref": ball.holder_state_ref,
      "pointer-events": "none"
    });
    append(documentObject, group, "circle", {
      cx: ball.position[0], cy: ball.position[1], r: style.radius,
      fill: style.fill, stroke: style.stroke, "stroke-width": 0.04
    });
  }

  function addTemporalState(documentObject, svg, state, geometry, grammar, selection, view) {
    const participant = (geometry.entities || []).find((entity) => entity.id === state.participant_ref);
    if (!participant) return;
    const style = grammar.entities[participant.kind] || grammar.entities.generic_participant;
    const temporal = grammar.states && grammar.states[state.status] || grammar.states && grammar.states.future || { fill: "none", dash: "0.12 0.1", stroke_opacity: 0.72, stroke_width: 0.065 };
    const ref = targetRef("participant_state", state.id);
    const interactive = view === "control";
    const group = append(documentObject, svg, "g", {
      class: `${interactive ? "selectable " : ""}participant-state-node${selectedClass(selection, ref)}`,
      "data-ref": interactive ? ref : null, "data-kind": interactive ? "participant_state" : null,
      tabindex: interactive ? 0 : null, role: interactive ? "button" : "img",
      "pointer-events": interactive ? null : "none", "aria-label": `Posició ${state.status === "past" ? "anterior" : "futura"} ${participant.label || participant.id}`,
      "data-temporal-status": state.status
    });
    const x = state.position[0], y = state.position[1];
    if (style.shape === "text") {
      const text = append(documentObject, group, "text", { x, y, "text-anchor": "middle", fill: style.text, "fill-opacity": 0.55, "font-size": 0.34, "font-weight": 750 });
      text.textContent = participant.label || participant.id;
    } else if (style.shape === "triangle") {
      const radius = style.radius || 0.34;
      append(documentObject, group, "polygon", { points: `${x},${y - radius} ${x - radius * 0.82},${y + radius * 0.72} ${x + radius * 0.82},${y + radius * 0.72}`, fill: temporal.fill, stroke: style.stroke, "stroke-opacity": temporal.stroke_opacity, "stroke-width": temporal.stroke_width, "stroke-dasharray": temporal.dash });
    } else if (style.shape === "rect") {
      append(documentObject, group, "rect", { x: x - style.radius, y: y - 0.24, width: style.radius * 2, height: 0.48, rx: 0.05, fill: temporal.fill, stroke: style.stroke, "stroke-opacity": temporal.stroke_opacity, "stroke-width": temporal.stroke_width, "stroke-dasharray": temporal.dash });
    } else {
      append(documentObject, group, "circle", { cx: x, cy: y, r: style.radius || 0.34, fill: temporal.fill, stroke: style.stroke, "stroke-opacity": temporal.stroke_opacity, "stroke-width": temporal.stroke_width, "stroke-dasharray": temporal.dash });
    }
    if (participant.label && style.shape !== "text") {
      const label = append(documentObject, group, "text", { x, y: y + (grammar.labels && grammar.labels.offset_y || 0.11), "text-anchor": "middle", fill: style.text, "fill-opacity": 0.68, "font-size": grammar.labels && grammar.labels.participant_size || 0.31, "font-weight": grammar.labels && grammar.labels.weight || 800, "pointer-events": "none" });
      label.textContent = participant.label;
    }
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
      if (path.approach_path) append(documentObject, group, "path", { d: pathData(path.approach_path.segments ? path.approach_path : path.approach_path.points), fill: "none", stroke: "#ffffff", "stroke-width": 0.12, "stroke-dasharray": "0.18 0.12" });
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
    const geometryLabel = geometry.meta.exercise_id || geometry.meta.case_id || "cas sense identificador";
    container.replaceChildren();
    const svg = append(documentObject, container, "svg", {
      viewBox: geometry.court.view_box.join(" "), class: `traca-court view-${view}`,
      role: "img", "aria-label": `Representació editable de ${geometryLabel}`
    });
    addMetadata(documentObject, svg, geometry, grammar);
    addCourt(documentObject, svg, geometry.court, grammar);
    if (options.comparisonGeometry) addGhostGeometry(documentObject, svg, options.comparisonGeometry, options.selectedAlternatives || {});
    if (view === "control") addControlOverlays(documentObject, svg, geometry, grammar, selection);
    (geometry.common_paths || []).forEach((path) => addPath(documentObject, svg, path, "common_path", grammar, selection, view, null, geometry));
    alternatives.forEach((alternative) => {
      if (alternative.approach_path) {
        addPath(documentObject, svg, alternative.approach_path, "approach_path", grammar, selection, view, "segments", geometry);
      }
      if (alternative.return_pass) {
        addPath(documentObject, svg, alternative.return_pass, "return_pass", grammar, selection, view, "segments", geometry);
      } else if (alternative.return_ball_points && alternative.return_ball_points.length > 1) {
        addPath(documentObject, svg, { ...alternative, kind: "return_pass", points: alternative.return_ball_points }, "alternative", grammar, selection, view, "return_ball_points", geometry);
      }
      addPath(documentObject, svg, alternative, "alternative", grammar, selection, view, alternative.segments ? "segments" : "points", geometry);
    });
    const temporalStates = dependenciesApi.visibleTemporalStates
      ? dependenciesApi.visibleTemporalStates(geometry, options.selectedAlternatives || {})
      : dependenciesApi.visibleFutureStates(geometry, options.selectedAlternatives || {});
    temporalStates.forEach((state) => addTemporalState(documentObject, svg, state, geometry, grammar, selection, view));
    (geometry.contextual_references || []).forEach((reference) => addContextualReference(documentObject, svg, reference, grammar));
    (geometry.entities || []).forEach((entity) => addEntity(documentObject, svg, entity, grammar, selection));
    (geometry.balls || []).filter((ball) => ball.visibility === "initial").forEach((ball) => addBall(documentObject, svg, ball, grammar));
    return svg;
  }

  function renderSymbolSheet(container, options) {
    const configuration = options || {};
    const documentObject = container.ownerDocument;
    const grammar = configuration.visualGrammar || visualApi.createVisualGrammar(null, { mode: configuration.mode || "color" });
    const references = configuration.canonicalReferences || [];
    container.replaceChildren();
    const svg = append(documentObject, container, "svg", {
      viewBox: "0 0 20 15.2", class: `traca-symbol-sheet mode-${grammar.meta.mode || "color"}`,
      role: "img", "aria-label": "Làmina canònica dels 14 símbols de TRAÇA"
    });
    const metadata = append(documentObject, svg, "metadata", { id: "traca-symbol-sheet-metadata" });
    metadata.textContent = JSON.stringify({
      format: "TRACA_symbol_sheet", version: "0.1.0", canonical_symbols: 14,
      source_dictionary: grammar.meta.source_dictionary, source_version: grammar.meta.source_version,
      visual_policy_ref: grammar.meta.visual_policy_ref, mode: grammar.meta.mode
    });
    append(documentObject, svg, "rect", { x: 0, y: 0, width: 20, height: 15.2, fill: grammar.court.page_background || "#ffffff" });
    const defs = append(documentObject, svg, "defs");
    addMarker(documentObject, defs, "traca-arrow-dark", grammar.paths.movement.stroke, grammar.arrows);
    addMarker(documentObject, defs, "traca-arrow-pass", grammar.paths.pass.stroke, grammar.arrows);
    addMarker(documentObject, defs, "traca-arrow-shot", grammar.paths.shot.stroke, grammar.arrows);

    const title = append(documentObject, svg, "text", { x: 0.65, y: 0.72, fill: "#17241f", "font-size": 0.48, "font-weight": 850 });
    title.textContent = "TRAÇA · referència visual canònica";
    const subtitle = append(documentObject, svg, "text", { x: 19.35, y: 0.72, fill: "#526056", "font-size": 0.25, "text-anchor": "end" });
    subtitle.textContent = `${grammar.meta.source_version || "diccionari"} · ${grammar.meta.mode || "color"}`;

    const fallbackLabels = {
      attacker: "Atacant", attacker_with_ball: "Atacant amb pilota", defender: "Defensor",
      movement_without_ball: "Desplaçament sense pilota", pass: "Passada", pass_feint: "Finta de passada",
      shot: "Llançament", shot_feint: "Finta de llançament", feint: "Finta",
      block_screen: "Bloqueig ofensiu / pantalla", defensive_block: "Blocatge defensiu",
      future_position: "Posició futura", past_position: "Posició anterior", dribble: "Desplaçament en bot"
    };
    const orderedConcepts = ["attacker", "attacker_with_ball", "defender", "movement_without_ball", "pass", "pass_feint", "shot", "shot_feint", "feint", "block_screen", "defensive_block", "future_position", "past_position", "dribble"];
    const referenceByConcept = new Map(references.map((item) => [item.concept, item]));
    const rowGeometry = { entities: [] };

    orderedConcepts.forEach((concept, index) => {
      const column = Math.floor(index / 7);
      const row = index % 7;
      const x = 0.55 + column * 9.65;
      const y = 1.55 + row * 1.48;
      const reference = referenceByConcept.get(concept) || { id: `CVR_${concept.toUpperCase()}`, concept, label: fallbackLabels[concept] };
      const group = append(documentObject, svg, "g", { "data-canonical-ref": reference.id, "data-concept": concept });
      append(documentObject, group, "rect", { x, y: y - 0.55, width: 9.1, height: 1.16, rx: 0.1, fill: "none", stroke: "#d9ded8", "stroke-width": 0.025 });
      const iconStart = x + 0.55;
      const iconEnd = x + 3.0;
      const iconCenter = x + 1.15;
      const entity = (kind, label, position, id) => addEntity(documentObject, group, { id: id || `${concept}_${index}`, kind, label: label || "", position }, grammar, null);
      const simplePath = (kind, segments) => addPath(documentObject, group, { id: `${concept}_${index}`, kind, segments }, "legend", grammar, null, "clean", "segments", rowGeometry);

      if (concept === "attacker") entity("attacker", "", [iconCenter, y]);
      else if (concept === "attacker_with_ball") {
        entity("attacker", "", [iconCenter, y], `attacker_ball_${index}`);
        addBall(documentObject, group, { ball_ref: "B", holder_ref: "A", position: [iconCenter + grammar.entities.ball.offset, y], visibility: "initial" }, grammar);
      } else if (concept === "defender") entity("defender", "", [iconCenter, y]);
      else if (["movement_without_ball", "pass", "pass_feint", "shot", "shot_feint", "dribble"].includes(concept)) {
        const kind = concept === "movement_without_ball" ? "movement_without_ball" : concept;
        simplePath(kind, [{ type: "line", start: [iconStart, y], end: [iconEnd, y] }]);
      } else if (concept === "feint") {
        simplePath("feint", [
          { type: "line", start: [iconStart, y + 0.35], end: [x + 1.45, y - 0.3] },
          { type: "line", start: [x + 1.45, y - 0.3], end: [x + 1.75, y + 0.18] },
          { type: "line", start: [x + 1.75, y + 0.18], end: [iconEnd, y - 0.28] }
        ]);
      } else if (concept === "block_screen") {
        entity("attacker", "", [x + 0.85, y]);
        simplePath("block", [{ type: "line", start: [x + 1.3, y], end: [iconEnd, y] }]);
      } else if (concept === "defensive_block") {
        entity("defender", "", [x + 0.85, y]);
        simplePath("defensive_block", [{ type: "line", start: [x + 1.3, y], end: [iconEnd, y] }]);
      } else if (["future_position", "past_position"].includes(concept)) {
        const participant = { id: `TEMP_${index}`, kind: concept === "past_position" ? "defender" : "attacker", label: "", position: [iconEnd, y] };
        const temporalGeometry = { entities: [participant] };
        addTemporalState(documentObject, group, { id: `STATE_${index}`, participant_ref: participant.id, position: [iconEnd, y], status: concept === "past_position" ? "past" : "future" }, temporalGeometry, grammar, null, "clean");
        simplePath("movement_without_ball", [{ type: "line", start: [iconStart, y], end: [iconEnd - 0.45, y] }]);
      }
      const label = append(documentObject, group, "text", { x: x + 3.45, y: y + 0.1, fill: "#17241f", "font-size": grammar.labels.legend_size || 0.34, "font-weight": 720 });
      label.textContent = reference.label || fallbackLabels[concept];
    });

    const extensionTitle = append(documentObject, svg, "text", { x: 0.65, y: 12.45, fill: "#526056", "font-size": 0.29, "font-weight": 800 });
    extensionTitle.textContent = "Extensions TRAÇA — no atribuïdes a LEG-COACH-001";
    [["goalkeeper", "Porter"], ["cone", "Con"], ["bench", "Banc"], ["cylinder", "Cilindre"]].forEach(([kind, label], index) => {
      const x = 1.1 + index * 4.75;
      entityExtension(documentObject, svg, grammar, kind, label, x, 13.55, addEntity);
    });
    return svg;
  }

  function entityExtension(documentObject, svg, grammar, kind, label, x, y, addEntityFunction) {
    const group = append(documentObject, svg, "g", { "data-extension": kind });
    addEntityFunction(documentObject, group, { id: `EXT_${kind}`, kind, label: "", position: [x, y] }, grammar, null);
    const text = append(documentObject, group, "text", { x: x + 0.55, y: y + 0.1, fill: "#526056", "font-size": 0.3, "font-weight": 700 });
    text.textContent = label;
  }

  function serializeSvg(svg) {
    if (!svg) throw new Error("SVG_EXPORT_MISSING");
    if (typeof svg.setAttribute === "function" && !svg.getAttribute?.("xmlns")) svg.setAttribute("xmlns", SVG_NS);
    if (typeof XMLSerializer !== "undefined") return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}\n`;
    if (typeof svg.serialize === "function") return `<?xml version="1.0" encoding="UTF-8"?>\n${svg.serialize()}\n`;
    throw new Error("SVG_SERIALIZER_UNAVAILABLE");
  }

  function downloadBlob(blob, filename, documentObject) {
    const targetDocument = documentObject || document;
    const url = URL.createObjectURL(blob);
    const anchor = targetDocument.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadSvg(svg, filename, documentObject) {
    downloadBlob(new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" }), filename, documentObject);
  }

  function pngBlob(svg, options) {
    const configuration = options || {};
    const documentObject = svg.ownerDocument;
    if (!documentObject || typeof documentObject.createElement !== "function" || typeof Image === "undefined") return Promise.reject(new Error("PNG_EXPORT_BROWSER_REQUIRED"));
    const viewBox = (svg.getAttribute("viewBox") || "0 0 20 20").split(/\s+/).map(Number);
    const width = configuration.width || configuration.editor_width_px || 1200;
    const height = configuration.height || Math.round(width * viewBox[3] / viewBox[2]);
    const ratio = configuration.pixelRatio || configuration.pixel_ratio || 2;
    const canvas = documentObject.createElement("canvas");
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.fillStyle = configuration.background || "#ffffff";
    context.fillRect(0, 0, width, height);
    const source = new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(source);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG_EXPORT_FAILED")), "image/png");
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("PNG_EXPORT_SVG_LOAD_FAILED")); };
      image.src = url;
    });
  }

  async function downloadPng(svg, filename, options, documentObject) {
    const blob = await pngBlob(svg, options);
    downloadBlob(blob, filename, documentObject || svg.ownerDocument);
  }

  return { pathData, wavyPathData, pathForDisplay: visiblePath, selectedAlternatives, render, renderSymbolSheet, serializeSvg, pngBlob, downloadSvg, downloadPng };
});
