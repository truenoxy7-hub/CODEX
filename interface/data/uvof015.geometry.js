window.TRACA_UVOF015_GEOMETRY = {
  "$schema": "../../schema/traca.geometry.schema.v0.1.json",
  "meta": {
    "format": "TRACA_geometria_derivada",
    "version": "0.1.0",
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
    "id": "uvof015_three_zones_v0.1",
    "status": "provisional_render_policy",
    "coordinate_system": "metres_origin_goal_line_left",
    "attack_direction": "negative_y",
    "notes": [
      "Les amplades de les tres zones són una política visual simètrica, no coneixement tàctic.",
      "Cap alternativa decisional se selecciona al JSON; la interfície només en previsualitza una per duel.",
      "Les posicions es deriven després d'un preflight ready i no modifiquen la font espacial."
    ]
  },
  "zones": [
    {
      "id": "Z_ESQ",
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
      ]
    },
    {
      "id": "Z_CE",
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
      ]
    },
    {
      "id": "Z_DRE",
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
      ]
    }
  ],
  "spaces": [
    {
      "id": "E_ESQ_A",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/3",
      "zone_ref": "Z_ESQ",
      "defender_ref": "D_ESQ",
      "polygon": [
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
      "center": [
        2.712,
        8.25
      ]
    },
    {
      "id": "E_ESQ_B",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/4",
      "zone_ref": "Z_ESQ",
      "defender_ref": "D_ESQ",
      "polygon": [
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
      "center": [
        5.637,
        8.25
      ]
    },
    {
      "id": "E_CE_A",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/5",
      "zone_ref": "Z_CE",
      "defender_ref": "D_CE",
      "polygon": [
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
      "center": [
        8.55,
        8.25
      ]
    },
    {
      "id": "E_CE_B",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/6",
      "zone_ref": "Z_CE",
      "defender_ref": "D_CE",
      "polygon": [
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
      "center": [
        11.45,
        8.25
      ]
    },
    {
      "id": "E_DRE_A",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/7",
      "zone_ref": "Z_DRE",
      "defender_ref": "D_DRE",
      "polygon": [
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
      "center": [
        14.363,
        8.25
      ]
    },
    {
      "id": "E_DRE_B",
      "source_ref": "exercises/TR-UVOF-015/spatial-relations.json#/espais/8",
      "zone_ref": "Z_DRE",
      "defender_ref": "D_DRE",
      "polygon": [
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
      "center": [
        17.288,
        8.25
      ]
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
      "status": "derived"
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
  "common_paths": [
    {
      "id": "PATH_ESQ_PASSADA_INICIAL",
      "kind": "initial_pass",
      "points": [
        [
          4.175,
          13.95
        ],
        [
          4.795,
          15.45
        ],
        [
          4.175,
          16.85
        ]
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/6"
      ]
    },
    {
      "id": "PATH_ESQ_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "points": [
        [
          4.175,
          13.75
        ],
        [
          4.175,
          12.45
        ],
        [
          4.175,
          11.05
        ]
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"
      ]
    },
    {
      "id": "PATH_CE_PASSADA_INICIAL",
      "kind": "initial_pass",
      "points": [
        [
          10.0,
          13.95
        ],
        [
          10.62,
          15.45
        ],
        [
          10.0,
          16.85
        ]
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/6",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/7"
      ]
    },
    {
      "id": "PATH_CE_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "points": [
        [
          10.0,
          13.75
        ],
        [
          10.0,
          12.45
        ],
        [
          10.0,
          11.05
        ]
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/7",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/1"
      ]
    },
    {
      "id": "PATH_DRE_PASSADA_INICIAL",
      "kind": "initial_pass",
      "points": [
        [
          15.825,
          13.95
        ],
        [
          16.445,
          15.45
        ],
        [
          15.825,
          16.85
        ]
      ],
      "source_refs": [
        "exercises/TR-UVOF-015/spatial-relations.json#/transicions/12",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/2",
        "exercises/TR-UVOF-015/spatial-relations.json#/nodes/8"
      ]
    },
    {
      "id": "PATH_DRE_CURSA_SENSE_PILOTA",
      "kind": "run_without_ball",
      "points": [
        [
          15.825,
          13.75
        ],
        [
          15.825,
          12.45
        ],
        [
          15.825,
          11.05
        ]
      ],
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
          "initial_space_ref": "E_ESQ_A",
          "target_space_ref": "E_ESQ_A",
          "points": [
            [
              2.712,
              10.75
            ],
            [
              2.712,
              8.3
            ],
            [
              2.712,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              4.175,
              16.85
            ],
            [
              3.495,
              13.35
            ],
            [
              2.712,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_ESQ_A",
          "target_space_ref": "E_ESQ_B",
          "points": [
            [
              2.712,
              10.75
            ],
            [
              2.712,
              8.35
            ],
            [
              2.712,
              7.9
            ],
            [
              4.175,
              7.55
            ],
            [
              5.637,
              6.65
            ],
            [
              5.637,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              4.175,
              16.85
            ],
            [
              3.495,
              13.35
            ],
            [
              2.712,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_ESQ_B",
          "target_space_ref": "E_ESQ_B",
          "points": [
            [
              5.637,
              10.75
            ],
            [
              5.637,
              8.3
            ],
            [
              5.637,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              4.175,
              16.85
            ],
            [
              3.495,
              13.35
            ],
            [
              5.637,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_ESQ_B",
          "target_space_ref": "E_ESQ_A",
          "points": [
            [
              5.637,
              10.75
            ],
            [
              5.637,
              8.35
            ],
            [
              5.637,
              7.9
            ],
            [
              4.175,
              7.55
            ],
            [
              2.712,
              6.65
            ],
            [
              2.712,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              4.175,
              16.85
            ],
            [
              3.495,
              13.35
            ],
            [
              5.637,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_CE_A",
          "target_space_ref": "E_CE_A",
          "points": [
            [
              8.55,
              10.75
            ],
            [
              8.55,
              8.3
            ],
            [
              8.55,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              10.0,
              16.85
            ],
            [
              9.32,
              13.35
            ],
            [
              8.55,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_CE_A",
          "target_space_ref": "E_CE_B",
          "points": [
            [
              8.55,
              10.75
            ],
            [
              8.55,
              8.35
            ],
            [
              8.55,
              7.9
            ],
            [
              10.0,
              7.55
            ],
            [
              11.45,
              6.65
            ],
            [
              11.45,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              10.0,
              16.85
            ],
            [
              9.32,
              13.35
            ],
            [
              8.55,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_CE_B",
          "target_space_ref": "E_CE_B",
          "points": [
            [
              11.45,
              10.75
            ],
            [
              11.45,
              8.3
            ],
            [
              11.45,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              10.0,
              16.85
            ],
            [
              9.32,
              13.35
            ],
            [
              11.45,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_CE_B",
          "target_space_ref": "E_CE_A",
          "points": [
            [
              11.45,
              10.75
            ],
            [
              11.45,
              8.35
            ],
            [
              11.45,
              7.9
            ],
            [
              10.0,
              7.55
            ],
            [
              8.55,
              6.65
            ],
            [
              8.55,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              10.0,
              16.85
            ],
            [
              9.32,
              13.35
            ],
            [
              11.45,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_DRE_A",
          "target_space_ref": "E_DRE_A",
          "points": [
            [
              14.363,
              10.75
            ],
            [
              14.363,
              8.3
            ],
            [
              14.363,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              15.825,
              16.85
            ],
            [
              15.145,
              13.35
            ],
            [
              14.363,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_DRE_A",
          "target_space_ref": "E_DRE_B",
          "points": [
            [
              14.363,
              10.75
            ],
            [
              14.363,
              8.35
            ],
            [
              14.363,
              7.9
            ],
            [
              15.825,
              7.55
            ],
            [
              17.288,
              6.65
            ],
            [
              17.288,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              15.825,
              16.85
            ],
            [
              15.145,
              13.35
            ],
            [
              14.363,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_DRE_B",
          "target_space_ref": "E_DRE_B",
          "points": [
            [
              17.288,
              10.75
            ],
            [
              17.288,
              8.3
            ],
            [
              17.288,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              15.825,
              16.85
            ],
            [
              15.145,
              13.35
            ],
            [
              17.288,
              10.75
            ]
          ],
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
          "initial_space_ref": "E_DRE_B",
          "target_space_ref": "E_DRE_A",
          "points": [
            [
              17.288,
              10.75
            ],
            [
              17.288,
              8.35
            ],
            [
              17.288,
              7.9
            ],
            [
              15.825,
              7.55
            ],
            [
              14.363,
              6.65
            ],
            [
              14.363,
              5.75
            ]
          ],
          "return_ball_points": [
            [
              15.825,
              16.85
            ],
            [
              15.145,
              13.35
            ],
            [
              17.288,
              10.75
            ]
          ],
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
