window.TRACA_UVOF015_GEOMETRY = {
  "$schema": "../../schema/traca.geometry.schema.v0.2.json",
  "meta": {
    "format": "TRACA_geometria_derivada",
    "version": "0.2.0",
    "exercise_id": "TR-UVOF-015",
    "status": "derived_from_ready_contract",
    "source_spatial_ref": "exercises/TR-UVOF-015/spatial-relations.json",
    "source_spatial_digest": "sha256:9717a4dc2b1c532f4b74aca97d0ca15aefcbbd21daa1df4a6caf22f6ca4e717d",
    "court_profile_ref": "config/handball-court.ihf-2025.json",
    "court_profile_digest": "86a26b089ec1a92080ae93b855dce519eb6f7900bc371c8e2e348c3a8ac4a35a"
  },
  "court": {
    "width_m": 20.0,
    "half_length_m": 20.0,
    "goal": {
      "width_m": 3.0,
      "height_m": 2.0,
      "post_width_m": 0.08
    },
    "markings": {
      "goal_area_radius_m": 6.0,
      "goal_area_straight_m": 3.0,
      "free_throw_distance_m": 9.0,
      "free_throw_segment_m": 0.15,
      "free_throw_gap_m": 0.15,
      "penalty_line_distance_m": 7.0,
      "penalty_line_length_m": 1.0,
      "goalkeeper_line_distance_m": 4.0,
      "goalkeeper_line_length_m": 0.15,
      "throw_off_diameter_m": 4.0
    },
    "view_box": [
      -0.8,
      -1.0,
      21.6,
      21.8
    ]
  },
  "layout_policy": {
    "id": "uvof015_three_zones_v0.2",
    "status": "provisional_render_policy",
    "coordinate_system": "metres_origin_goal_line_left",
    "attack_direction": "negative_y",
    "notes": [
      "Les amplades de les tres zones són una política visual simètrica, no coneixement tàctic.",
      "Cap alternativa decisional se selecciona al JSON; la interfície només en previsualitza una per duel.",
      "Les posicions es deriven després d'un preflight ready i no modifiquen la font espacial.",
      "Els espais tàctics són relacions internes ocultes; només els límits físics poden aparèixer en control.",
      "Les corbes i els canvis de direcció provenen de segments funcionals resolts, no del renderer."
    ]
  },
  "zones": [
    {
      "id": "Z_ESQ",
      "kind": "physical_task_boundary",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/0",
      "polygon": [
        [
          1.25,
          5.15
        ],
        [
          7.1,
          5.15
        ],
        [
          7.1,
          15.25
        ],
        [
          1.25,
          15.25
        ]
      ],
      "limit_refs": [
        "LIM_0",
        "LIM_1"
      ],
      "defender_ref": "D_ESQ",
      "defensive_line": [
        [
          1.6,
          7.6
        ],
        [
          6.75,
          7.6
        ]
      ],
      "render_policy": "control_only"
    },
    {
      "id": "Z_CE",
      "kind": "physical_task_boundary",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/1",
      "polygon": [
        [
          7.1,
          5.15
        ],
        [
          12.9,
          5.15
        ],
        [
          12.9,
          15.25
        ],
        [
          7.1,
          15.25
        ]
      ],
      "limit_refs": [
        "LIM_1",
        "LIM_2"
      ],
      "defender_ref": "D_CE",
      "defensive_line": [
        [
          7.45,
          7.6
        ],
        [
          12.55,
          7.6
        ]
      ],
      "render_policy": "control_only"
    },
    {
      "id": "Z_DRE",
      "kind": "physical_task_boundary",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/2",
      "polygon": [
        [
          12.9,
          5.15
        ],
        [
          18.75,
          5.15
        ],
        [
          18.75,
          15.25
        ],
        [
          12.9,
          15.25
        ]
      ],
      "limit_refs": [
        "LIM_2",
        "LIM_3"
      ],
      "defender_ref": "D_DRE",
      "defensive_line": [
        [
          13.25,
          7.6
        ],
        [
          18.4,
          7.6
        ]
      ],
      "render_policy": "control_only"
    }
  ],
  "spaces": [
    {
      "id": "E_ESQ_A",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/3",
      "zone_ref": "Z_ESQ",
      "defender_ref": "D_ESQ",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "LIM_0",
          "D_ESQ"
        ]
      },
      "anchor": [
        2.712,
        8.25
      ],
      "calculation_region": [
        [
          1.33,
          5.45
        ],
        [
          4.095,
          5.45
        ],
        [
          4.095,
          11.05
        ],
        [
          1.33,
          11.05
        ]
      ],
      "render_policy": "hidden"
    },
    {
      "id": "E_ESQ_B",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/4",
      "zone_ref": "Z_ESQ",
      "defender_ref": "D_ESQ",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "D_ESQ",
          "LIM_1"
        ]
      },
      "anchor": [
        5.637,
        8.25
      ],
      "calculation_region": [
        [
          4.255,
          5.45
        ],
        [
          7.02,
          5.45
        ],
        [
          7.02,
          11.05
        ],
        [
          4.255,
          11.05
        ]
      ],
      "render_policy": "hidden"
    },
    {
      "id": "E_CE_A",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/5",
      "zone_ref": "Z_CE",
      "defender_ref": "D_CE",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "LIM_1",
          "D_CE"
        ]
      },
      "anchor": [
        8.55,
        8.25
      ],
      "calculation_region": [
        [
          7.18,
          5.45
        ],
        [
          9.92,
          5.45
        ],
        [
          9.92,
          11.05
        ],
        [
          7.18,
          11.05
        ]
      ],
      "render_policy": "hidden"
    },
    {
      "id": "E_CE_B",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/6",
      "zone_ref": "Z_CE",
      "defender_ref": "D_CE",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "D_CE",
          "LIM_2"
        ]
      },
      "anchor": [
        11.45,
        8.25
      ],
      "calculation_region": [
        [
          10.08,
          5.45
        ],
        [
          12.82,
          5.45
        ],
        [
          12.82,
          11.05
        ],
        [
          10.08,
          11.05
        ]
      ],
      "render_policy": "hidden"
    },
    {
      "id": "E_DRE_A",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/7",
      "zone_ref": "Z_DRE",
      "defender_ref": "D_DRE",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "LIM_2",
          "D_DRE"
        ]
      },
      "anchor": [
        14.363,
        8.25
      ],
      "calculation_region": [
        [
          12.98,
          5.45
        ],
        [
          15.745,
          5.45
        ],
        [
          15.745,
          11.05
        ],
        [
          12.98,
          11.05
        ]
      ],
      "render_policy": "hidden"
    },
    {
      "id": "E_DRE_B",
      "kind": "relational_tactical_space",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/8",
      "zone_ref": "Z_DRE",
      "defender_ref": "D_DRE",
      "relation": {
        "type": "between",
        "delimiter_refs": [
          "D_DRE",
          "LIM_3"
        ]
      },
      "anchor": [
        17.288,
        8.25
      ],
      "calculation_region": [
        [
          15.905,
          5.45
        ],
        [
          18.67,
          5.45
        ],
        [
          18.67,
          11.05
        ],
        [
          15.905,
          11.05
        ]
      ],
      "render_policy": "hidden"
    }
  ],
  "entities": [
    {
      "id": "LIM_0",
      "kind": "cone",
      "label": "",
      "position": [
        1.25,
        10.15
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/9",
      "status": "derived"
    },
    {
      "id": "LIM_1",
      "kind": "cone",
      "label": "",
      "position": [
        7.1,
        10.15
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/10",
      "status": "derived"
    },
    {
      "id": "LIM_2",
      "kind": "cone",
      "label": "",
      "position": [
        12.9,
        10.15
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/11",
      "status": "derived"
    },
    {
      "id": "LIM_3",
      "kind": "cone",
      "label": "",
      "position": [
        18.75,
        10.15
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/12",
      "status": "derived"
    },
    {
      "id": "A_ESQ",
      "kind": "attacker",
      "label": "A",
      "position": [
        4.175,
        14.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0",
      "status": "derived",
      "state_ref": "STATE_ESQ_A_CURRENT"
    },
    {
      "id": "P_ESQ",
      "kind": "passer",
      "label": "P",
      "position": [
        4.175,
        17.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6",
      "status": "derived",
      "state_ref": "STATE_ESQ_P_CURRENT"
    },
    {
      "id": "D_ESQ",
      "kind": "defender",
      "label": "D",
      "position": [
        4.175,
        7.6
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/3",
      "status": "derived",
      "state_ref": "STATE_ESQ_D_CURRENT"
    },
    {
      "id": "B_ESQ",
      "kind": "ball",
      "label": "",
      "position": [
        4.515,
        13.98
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/13",
      "status": "derived"
    },
    {
      "id": "A_CE",
      "kind": "attacker",
      "label": "A",
      "position": [
        10.0,
        14.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1",
      "status": "derived",
      "state_ref": "STATE_CE_A_CURRENT"
    },
    {
      "id": "P_CE",
      "kind": "passer",
      "label": "P",
      "position": [
        10.0,
        17.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7",
      "status": "derived",
      "state_ref": "STATE_CE_P_CURRENT"
    },
    {
      "id": "D_CE",
      "kind": "defender",
      "label": "D",
      "position": [
        10.0,
        7.6
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/4",
      "status": "derived",
      "state_ref": "STATE_CE_D_CURRENT"
    },
    {
      "id": "B_CE",
      "kind": "ball",
      "label": "",
      "position": [
        10.34,
        13.98
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/14",
      "status": "derived"
    },
    {
      "id": "A_DRE",
      "kind": "attacker",
      "label": "A",
      "position": [
        15.825,
        14.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2",
      "status": "derived",
      "state_ref": "STATE_DRE_A_CURRENT"
    },
    {
      "id": "P_DRE",
      "kind": "passer",
      "label": "P",
      "position": [
        15.825,
        17.1
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8",
      "status": "derived",
      "state_ref": "STATE_DRE_P_CURRENT"
    },
    {
      "id": "D_DRE",
      "kind": "defender",
      "label": "D",
      "position": [
        15.825,
        7.6
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/5",
      "status": "derived",
      "state_ref": "STATE_DRE_D_CURRENT"
    },
    {
      "id": "B_DRE",
      "kind": "ball",
      "label": "",
      "position": [
        16.165,
        13.98
      ],
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/nodes/15",
      "status": "derived"
    }
  ],
  "participant_states": [
    {
      "id": "STATE_ESQ_A_CURRENT",
      "participant_ref": "A_ESQ",
      "state_id": "current",
      "phase": "initial",
      "position": [
        4.175,
        14.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "id": "STATE_ESQ_P_CURRENT",
      "participant_ref": "P_ESQ",
      "state_id": "current",
      "phase": "initial",
      "position": [
        4.175,
        17.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6"
      ]
    },
    {
      "id": "STATE_ESQ_D_CURRENT",
      "participant_ref": "D_ESQ",
      "state_id": "current",
      "phase": "duel",
      "position": [
        4.175,
        7.6
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/3"
      ]
    },
    {
      "id": "STATE_ESQ_A_RUN",
      "participant_ref": "A_ESQ",
      "state_id": "run",
      "phase": "approach",
      "position": [
        4.175,
        11.05
      ],
      "status": "future",
      "visibility": "control",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "id": "STATE_ESQ_A_RECEIVE_CONTINUA-A",
      "participant_ref": "A_ESQ",
      "state_id": "receive_continua-a",
      "phase": "reception",
      "position": [
        2.712,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/2"
      ]
    },
    {
      "id": "STATE_ESQ_A_FINAL_CONTINUA-A",
      "participant_ref": "A_ESQ",
      "state_id": "final_continua-a",
      "phase": "resolution",
      "position": [
        2.712,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/2"
      ]
    },
    {
      "id": "STATE_ESQ_A_RECEIVE_FINTA-A-B",
      "participant_ref": "A_ESQ",
      "state_id": "receive_finta-a-b",
      "phase": "reception",
      "position": [
        2.712,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/3"
      ]
    },
    {
      "id": "STATE_ESQ_A_FINAL_FINTA-A-B",
      "participant_ref": "A_ESQ",
      "state_id": "final_finta-a-b",
      "phase": "resolution",
      "position": [
        5.637,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/3"
      ]
    },
    {
      "id": "STATE_ESQ_A_RECEIVE_CONTINUA-B",
      "participant_ref": "A_ESQ",
      "state_id": "receive_continua-b",
      "phase": "reception",
      "position": [
        5.637,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/4"
      ]
    },
    {
      "id": "STATE_ESQ_A_FINAL_CONTINUA-B",
      "participant_ref": "A_ESQ",
      "state_id": "final_continua-b",
      "phase": "resolution",
      "position": [
        5.637,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/4"
      ]
    },
    {
      "id": "STATE_ESQ_A_RECEIVE_FINTA-B-A",
      "participant_ref": "A_ESQ",
      "state_id": "receive_finta-b-a",
      "phase": "reception",
      "position": [
        5.637,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/5"
      ]
    },
    {
      "id": "STATE_ESQ_A_FINAL_FINTA-B-A",
      "participant_ref": "A_ESQ",
      "state_id": "final_finta-b-a",
      "phase": "resolution",
      "position": [
        2.712,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_ESQ_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/5"
      ]
    },
    {
      "id": "STATE_CE_A_CURRENT",
      "participant_ref": "A_CE",
      "state_id": "current",
      "phase": "initial",
      "position": [
        10.0,
        14.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "id": "STATE_CE_P_CURRENT",
      "participant_ref": "P_CE",
      "state_id": "current",
      "phase": "initial",
      "position": [
        10.0,
        17.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7"
      ]
    },
    {
      "id": "STATE_CE_D_CURRENT",
      "participant_ref": "D_CE",
      "state_id": "current",
      "phase": "duel",
      "position": [
        10.0,
        7.6
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/4"
      ]
    },
    {
      "id": "STATE_CE_A_RUN",
      "participant_ref": "A_CE",
      "state_id": "run",
      "phase": "approach",
      "position": [
        10.0,
        11.05
      ],
      "status": "future",
      "visibility": "control",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "id": "STATE_CE_A_RECEIVE_CONTINUA-A",
      "participant_ref": "A_CE",
      "state_id": "receive_continua-a",
      "phase": "reception",
      "position": [
        8.55,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/8"
      ]
    },
    {
      "id": "STATE_CE_A_FINAL_CONTINUA-A",
      "participant_ref": "A_CE",
      "state_id": "final_continua-a",
      "phase": "resolution",
      "position": [
        8.55,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/8"
      ]
    },
    {
      "id": "STATE_CE_A_RECEIVE_FINTA-A-B",
      "participant_ref": "A_CE",
      "state_id": "receive_finta-a-b",
      "phase": "reception",
      "position": [
        8.55,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/9"
      ]
    },
    {
      "id": "STATE_CE_A_FINAL_FINTA-A-B",
      "participant_ref": "A_CE",
      "state_id": "final_finta-a-b",
      "phase": "resolution",
      "position": [
        11.45,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/9"
      ]
    },
    {
      "id": "STATE_CE_A_RECEIVE_CONTINUA-B",
      "participant_ref": "A_CE",
      "state_id": "receive_continua-b",
      "phase": "reception",
      "position": [
        11.45,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/10"
      ]
    },
    {
      "id": "STATE_CE_A_FINAL_CONTINUA-B",
      "participant_ref": "A_CE",
      "state_id": "final_continua-b",
      "phase": "resolution",
      "position": [
        11.45,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/10"
      ]
    },
    {
      "id": "STATE_CE_A_RECEIVE_FINTA-B-A",
      "participant_ref": "A_CE",
      "state_id": "receive_finta-b-a",
      "phase": "reception",
      "position": [
        11.45,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/11"
      ]
    },
    {
      "id": "STATE_CE_A_FINAL_FINTA-B-A",
      "participant_ref": "A_CE",
      "state_id": "final_finta-b-a",
      "phase": "resolution",
      "position": [
        8.55,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_CE_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/11"
      ]
    },
    {
      "id": "STATE_DRE_A_CURRENT",
      "participant_ref": "A_DRE",
      "state_id": "current",
      "phase": "initial",
      "position": [
        15.825,
        14.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    },
    {
      "id": "STATE_DRE_P_CURRENT",
      "participant_ref": "P_DRE",
      "state_id": "current",
      "phase": "initial",
      "position": [
        15.825,
        17.1
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8"
      ]
    },
    {
      "id": "STATE_DRE_D_CURRENT",
      "participant_ref": "D_DRE",
      "state_id": "current",
      "phase": "duel",
      "position": [
        15.825,
        7.6
      ],
      "status": "current",
      "visibility": "normal",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/5"
      ]
    },
    {
      "id": "STATE_DRE_A_RUN",
      "participant_ref": "A_DRE",
      "state_id": "run",
      "phase": "approach",
      "position": [
        15.825,
        11.05
      ],
      "status": "future",
      "visibility": "control",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    },
    {
      "id": "STATE_DRE_A_RECEIVE_CONTINUA-A",
      "participant_ref": "A_DRE",
      "state_id": "receive_continua-a",
      "phase": "reception",
      "position": [
        14.363,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/14"
      ]
    },
    {
      "id": "STATE_DRE_A_FINAL_CONTINUA-A",
      "participant_ref": "A_DRE",
      "state_id": "final_continua-a",
      "phase": "resolution",
      "position": [
        14.363,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_CONTINUA_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/14"
      ]
    },
    {
      "id": "STATE_DRE_A_RECEIVE_FINTA-A-B",
      "participant_ref": "A_DRE",
      "state_id": "receive_finta-a-b",
      "phase": "reception",
      "position": [
        14.363,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/15"
      ]
    },
    {
      "id": "STATE_DRE_A_FINAL_FINTA-A-B",
      "participant_ref": "A_DRE",
      "state_id": "final_finta-a-b",
      "phase": "resolution",
      "position": [
        17.288,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_FINTA_A_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/15"
      ]
    },
    {
      "id": "STATE_DRE_A_RECEIVE_CONTINUA-B",
      "participant_ref": "A_DRE",
      "state_id": "receive_continua-b",
      "phase": "reception",
      "position": [
        17.288,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/16"
      ]
    },
    {
      "id": "STATE_DRE_A_FINAL_CONTINUA-B",
      "participant_ref": "A_DRE",
      "state_id": "final_continua-b",
      "phase": "resolution",
      "position": [
        17.288,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_CONTINUA_B"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/16"
      ]
    },
    {
      "id": "STATE_DRE_A_RECEIVE_FINTA-B-A",
      "participant_ref": "A_DRE",
      "state_id": "receive_finta-b-a",
      "phase": "reception",
      "position": [
        17.288,
        10.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/17"
      ]
    },
    {
      "id": "STATE_DRE_A_FINAL_FINTA-B-A",
      "participant_ref": "A_DRE",
      "state_id": "final_finta-b-a",
      "phase": "resolution",
      "position": [
        14.363,
        5.75
      ],
      "status": "future",
      "visibility": "selected_alternative",
      "alternative_refs": [
        "A_DRE_FINTA_B_A"
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/17"
      ]
    }
  ],
  "common_paths": [
    {
      "id": "PATH_ESQ_PASSADA_INICIAL",
      "kind": "initial_pass",
      "action_type": "pass",
      "ball_ref": "B_ESQ",
      "from_participant_ref": "A_ESQ",
      "from_state_ref": "STATE_ESQ_A_CURRENT",
      "to_participant_ref": "P_ESQ",
      "to_state_ref": "STATE_ESQ_P_CURRENT",
      "anchor_mode": "symbol_perimeter",
      "segments": [
        {
          "type": "cubic",
          "start": [
            4.175,
            14.1
          ],
          "control1": [
            4.795,
            14.9
          ],
          "control2": [
            4.795,
            16.25
          ],
          "end": [
            4.175,
            17.1
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6"
      ]
    },
    {
      "id": "PATH_ESQ_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "action_type": "movement",
      "actor_ref": "A_ESQ",
      "from_state_ref": "STATE_ESQ_A_CURRENT",
      "to_state_ref": "STATE_ESQ_A_RUN",
      "segments": [
        {
          "type": "cubic",
          "start": [
            4.175,
            14.1
          ],
          "control1": [
            4.175,
            13.1
          ],
          "control2": [
            4.175,
            12.0
          ],
          "end": [
            4.175,
            11.05
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "id": "PATH_CE_PASSADA_INICIAL",
      "kind": "initial_pass",
      "action_type": "pass",
      "ball_ref": "B_CE",
      "from_participant_ref": "A_CE",
      "from_state_ref": "STATE_CE_A_CURRENT",
      "to_participant_ref": "P_CE",
      "to_state_ref": "STATE_CE_P_CURRENT",
      "anchor_mode": "symbol_perimeter",
      "segments": [
        {
          "type": "cubic",
          "start": [
            10.0,
            14.1
          ],
          "control1": [
            10.62,
            14.9
          ],
          "control2": [
            10.62,
            16.25
          ],
          "end": [
            10.0,
            17.1
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/6",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7"
      ]
    },
    {
      "id": "PATH_CE_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "action_type": "movement",
      "actor_ref": "A_CE",
      "from_state_ref": "STATE_CE_A_CURRENT",
      "to_state_ref": "STATE_CE_A_RUN",
      "segments": [
        {
          "type": "cubic",
          "start": [
            10.0,
            14.1
          ],
          "control1": [
            10.0,
            13.1
          ],
          "control2": [
            10.0,
            12.0
          ],
          "end": [
            10.0,
            11.05
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/7",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "id": "PATH_DRE_PASSADA_INICIAL",
      "kind": "initial_pass",
      "action_type": "pass",
      "ball_ref": "B_DRE",
      "from_participant_ref": "A_DRE",
      "from_state_ref": "STATE_DRE_A_CURRENT",
      "to_participant_ref": "P_DRE",
      "to_state_ref": "STATE_DRE_P_CURRENT",
      "anchor_mode": "symbol_perimeter",
      "segments": [
        {
          "type": "cubic",
          "start": [
            15.825,
            14.1
          ],
          "control1": [
            16.445,
            14.9
          ],
          "control2": [
            16.445,
            16.25
          ],
          "end": [
            15.825,
            17.1
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/12",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8"
      ]
    },
    {
      "id": "PATH_DRE_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "action_type": "movement",
      "actor_ref": "A_DRE",
      "from_state_ref": "STATE_DRE_A_CURRENT",
      "to_state_ref": "STATE_DRE_A_RUN",
      "segments": [
        {
          "type": "cubic",
          "start": [
            15.825,
            14.1
          ],
          "control1": [
            15.825,
            13.1
          ],
          "control2": [
            15.825,
            12.0
          ],
          "end": [
            15.825,
            11.05
          ]
        }
      ],
      "functional_points": [],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/13",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    }
  ],
  "branches": [
    {
      "id": "BR_DUEL_ESQ",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0",
      "zone_ref": "Z_ESQ",
      "alternatives": [
        {
          "id": "A_ESQ_CONTINUA_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/0",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/2",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_ESQ",
          "from_state_ref": "STATE_ESQ_A_RECEIVE_CONTINUA-A",
          "to_state_ref": "STATE_ESQ_A_FINAL_CONTINUA-A",
          "initial_space_ref": "E_ESQ_A",
          "target_space_ref": "E_ESQ_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                2.712,
                10.75
              ],
              "control1": [
                2.712,
                9.55
              ],
              "control2": [
                2.712,
                7.05
              ],
              "end": [
                2.712,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_ESQ_CONTINUA_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_ESQ",
            "from_participant_ref": "P_ESQ",
            "from_state_ref": "STATE_ESQ_P_CURRENT",
            "to_participant_ref": "A_ESQ",
            "to_state_ref": "STATE_ESQ_A_RECEIVE_CONTINUA-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  4.175,
                  17.1
                ],
                "control1": [
                  3.495,
                  14.9
                ],
                "control2": [
                  2.962,
                  12.25
                ],
                "end": [
                  2.712,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/2",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_ESQ_FINTA_A_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/1",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/3",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_ESQ",
          "from_state_ref": "STATE_ESQ_A_RECEIVE_FINTA-A-B",
          "to_state_ref": "STATE_ESQ_A_FINAL_FINTA-A-B",
          "initial_space_ref": "E_ESQ_A",
          "target_space_ref": "E_ESQ_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                2.712,
                10.75
              ],
              "control1": [
                2.712,
                9.75
              ],
              "control2": [
                2.712,
                8.55
              ],
              "end": [
                2.712,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                2.712,
                7.9
              ],
              "end": [
                4.175,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                4.175,
                7.25
              ],
              "control1": [
                5.637,
                6.95
              ],
              "control2": [
                5.637,
                6.2
              ],
              "end": [
                5.637,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_ESQ_FINTA_A_B_COMPROMIS",
              "role": "direction_break",
              "position": [
                2.712,
                7.9
              ]
            },
            {
              "id": "FP_A_ESQ_FINTA_A_B_SORTIDA",
              "role": "exit",
              "position": [
                4.175,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_ESQ_FINTA_A_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_ESQ",
            "from_participant_ref": "P_ESQ",
            "from_state_ref": "STATE_ESQ_P_CURRENT",
            "to_participant_ref": "A_ESQ",
            "to_state_ref": "STATE_ESQ_A_RECEIVE_FINTA-A-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  4.175,
                  17.1
                ],
                "control1": [
                  3.495,
                  14.9
                ],
                "control2": [
                  2.962,
                  12.25
                ],
                "end": [
                  2.712,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/3",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        },
        {
          "id": "A_ESQ_CONTINUA_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/2",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/4",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_ESQ",
          "from_state_ref": "STATE_ESQ_A_RECEIVE_CONTINUA-B",
          "to_state_ref": "STATE_ESQ_A_FINAL_CONTINUA-B",
          "initial_space_ref": "E_ESQ_B",
          "target_space_ref": "E_ESQ_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                5.637,
                10.75
              ],
              "control1": [
                5.637,
                9.55
              ],
              "control2": [
                5.637,
                7.05
              ],
              "end": [
                5.637,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_ESQ_CONTINUA_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_ESQ",
            "from_participant_ref": "P_ESQ",
            "from_state_ref": "STATE_ESQ_P_CURRENT",
            "to_participant_ref": "A_ESQ",
            "to_state_ref": "STATE_ESQ_A_RECEIVE_CONTINUA-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  4.175,
                  17.1
                ],
                "control1": [
                  3.495,
                  14.9
                ],
                "control2": [
                  5.887,
                  12.25
                ],
                "end": [
                  5.637,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/4",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_ESQ_FINTA_B_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/3",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/5",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_ESQ",
          "from_state_ref": "STATE_ESQ_A_RECEIVE_FINTA-B-A",
          "to_state_ref": "STATE_ESQ_A_FINAL_FINTA-B-A",
          "initial_space_ref": "E_ESQ_B",
          "target_space_ref": "E_ESQ_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                5.637,
                10.75
              ],
              "control1": [
                5.637,
                9.75
              ],
              "control2": [
                5.637,
                8.55
              ],
              "end": [
                5.637,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                5.637,
                7.9
              ],
              "end": [
                4.175,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                4.175,
                7.25
              ],
              "control1": [
                2.712,
                6.95
              ],
              "control2": [
                2.712,
                6.2
              ],
              "end": [
                2.712,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_ESQ_FINTA_B_A_COMPROMIS",
              "role": "direction_break",
              "position": [
                5.637,
                7.9
              ]
            },
            {
              "id": "FP_A_ESQ_FINTA_B_A_SORTIDA",
              "role": "exit",
              "position": [
                4.175,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_ESQ_FINTA_B_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_ESQ",
            "from_participant_ref": "P_ESQ",
            "from_state_ref": "STATE_ESQ_P_CURRENT",
            "to_participant_ref": "A_ESQ",
            "to_state_ref": "STATE_ESQ_A_RECEIVE_FINTA-B-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  4.175,
                  17.1
                ],
                "control1": [
                  3.495,
                  14.9
                ],
                "control2": [
                  5.887,
                  12.25
                ],
                "end": [
                  5.637,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/5",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        }
      ]
    },
    {
      "id": "BR_DUEL_CE",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1",
      "zone_ref": "Z_CE",
      "alternatives": [
        {
          "id": "A_CE_CONTINUA_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/0",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/8",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_CE",
          "from_state_ref": "STATE_CE_A_RECEIVE_CONTINUA-A",
          "to_state_ref": "STATE_CE_A_FINAL_CONTINUA-A",
          "initial_space_ref": "E_CE_A",
          "target_space_ref": "E_CE_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                8.55,
                10.75
              ],
              "control1": [
                8.55,
                9.55
              ],
              "control2": [
                8.55,
                7.05
              ],
              "end": [
                8.55,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_CE_CONTINUA_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_CE",
            "from_participant_ref": "P_CE",
            "from_state_ref": "STATE_CE_P_CURRENT",
            "to_participant_ref": "A_CE",
            "to_state_ref": "STATE_CE_A_RECEIVE_CONTINUA-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  10.0,
                  17.1
                ],
                "control1": [
                  9.32,
                  14.9
                ],
                "control2": [
                  8.8,
                  12.25
                ],
                "end": [
                  8.55,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/8",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_CE_FINTA_A_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/1",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/9",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_CE",
          "from_state_ref": "STATE_CE_A_RECEIVE_FINTA-A-B",
          "to_state_ref": "STATE_CE_A_FINAL_FINTA-A-B",
          "initial_space_ref": "E_CE_A",
          "target_space_ref": "E_CE_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                8.55,
                10.75
              ],
              "control1": [
                8.55,
                9.75
              ],
              "control2": [
                8.55,
                8.55
              ],
              "end": [
                8.55,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                8.55,
                7.9
              ],
              "end": [
                10.0,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                10.0,
                7.25
              ],
              "control1": [
                11.45,
                6.95
              ],
              "control2": [
                11.45,
                6.2
              ],
              "end": [
                11.45,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_CE_FINTA_A_B_COMPROMIS",
              "role": "direction_break",
              "position": [
                8.55,
                7.9
              ]
            },
            {
              "id": "FP_A_CE_FINTA_A_B_SORTIDA",
              "role": "exit",
              "position": [
                10.0,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_CE_FINTA_A_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_CE",
            "from_participant_ref": "P_CE",
            "from_state_ref": "STATE_CE_P_CURRENT",
            "to_participant_ref": "A_CE",
            "to_state_ref": "STATE_CE_A_RECEIVE_FINTA-A-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  10.0,
                  17.1
                ],
                "control1": [
                  9.32,
                  14.9
                ],
                "control2": [
                  8.8,
                  12.25
                ],
                "end": [
                  8.55,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/9",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        },
        {
          "id": "A_CE_CONTINUA_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/2",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/10",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_CE",
          "from_state_ref": "STATE_CE_A_RECEIVE_CONTINUA-B",
          "to_state_ref": "STATE_CE_A_FINAL_CONTINUA-B",
          "initial_space_ref": "E_CE_B",
          "target_space_ref": "E_CE_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                11.45,
                10.75
              ],
              "control1": [
                11.45,
                9.55
              ],
              "control2": [
                11.45,
                7.05
              ],
              "end": [
                11.45,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_CE_CONTINUA_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_CE",
            "from_participant_ref": "P_CE",
            "from_state_ref": "STATE_CE_P_CURRENT",
            "to_participant_ref": "A_CE",
            "to_state_ref": "STATE_CE_A_RECEIVE_CONTINUA-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  10.0,
                  17.1
                ],
                "control1": [
                  9.32,
                  14.9
                ],
                "control2": [
                  11.7,
                  12.25
                ],
                "end": [
                  11.45,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/10",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_CE_FINTA_B_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/3",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/11",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_CE",
          "from_state_ref": "STATE_CE_A_RECEIVE_FINTA-B-A",
          "to_state_ref": "STATE_CE_A_FINAL_FINTA-B-A",
          "initial_space_ref": "E_CE_B",
          "target_space_ref": "E_CE_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                11.45,
                10.75
              ],
              "control1": [
                11.45,
                9.75
              ],
              "control2": [
                11.45,
                8.55
              ],
              "end": [
                11.45,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                11.45,
                7.9
              ],
              "end": [
                10.0,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                10.0,
                7.25
              ],
              "control1": [
                8.55,
                6.95
              ],
              "control2": [
                8.55,
                6.2
              ],
              "end": [
                8.55,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_CE_FINTA_B_A_COMPROMIS",
              "role": "direction_break",
              "position": [
                11.45,
                7.9
              ]
            },
            {
              "id": "FP_A_CE_FINTA_B_A_SORTIDA",
              "role": "exit",
              "position": [
                10.0,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_CE_FINTA_B_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_CE",
            "from_participant_ref": "P_CE",
            "from_state_ref": "STATE_CE_P_CURRENT",
            "to_participant_ref": "A_CE",
            "to_state_ref": "STATE_CE_A_RECEIVE_FINTA-B-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  10.0,
                  17.1
                ],
                "control1": [
                  9.32,
                  14.9
                ],
                "control2": [
                  11.7,
                  12.25
                ],
                "end": [
                  11.45,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/11",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        }
      ]
    },
    {
      "id": "BR_DUEL_DRE",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2",
      "zone_ref": "Z_DRE",
      "alternatives": [
        {
          "id": "A_DRE_CONTINUA_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/0",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/14",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_DRE",
          "from_state_ref": "STATE_DRE_A_RECEIVE_CONTINUA-A",
          "to_state_ref": "STATE_DRE_A_FINAL_CONTINUA-A",
          "initial_space_ref": "E_DRE_A",
          "target_space_ref": "E_DRE_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                14.363,
                10.75
              ],
              "control1": [
                14.363,
                9.55
              ],
              "control2": [
                14.363,
                7.05
              ],
              "end": [
                14.363,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_DRE_CONTINUA_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_DRE",
            "from_participant_ref": "P_DRE",
            "from_state_ref": "STATE_DRE_P_CURRENT",
            "to_participant_ref": "A_DRE",
            "to_state_ref": "STATE_DRE_A_RECEIVE_CONTINUA-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  15.825,
                  17.1
                ],
                "control1": [
                  15.145,
                  14.9
                ],
                "control2": [
                  14.613,
                  12.25
                ],
                "end": [
                  14.363,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/14",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_DRE_FINTA_A_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/1",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/15",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_DRE",
          "from_state_ref": "STATE_DRE_A_RECEIVE_FINTA-A-B",
          "to_state_ref": "STATE_DRE_A_FINAL_FINTA-A-B",
          "initial_space_ref": "E_DRE_A",
          "target_space_ref": "E_DRE_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                14.363,
                10.75
              ],
              "control1": [
                14.363,
                9.75
              ],
              "control2": [
                14.363,
                8.55
              ],
              "end": [
                14.363,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                14.363,
                7.9
              ],
              "end": [
                15.825,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                15.825,
                7.25
              ],
              "control1": [
                17.288,
                6.95
              ],
              "control2": [
                17.288,
                6.2
              ],
              "end": [
                17.288,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_DRE_FINTA_A_B_COMPROMIS",
              "role": "direction_break",
              "position": [
                14.363,
                7.9
              ]
            },
            {
              "id": "FP_A_DRE_FINTA_A_B_SORTIDA",
              "role": "exit",
              "position": [
                15.825,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_DRE_FINTA_A_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_DRE",
            "from_participant_ref": "P_DRE",
            "from_state_ref": "STATE_DRE_P_CURRENT",
            "to_participant_ref": "A_DRE",
            "to_state_ref": "STATE_DRE_A_RECEIVE_FINTA-A-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  15.825,
                  17.1
                ],
                "control1": [
                  15.145,
                  14.9
                ],
                "control2": [
                  14.613,
                  12.25
                ],
                "end": [
                  14.363,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/15",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        },
        {
          "id": "A_DRE_CONTINUA_B",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/2",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/16",
          "kind": "continuation",
          "action_type": "movement",
          "actor_ref": "A_DRE",
          "from_state_ref": "STATE_DRE_A_RECEIVE_CONTINUA-B",
          "to_state_ref": "STATE_DRE_A_FINAL_CONTINUA-B",
          "initial_space_ref": "E_DRE_B",
          "target_space_ref": "E_DRE_B",
          "segments": [
            {
              "type": "cubic",
              "start": [
                17.288,
                10.75
              ],
              "control1": [
                17.288,
                9.55
              ],
              "control2": [
                17.288,
                7.05
              ],
              "end": [
                17.288,
                5.75
              ]
            }
          ],
          "functional_points": [],
          "return_pass": {
            "id": "PATH_A_DRE_CONTINUA_B_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_DRE",
            "from_participant_ref": "P_DRE",
            "from_state_ref": "STATE_DRE_P_CURRENT",
            "to_participant_ref": "A_DRE",
            "to_state_ref": "STATE_DRE_A_RECEIVE_CONTINUA-B",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  15.825,
                  17.1
                ],
                "control1": [
                  15.145,
                  14.9
                ],
                "control2": [
                  17.538,
                  12.25
                ],
                "end": [
                  17.288,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/16",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva"
          ]
        },
        {
          "id": "A_DRE_FINTA_B_A",
          "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/3",
          "transition_ref": "exercises/TR-UVOF-015/spatial-relations.json#/transicions/17",
          "kind": "feint",
          "action_type": "movement",
          "actor_ref": "A_DRE",
          "from_state_ref": "STATE_DRE_A_RECEIVE_FINTA-B-A",
          "to_state_ref": "STATE_DRE_A_FINAL_FINTA-B-A",
          "initial_space_ref": "E_DRE_B",
          "target_space_ref": "E_DRE_A",
          "segments": [
            {
              "type": "cubic",
              "start": [
                17.288,
                10.75
              ],
              "control1": [
                17.288,
                9.75
              ],
              "control2": [
                17.288,
                8.55
              ],
              "end": [
                17.288,
                7.9
              ]
            },
            {
              "type": "line",
              "start": [
                17.288,
                7.9
              ],
              "end": [
                15.825,
                7.25
              ]
            },
            {
              "type": "cubic",
              "start": [
                15.825,
                7.25
              ],
              "control1": [
                14.363,
                6.95
              ],
              "control2": [
                14.363,
                6.2
              ],
              "end": [
                14.363,
                5.75
              ]
            }
          ],
          "functional_points": [
            {
              "id": "FP_A_DRE_FINTA_B_A_COMPROMIS",
              "role": "direction_break",
              "position": [
                17.288,
                7.9
              ]
            },
            {
              "id": "FP_A_DRE_FINTA_B_A_SORTIDA",
              "role": "exit",
              "position": [
                15.825,
                7.25
              ]
            }
          ],
          "return_pass": {
            "id": "PATH_A_DRE_FINTA_B_A_PASSADA_RETORN",
            "kind": "return_pass",
            "action_type": "pass",
            "ball_ref": "B_DRE",
            "from_participant_ref": "P_DRE",
            "from_state_ref": "STATE_DRE_P_CURRENT",
            "to_participant_ref": "A_DRE",
            "to_state_ref": "STATE_DRE_A_RECEIVE_FINTA-B-A",
            "anchor_mode": "symbol_perimeter",
            "segments": [
              {
                "type": "cubic",
                "start": [
                  15.825,
                  17.1
                ],
                "control1": [
                  15.145,
                  14.9
                ],
                "control2": [
                  17.538,
                  12.25
                ],
                "end": [
                  17.288,
                  10.75
                ]
              }
            ],
            "functional_points": [],
            "source_refs": [
              "exercises/TR-UVOF-015/spatial-relations.json#/transicions/17",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8",
              "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
            ]
          },
          "qualifiers": [
            "sense_bot",
            "dins_limits_zona",
            "superacio_en_travessar_linia_defensiva",
            "canvi_direccio_i_ritme_cap_al_contigu"
          ]
        }
      ]
    }
  ],
  "dependencies": [
    {
      "id": "DEP_STATE_ESQ_A_RECEIVE_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_RECEIVE_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_ESQ_CONTINUA_A",
        "geometry:return_pass:PATH_A_ESQ_CONTINUA_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_FINAL_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_FINAL_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_ESQ_CONTINUA_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_RECEIVE_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_RECEIVE_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_ESQ_FINTA_A_B",
        "geometry:return_pass:PATH_A_ESQ_FINTA_A_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_FINAL_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_FINAL_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_ESQ_FINTA_A_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_RECEIVE_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_RECEIVE_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_ESQ_CONTINUA_B",
        "geometry:return_pass:PATH_A_ESQ_CONTINUA_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_FINAL_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_FINAL_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_ESQ_CONTINUA_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_RECEIVE_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_RECEIVE_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_ESQ_FINTA_B_A",
        "geometry:return_pass:PATH_A_ESQ_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_FINAL_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_FINAL_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_ESQ_FINTA_B_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_CURRENT",
      "effect_refs": [
        "geometry:entity:A_ESQ",
        "geometry:common_path:PATH_ESQ_PASSADA_INICIAL",
        "geometry:common_path:PATH_ESQ_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_P_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_P_CURRENT",
      "effect_refs": [
        "geometry:entity:P_ESQ",
        "geometry:return_pass:PATH_A_ESQ_CONTINUA_A_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_ESQ_FINTA_A_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_ESQ_CONTINUA_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_ESQ_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_D_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_D_CURRENT",
      "effect_refs": [
        "geometry:entity:D_ESQ"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_ESQ_A_RUN",
      "trigger_ref": "geometry:participant_state:STATE_ESQ_A_RUN",
      "effect_refs": [
        "geometry:common_path:PATH_ESQ_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_RECEIVE_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_RECEIVE_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_CE_CONTINUA_A",
        "geometry:return_pass:PATH_A_CE_CONTINUA_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_FINAL_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_FINAL_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_CE_CONTINUA_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_RECEIVE_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_RECEIVE_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_CE_FINTA_A_B",
        "geometry:return_pass:PATH_A_CE_FINTA_A_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_FINAL_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_FINAL_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_CE_FINTA_A_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_RECEIVE_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_RECEIVE_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_CE_CONTINUA_B",
        "geometry:return_pass:PATH_A_CE_CONTINUA_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_FINAL_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_FINAL_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_CE_CONTINUA_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_RECEIVE_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_RECEIVE_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_CE_FINTA_B_A",
        "geometry:return_pass:PATH_A_CE_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_FINAL_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_FINAL_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_CE_FINTA_B_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_CURRENT",
      "effect_refs": [
        "geometry:entity:A_CE",
        "geometry:common_path:PATH_CE_PASSADA_INICIAL",
        "geometry:common_path:PATH_CE_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_P_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_CE_P_CURRENT",
      "effect_refs": [
        "geometry:entity:P_CE",
        "geometry:return_pass:PATH_A_CE_CONTINUA_A_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_CE_FINTA_A_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_CE_CONTINUA_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_CE_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_D_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_CE_D_CURRENT",
      "effect_refs": [
        "geometry:entity:D_CE"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_CE_A_RUN",
      "trigger_ref": "geometry:participant_state:STATE_CE_A_RUN",
      "effect_refs": [
        "geometry:common_path:PATH_CE_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_RECEIVE_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_RECEIVE_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_DRE_CONTINUA_A",
        "geometry:return_pass:PATH_A_DRE_CONTINUA_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_FINAL_CONTINUA-A",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_FINAL_CONTINUA-A",
      "effect_refs": [
        "geometry:alternative:A_DRE_CONTINUA_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_RECEIVE_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_RECEIVE_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_DRE_FINTA_A_B",
        "geometry:return_pass:PATH_A_DRE_FINTA_A_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_FINAL_FINTA-A-B",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_FINAL_FINTA-A-B",
      "effect_refs": [
        "geometry:alternative:A_DRE_FINTA_A_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_RECEIVE_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_RECEIVE_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_DRE_CONTINUA_B",
        "geometry:return_pass:PATH_A_DRE_CONTINUA_B_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_FINAL_CONTINUA-B",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_FINAL_CONTINUA-B",
      "effect_refs": [
        "geometry:alternative:A_DRE_CONTINUA_B"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_RECEIVE_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_RECEIVE_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_DRE_FINTA_B_A",
        "geometry:return_pass:PATH_A_DRE_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_FINAL_FINTA-B-A",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_FINAL_FINTA-B-A",
      "effect_refs": [
        "geometry:alternative:A_DRE_FINTA_B_A"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_CURRENT",
      "effect_refs": [
        "geometry:entity:A_DRE",
        "geometry:common_path:PATH_DRE_PASSADA_INICIAL",
        "geometry:common_path:PATH_DRE_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_P_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_DRE_P_CURRENT",
      "effect_refs": [
        "geometry:entity:P_DRE",
        "geometry:return_pass:PATH_A_DRE_CONTINUA_A_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_DRE_FINTA_A_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_DRE_CONTINUA_B_PASSADA_RETORN",
        "geometry:return_pass:PATH_A_DRE_FINTA_B_A_PASSADA_RETORN"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_D_CURRENT",
      "trigger_ref": "geometry:participant_state:STATE_DRE_D_CURRENT",
      "effect_refs": [
        "geometry:entity:D_DRE"
      ],
      "rule": "state_drives_geometry"
    },
    {
      "id": "DEP_STATE_DRE_A_RUN",
      "trigger_ref": "geometry:participant_state:STATE_DRE_A_RUN",
      "effect_refs": [
        "geometry:common_path:PATH_DRE_CURSA_SENSE_PILOTA"
      ],
      "rule": "state_drives_geometry"
    }
  ],
  "traceability": [
    {
      "geometry_ref": "geometry:entity:LIM_0",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/9"
      ]
    },
    {
      "geometry_ref": "geometry:entity:LIM_1",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/10"
      ]
    },
    {
      "geometry_ref": "geometry:entity:LIM_2",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/11"
      ]
    },
    {
      "geometry_ref": "geometry:entity:LIM_3",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/12"
      ]
    },
    {
      "geometry_ref": "geometry:zone:Z_ESQ",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/0"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_ESQ_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/3"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_ESQ_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/4"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_ESQ_A_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_ESQ_P_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_ESQ_D_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/3"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_ESQ_A_RUN",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "geometry_ref": "geometry:entity:A_ESQ",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "geometry_ref": "geometry:entity:P_ESQ",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6"
      ]
    },
    {
      "geometry_ref": "geometry:entity:D_ESQ",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/3"
      ]
    },
    {
      "geometry_ref": "geometry:entity:B_ESQ",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/13"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_ESQ_CONTINUA_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/2"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_ESQ_FINTA_A_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/3"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_ESQ_CONTINUA_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/2",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/4"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_ESQ_FINTA_B_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/0/alternatives/3",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/5"
      ]
    },
    {
      "geometry_ref": "geometry:zone:Z_CE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/1"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_CE_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/5"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_CE_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/6"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_CE_A_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_CE_P_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_CE_D_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/4"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_CE_A_RUN",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "geometry_ref": "geometry:entity:A_CE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "geometry_ref": "geometry:entity:P_CE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7"
      ]
    },
    {
      "geometry_ref": "geometry:entity:D_CE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/4"
      ]
    },
    {
      "geometry_ref": "geometry:entity:B_CE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/14"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_CE_CONTINUA_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/8"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_CE_FINTA_A_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/9"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_CE_CONTINUA_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/2",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/10"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_CE_FINTA_B_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/1/alternatives/3",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/11"
      ]
    },
    {
      "geometry_ref": "geometry:zone:Z_DRE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/2"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_DRE_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/7"
      ]
    },
    {
      "geometry_ref": "geometry:space:E_DRE_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/espais/8"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_DRE_A_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_DRE_P_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_DRE_D_CURRENT",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/5"
      ]
    },
    {
      "geometry_ref": "geometry:participant_state:STATE_DRE_A_RUN",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    },
    {
      "geometry_ref": "geometry:entity:A_DRE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2"
      ]
    },
    {
      "geometry_ref": "geometry:entity:P_DRE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8"
      ]
    },
    {
      "geometry_ref": "geometry:entity:D_DRE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/5"
      ]
    },
    {
      "geometry_ref": "geometry:entity:B_DRE",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/15"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_DRE_CONTINUA_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/14"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_DRE_FINTA_A_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/15"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_DRE_CONTINUA_B",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/2",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/16"
      ]
    },
    {
      "geometry_ref": "geometry:alternative:A_DRE_FINTA_B_A",
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/branques_decisionals/2/alternatives/3",
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/17"
      ]
    }
  ]
};
