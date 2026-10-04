(function (root, factory) {
  const documentValue = factory();
  if (typeof module === "object" && module.exports) module.exports = documentValue;
  root.TRACA_VISUAL_STYLE = documentValue;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
  "meta": {
    "id": "TRACA_visual_style",
    "version": "0.1.0",
    "status": "provisional_visual_policy",
    "units": "court_meters",
    "source_refs": [
      "coach_attachment:AEB796E5-F49A-4466-A62E-79AA36F44AD4.png"
    ]
  },
  "court": {
    "page_background": "#ffffff",
    "floor": "#fbfaf7",
    "floor_detail": "#dedbd2",
    "line": "#aeb8b0",
    "goal_area_fill": "#eef3ef",
    "goal": "#a7433f",
    "goal_fill": "#ffffff",
    "line_width": 0.075,
    "goal_width": 0.11,
    "floor_detail_width": 0.02,
    "floor_detail_opacity": 0.45
  },
  "entities": {
    "participant_radius": 0.34,
    "passer_radius": 0.31,
    "ball_radius": 0.12,
    "ball_offset": 0.46,
    "material_radius": 0.34,
    "outline_width": 0.055,
    "material_outline_width": 0.045
  },
  "paths": {
    "movement_width": 0.11,
    "pass_width": 0.09,
    "shot_width": 0.17,
    "shot_gap_width": 0.06,
    "feint_width": 0.13,
    "generic_width": 0.1,
    "pass_dash": "0.28 0.20",
    "generic_dash": "0.16 0.12",
    "wave_amplitude": 0.095,
    "wave_frequency": 0.72
  },
  "marks": {
    "cancellation_half_length": 0.18,
    "cancellation_width": 0.08,
    "terminal_half_length": 0.23,
    "terminal_width": 0.09
  },
  "states": {
    "dash": "0.12 0.10",
    "stroke_opacity": 0.72,
    "stroke_width": 0.065
  },
  "labels": {
    "participant_size": 0.31,
    "material_size": 0.31,
    "context_size": 0.28,
    "legend_size": 0.34,
    "weight": 800,
    "offset_y": 0.11
  },
  "arrows": {
    "view_box": "0 0 10 10",
    "ref_x": 9,
    "ref_y": 5,
    "width": 5,
    "height": 5
  },
  "layers": [
    "court",
    "control_overlays",
    "paths",
    "temporal_states",
    "contextual_references",
    "entities",
    "balls",
    "labels"
  ],
  "export": {
    "editor_width_px": 1280,
    "card_width_px": 720,
    "card_height_px": 510,
    "pixel_ratio": 2,
    "background": "#ffffff"
  }
};
});
