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
      ball: { shape: "circle", fill: "#f05d32", stroke: "#762711", text: "#ffffff", radius: 0.12 },
      cone: { shape: "triangle", fill: "#ef763e", stroke: "#8a3316", text: "#ffffff", radius: 0.28 },
      bench: { shape: "rect", fill: "#8b6f54", stroke: "#4f3826", text: "#ffffff", radius: 0.38 },
      cylinder: { shape: "rect", fill: "#e84b52", stroke: "#7d2026", text: "#ffffff", radius: 0.3 }
    },
    paths: {
      movement: { stroke: "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "polyline" },
      movement_without_ball: { stroke: "#173f33", width: 0.11, dash: null, marker: "arrow", path_mode: "polyline" },
      pass: { stroke: "#d55832", width: 0.09, dash: "0.28 0.2", marker: "arrow", path_mode: "polyline" },
      shot: { stroke: "#b3232b", width: 0.13, dash: null, marker: "arrow", path_mode: "polyline" },
      feint: { stroke: "#173f33", width: 0.13, dash: null, marker: "arrow", path_mode: "polyline", preserve_vertices: true },
      future_position: { stroke: "#6f7d78", width: 0.08, dash: "0.18 0.16", marker: null, path_mode: "polyline" }
    },
    overlays: {
      spatial_zone: { fill: "#eff7f2", opacity: 0.52, stroke: "#4b7c6c", dash: "0.2 0.13" },
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
      future_position: "future_position"
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
