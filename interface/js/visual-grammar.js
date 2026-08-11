(function (root, factory) {
  const utils = typeof module === "object" && module.exports ? require("./utils.js") : root.TRACA_UTILS;
  const api = factory(utils);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_VISUAL_GRAMMAR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  const grammar = {
    meta: { id: "traca_visual_grammar", version: "0.2.0", status: "mvp_candidate" },
    entities: {
      attacker: { shape: "circle", fill: "#f7a53a", stroke: "#713c0a", text: "#24160a", radius: 0.34 },
      defender: { shape: "circle", fill: "#2668bd", stroke: "#123e79", text: "#ffffff", radius: 0.34 },
      passer: { shape: "circle", fill: "#eef3f0", stroke: "#24483d", text: "#173f33", radius: 0.31 },
      pivot: { shape: "circle", fill: "#a45ddb", stroke: "#593078", text: "#ffffff", radius: 0.34 },
      goalkeeper: { shape: "circle", fill: "#52a66f", stroke: "#1f6138", text: "#ffffff", radius: 0.34 },
      generic_participant: { shape: "circle", fill: "#aab5b0", stroke: "#53635d", text: "#17241f", radius: 0.34 },
      ball: { shape: "circle", fill: "#f05d32", stroke: "#762711", text: "#ffffff", radius: 0.12 },
      cone: { shape: "triangle", fill: "#ef763e", stroke: "#8a3316", text: "#ffffff", radius: 0.28 },
      bench: { shape: "rect", fill: "#8b6f54", stroke: "#4f3826", text: "#ffffff", radius: 0.38 },
      cylinder: { shape: "rect", fill: "#e84b52", stroke: "#7d2026", text: "#ffffff", radius: 0.3 },
      generic_material: { shape: "rect", fill: "#c4b7a6", stroke: "#695b4b", text: "#17241f", radius: 0.34 },
      text: { shape: "text", fill: "transparent", stroke: "transparent", text: "#17241f", radius: 0.1 }
    },
    paths: {
      movement: { stroke: "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments" },
      movement_without_ball: { stroke: "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "geometry_segments" },
      pass: { stroke: "#d55832", width: 0.09, dash: "0.28 0.2", marker: "arrow", path_mode: "geometry_segments" },
      shot: { stroke: "#b3232b", width: 0.13, dash: null, marker: "arrow", path_mode: "geometry_segments" },
      feint: { stroke: "#173f33", width: 0.13, dash: null, marker: "arrow", path_mode: "functional_segments", preserve_vertices: true },
      future_position: { stroke: "#6f7d78", width: 0.08, dash: "0.18 0.16", marker: null, path_mode: "polyline" },
      generic_action: { stroke: "#6f4e82", width: 0.1, dash: "0.16 0.12", marker: "arrow", path_mode: "polyline" }
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
      feint: "feint",
      shot: "shot",
      future_position: "future_position",
      generic_action: "generic_action"
    }
  };

  function createVisualGrammar() {
    return utils.deepClone(grammar);
  }

  function primitiveForPath(kind, candidate) {
    const source = candidate || grammar;
    return source.aliases[kind] || kind;
  }

  return { createVisualGrammar, primitiveForPath };
});
