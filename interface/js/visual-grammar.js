(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const utils = isNode ? require("./utils.js") : root.TRACA_UTILS;
  const dictionary = isNode ? require("../data/visual-functional-dictionary.js") : root.TRACA_VISUAL_FUNCTIONAL_DICTIONARY;
  const api = factory(utils, dictionary);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_VISUAL_GRAMMAR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, defaultDictionary) {
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

  function createVisualGrammar(dictionaryInput) {
    const dictionary = dictionaryInput || defaultDictionary || { meta: {}, theme: { colors: {} }, entries: [] };
    const colors = dictionary.theme && dictionary.theme.colors || {};
    const attackerColor = colors.attacker || { fill: "#2f70c9", stroke: "#123e79", text: "#ffffff" };
    const defenderColor = colors.defender || { fill: "#ef5b55", stroke: "#8f2624", text: "#ffffff" };
    const attackerShape = entry(dictionary, "attacker") && entry(dictionary, "attacker").visual.shape || "circle";
    const defenderShape = entry(dictionary, "defender") && entry(dictionary, "defender").visual.shape || "triangle";
    const passLine = entry(dictionary, "pass") && entry(dictionary, "pass").visual.line;
    const shotLine = entry(dictionary, "shot") && entry(dictionary, "shot").visual.line;
    const dribbleLine = entry(dictionary, "dribble") && entry(dictionary, "dribble").visual.line;
    const temporalVisual = entry(dictionary, "participant_temporal_state") && entry(dictionary, "participant_temporal_state").visual || {};
    return {
    meta: { id: "traca_visual_grammar", version: "0.4.0", status: "dictionary_projection", source_dictionary: dictionary.meta && dictionary.meta.id, source_version: dictionary.meta && dictionary.meta.version },
    entities: {
      attacker: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: 0.34 },
      defender: { shape: defenderShape, fill: defenderColor.fill, stroke: defenderColor.stroke, text: defenderColor.text, radius: 0.34 },
      passer: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: 0.31 },
      pivot: { shape: attackerShape, fill: attackerColor.fill, stroke: attackerColor.stroke, text: attackerColor.text, radius: 0.34 },
      goalkeeper: { shape: "circle", fill: "#52a66f", stroke: "#1f6138", text: "#ffffff", radius: 0.34 },
      generic_participant: { shape: attackerShape, fill: "#aab5b0", stroke: "#53635d", text: "#17241f", radius: 0.34 },
      ball: { shape: "circle", fill: "#f05d32", stroke: "#762711", text: "#ffffff", radius: 0.12 },
      cone: { shape: "triangle", fill: "#ef763e", stroke: "#8a3316", text: "#ffffff", radius: 0.28 },
      bench: { shape: "rect", fill: "#8b6f54", stroke: "#4f3826", text: "#ffffff", radius: 0.38 },
      cylinder: { shape: "rect", fill: "#e84b52", stroke: "#7d2026", text: "#ffffff", radius: 0.3 },
      generic_material: { shape: "rect", fill: "#c4b7a6", stroke: "#695b4b", text: "#17241f", radius: 0.34 },
      text: { shape: "text", fill: "transparent", stroke: "transparent", text: "#17241f", radius: 0.1 }
    },
    paths: {
      movement: { stroke: colors.movement || "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "continuous" },
      movement_without_ball: { stroke: colors.movement || "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "continuous" },
      dribble: { stroke: colors.movement || "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "wavy_segments", line: dribbleLine || "wavy" },
      pass: { stroke: colors.pass || "#d55832", width: 0.09, dash: passLine === "dashed" ? "0.28 0.2" : null, marker: "arrow", path_mode: "geometry_segments", line: passLine || "dashed" },
      pass_feint: { stroke: colors.pass || "#d55832", width: 0.09, dash: "0.28 0.2", marker: "arrow", path_mode: "geometry_segments", line: "dashed", cancellation_mark: true },
      shot: { stroke: colors.shot || "#a51f28", width: 0.17, dash: null, marker: "arrow", path_mode: "geometry_segments", line: shotLine || "double_stroke", render_mode: "double_stroke" },
      shot_feint: { stroke: colors.shot || "#a51f28", width: 0.17, dash: null, marker: "arrow", path_mode: "geometry_segments", line: "double_stroke", render_mode: "double_stroke", cancellation_mark: true },
      feint: { stroke: "#173f33", width: 0.13, dash: null, marker: "arrow", path_mode: "functional_segments", preserve_vertices: true },
      block: { stroke: "#173f33", width: 0.11, dash: null, marker: null, path_mode: "geometry_segments", terminal_mark: true },
      defensive_block: { stroke: defenderColor.stroke, width: 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments", terminal_mark: true },
      future_position: { stroke: "#6f7d78", width: 0.08, dash: "0.18 0.16", marker: null, path_mode: "polyline" },
      generic_action: { stroke: "#6f4e82", width: 0.1, dash: "0.16 0.12", marker: "arrow", path_mode: "polyline" }
    },
    states: {
      future: { fill: temporalVisual.fill || "none", outline: temporalVisual.outline || "dashed", dash: temporalVisual.outline === "dashed" ? "0.12 0.1" : null, stroke_opacity: 0.72, stroke_width: 0.065 }
    },
    overlays: {
      spatial_zone: { fill: "none", opacity: 0, stroke: "#4b7c6c", dash: "0.14 0.18" },
      finishing_zone: { fill: "#fbe9df", opacity: 0.62, stroke: "#d06a3a", dash: null },
      defensive_reference: { stroke: "#2668bd", width: 0.06, dash: "0.18 0.14" }
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
