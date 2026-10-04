(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const dictionary = isNode ? require("../data/visual-functional-dictionary.js") : root.TRACA_VISUAL_FUNCTIONAL_DICTIONARY;
  const style = isNode ? require("../data/visual-style.js") : root.TRACA_VISUAL_STYLE;
  const api = factory(utils, dictionary, style);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_VISUAL_GRAMMAR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, defaultDictionary, defaultStyle) {
  "use strict";

  const OPERATIONAL_AUTHORITIES = new Set(["coach_validated", "graphic_legend", "canonical_validated", "semantic_validated", "spatial_validated"]);

  function entry(dictionary, concept) {
    const evidence = new Set(((dictionary && dictionary.evidence) || []).map((item) => item.id));
    return ((dictionary && dictionary.entries) || []).find((item) => item.concept === concept
      && item.status === "validated"
      && OPERATIONAL_AUTHORITIES.has(item.authority)
      && (item.evidence_refs || []).length
      && item.evidence_refs.every((ref) => evidence.has(ref)));
  }

  function createVisualGrammar(dictionaryInput, options) {
    const dictionary = dictionaryInput || defaultDictionary || { meta: {}, theme: { colors: {} }, entries: [] };
    const policy = options && options.style || defaultStyle || {};
    const mode = options && options.mode || "color";
    const baseColors = dictionary.theme && dictionary.theme.colors || {};
    const colors = mode === "monochrome" ? {
      attacker: { fill: "#ffffff", stroke: "#111111", text: "#111111" },
      defender: { fill: "#ffffff", stroke: "#111111", text: "#111111" },
      movement: "#111111", pass: "#111111", shot: "#111111"
    } : baseColors;
    const entityPolicy = policy.entities || {};
    const pathPolicy = policy.paths || {};
    const statePolicy = policy.states || {};
    const labelPolicy = policy.labels || {};
    const attackerColor = colors.attacker || { fill: "#2f70c9", stroke: "#123e79", text: "#ffffff" };
    const defenderColor = colors.defender || { fill: "#ef5b55", stroke: "#8f2624", text: "#ffffff" };
    const attackerShape = entry(dictionary, "attacker") && entry(dictionary, "attacker").visual.shape || "circle";
    const defenderShape = entry(dictionary, "defender") && entry(dictionary, "defender").visual.shape || "triangle";
    const passLine = entry(dictionary, "pass") && entry(dictionary, "pass").visual.line;
    const shotLine = entry(dictionary, "shot") && entry(dictionary, "shot").visual.line;
    const dribbleLine = entry(dictionary, "dribble") && entry(dictionary, "dribble").visual.line;
    const temporalVisual = entry(dictionary, "participant_temporal_state") && entry(dictionary, "participant_temporal_state").visual || {};
    const participantRadius = entityPolicy.participant_radius || 0.34;
    const movementColor = colors.movement || "#173f33";
    const passColor = colors.pass || "#d55832";
    const shotColor = colors.shot || "#a51f28";
    return {
    meta: {
      id: "traca_visual_grammar", version: "0.5.0", status: "dictionary_projection",
      source_dictionary: dictionary.meta && dictionary.meta.id, source_version: dictionary.meta && dictionary.meta.version,
      visual_policy_ref: policy.meta && `${policy.meta.id}@${policy.meta.version}` || null,
      visual_policy_status: policy.meta && policy.meta.status || "provisional_visual_policy",
      mode
    },
    court: mode === "monochrome" ? {
      page_background: "#ffffff", floor: "#ffffff", floor_detail: "#e5e5e5", line: "#777777",
      goal_area_fill: "#f5f5f5", goal: "#111111", goal_fill: "#ffffff",
      line_width: policy.court && policy.court.line_width || 0.075,
      goal_width: policy.court && policy.court.goal_width || 0.11,
      floor_detail_width: policy.court && policy.court.floor_detail_width || 0.02,
      floor_detail_opacity: policy.court && policy.court.floor_detail_opacity || 0.45
    } : utils.deepClone(policy.court || {}),
    entities: {
      attacker: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: participantRadius },
      defender: { shape: defenderShape, fill: defenderColor.fill, stroke: defenderColor.stroke, text: defenderColor.text, radius: participantRadius },
      passer: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: entityPolicy.passer_radius || 0.31 },
      pivot: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: participantRadius },
      goalkeeper: { shape: "circle", fill: mode === "monochrome" ? "#ffffff" : "#52a66f", stroke: mode === "monochrome" ? "#111111" : "#1f6138", text: mode === "monochrome" ? "#111111" : "#ffffff", radius: participantRadius, extension: true },
      generic_participant: { shape: attackerShape, fill: mode === "monochrome" ? "#ffffff" : "#aab5b0", stroke: mode === "monochrome" ? "#111111" : "#53635d", text: mode === "monochrome" ? "#111111" : "#17241f", radius: participantRadius },
      ball: { shape: "circle", fill: mode === "monochrome" ? "#111111" : "#f05d32", stroke: mode === "monochrome" ? "#111111" : "#762711", text: "#ffffff", radius: entityPolicy.ball_radius || 0.12, offset: entityPolicy.ball_offset || 0.46 },
      cone: { shape: "triangle", fill: mode === "monochrome" ? "#ffffff" : "#ef763e", stroke: mode === "monochrome" ? "#111111" : "#8a3316", text: mode === "monochrome" ? "#111111" : "#ffffff", radius: 0.28 },
      bench: { shape: "rect", fill: mode === "monochrome" ? "#ffffff" : "#8b6f54", stroke: mode === "monochrome" ? "#111111" : "#4f3826", text: mode === "monochrome" ? "#111111" : "#ffffff", radius: 0.38 },
      cylinder: { shape: "rect", fill: mode === "monochrome" ? "#ffffff" : "#e84b52", stroke: mode === "monochrome" ? "#111111" : "#7d2026", text: mode === "monochrome" ? "#111111" : "#ffffff", radius: 0.3 },
      generic_material: { shape: "rect", fill: mode === "monochrome" ? "#ffffff" : "#c4b7a6", stroke: mode === "monochrome" ? "#111111" : "#695b4b", text: mode === "monochrome" ? "#111111" : "#17241f", radius: entityPolicy.material_radius || 0.34 },
      text: { shape: "text", fill: "transparent", stroke: "transparent", text: "#17241f", radius: 0.1 }
    },
    paths: {
      movement: { stroke: movementColor, width: pathPolicy.movement_width || 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "continuous" },
      movement_without_ball: { stroke: movementColor, width: pathPolicy.movement_width || 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "continuous" },
      dribble: { stroke: movementColor, width: pathPolicy.movement_width || 0.11, dash: null, marker: "arrow", path_mode: "wavy_segments", line: dribbleLine || "wavy" },
      pass: { stroke: passColor, width: pathPolicy.pass_width || 0.09, dash: passLine === "dashed" ? pathPolicy.pass_dash || "0.28 0.2" : null, marker: "arrow", path_mode: "geometry_segments", line: passLine || "dashed" },
      pass_feint: { stroke: passColor, width: pathPolicy.pass_width || 0.09, dash: pathPolicy.pass_dash || "0.28 0.2", marker: "arrow", path_mode: "geometry_segments", line: "dashed", cancellation_mark: true },
      shot: { stroke: shotColor, width: pathPolicy.shot_width || 0.17, gap_width: pathPolicy.shot_gap_width || 0.06, dash: null, marker: "arrow", path_mode: "geometry_segments", line: shotLine || "double_stroke", render_mode: "double_stroke" },
      shot_feint: { stroke: shotColor, width: pathPolicy.shot_width || 0.17, gap_width: pathPolicy.shot_gap_width || 0.06, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "double_stroke", render_mode: "double_stroke", cancellation_mark: true },
      feint: { stroke: movementColor, width: pathPolicy.feint_width || 0.13, dash: null, marker: "arrow", path_mode: "functional_segments", preserve_vertices: true },
      block: { stroke: movementColor, width: pathPolicy.movement_width || 0.11, dash: null, marker: null, path_mode: "geometry_segments", terminal_mark: true },
      defensive_block: { stroke: defenderColor.stroke, width: pathPolicy.movement_width || 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", terminal_mark: true },
      future_position: { stroke: "#6f7d78", width: 0.08, dash: "0.18 0.16", marker: null, path_mode: "polyline" },
      generic_action: { stroke: mode === "monochrome" ? "#111111" : "#6f4e82", width: pathPolicy.generic_width || 0.1, dash: pathPolicy.generic_dash || "0.16 0.12", marker: "arrow", path_mode: "polyline" }
    },
    states: {
      future: { fill: temporalVisual.fill || "none", outline: temporalVisual.outline || "dashed", dash: temporalVisual.outline === "dashed" ? statePolicy.dash || "0.12 0.1" : null, stroke_opacity: statePolicy.stroke_opacity || 0.72, stroke_width: statePolicy.stroke_width || 0.065 },
      past: { fill: temporalVisual.fill || "none", outline: temporalVisual.outline || "dashed", dash: temporalVisual.outline === "dashed" ? statePolicy.dash || "0.12 0.1" : null, stroke_opacity: statePolicy.stroke_opacity || 0.72, stroke_width: statePolicy.stroke_width || 0.065 }
    },
    marks: utils.deepClone(policy.marks || {}),
    labels: { participant_size: labelPolicy.participant_size || 0.31, material_size: labelPolicy.material_size || 0.31, context_size: labelPolicy.context_size || 0.28, legend_size: labelPolicy.legend_size || 0.34, weight: labelPolicy.weight || 800, offset_y: labelPolicy.offset_y || 0.11 },
    arrows: utils.deepClone(policy.arrows || {}),
    layers: utils.deepClone(policy.layers || []),
    export: utils.deepClone(policy.export || {}),
    wave: { amplitude: pathPolicy.wave_amplitude || 0.095, frequency: pathPolicy.wave_frequency || 0.72 },
    overlays: {
      spatial_zone: { fill: "none", opacity: 0, stroke: "#4b7c6c", dash: "0.14 0.18" },
      finishing_zone: { fill: "#fbe9df", opacity: 0.62, stroke: "#d06a3a", dash: null },
      defensive_reference: { stroke: "#2668bd", width: 0.06, dash: "0.18 0.14" },
      contextual_delimiter: { stroke: defenderColor.stroke, dash: "0.12 0.1", text: "#5d4039" }
    },
    aliases: {
      initial_pass: "pass",
      return_pass: "pass",
      run_without_ball: "movement_without_ball",
      continuation: "movement",
      dribble: "dribble",
      pass_feint: "pass_feint",
      shot_feint: "shot_feint",
      block: "block",
      defensive_block: "defensive_block",
      feint: "feint",
      shot: "shot",
      future_position: "future_position",
      past_position: "future_position",
      generic_action: "generic_action"
    }
    };
  }

  function primitiveForPath(kind, candidate) {
    const source = candidate || createVisualGrammar();
    return source.aliases[kind] || kind;
  }

  return { OPERATIONAL_AUTHORITIES, createVisualGrammar, primitiveForPath, entry };
});
