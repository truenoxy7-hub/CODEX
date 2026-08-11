from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

import pytest

from scripts.validate_semantic import (
    SEMANTIC_RULES,
    validate_corpus_document,
    validate_document,
)

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def valid_document() -> dict:
    return {
        "meta": {
            "format": "TRACA_exercici_semantic",
            "versio_llenguatge": "1.0.0",
            "versio_instancia": "1.0.0",
            "separacio_capes": {},
        },
        "identificacio": {
            "id": "TR-UVOF-001",
            "nom": "test",
            "familia": "test",
            "categoria": "test",
        },
        "origen": {},
        "definicions_reutilitzables": {
            "continguts_tactics": {
                "1x1_finta": {
                    "id": "CT-1X1-FINTA",
                    "definicio": "test",
                    "context_habitual": {},
                    "referencies_oposicionals_admeses": [{}, {}, {}, {}],
                    "sequencia_canonica": [{}, {}, {}],
                    "invariants": [],
                }
            }
        },
        "model_exercici": {
            "organitzacio": {},
            "participants_plantilla": [],
            "referencies_oposicionals": [
                {
                    "id": "REF_1X1",
                    "tipus_real": "defensor_directe",
                    "rol_defensiu_simulat": "segon_defensor",
                    "tipus_utilitzat_exercici": "banc",
                    "equivalencia": "substitut_de_defensor_directe",
                }
            ],
            "materials": [
                {"id": "C1", "classe_funcional": "limit_espacial"},
                {"id": "C2", "classe_funcional": "limit_espacial"},
                {
                    "id": "C3",
                    "classe_funcional": "referencia_posicional_passiva",
                    "rol_defensiu_representat": "segon_defensor",
                    "participa_com_a_defensor": False,
                },
            ],
            "espais_i_intervals": [
                {"id": "INT_1", "nom_canonic": "interval_1-2"},
                {
                    "id": "INT_2",
                    "tipus": "interval_contigu",
                    "relacio": "interior_de_REF_1X1",
                    "nom_canonic": "interval_2-3",
                    "defensor_compartit": "REF_1X1",
                },
                {
                    "id": "INT_4",
                    "tipus": "interval_atac_directe",
                    "relacio": "entre_D_Z2_i_C3",
                },
                {
                    "id": "ESPAI_EXTREM_Z2",
                    "tipus": "espai_finalitzacio_extrem",
                    "relacio": "entre_linia_de_fons_i_D_Z2",
                    "ocupant": "EXT",
                    "principis": ["mantenir_amplitud", "saltar_cap_al_centre"],
                },
            ],
            "subaccions": [
                {
                    "id": "SA1",
                    "interval_inicial": "INT_1",
                    "interval_contigu": "INT_2",
                    "sequencia_obligatoria": [
                        {
                            "ordre": 1,
                            "accio": "rebre_en_carrera",
                            "destinacio": "INT_1",
                        },
                        {
                            "ordre": 2,
                            "accio": "finta_canvi_direccio",
                            "forma_funcional": "U",
                            "des_de": "INT_1",
                            "cap_a": "INT_2",
                        },
                        {"ordre": 3, "accio": "resoldre"},
                    ],
                },
                {
                    "id": "SA2",
                    "passador": "EXT",
                    "recuperacio": {"amb_pilota": False},
                    "contingut_exclos": ["finta"],
                    "lectura_tactica": {"superioritat": "preparada_per_la_tasca"},
                    "sequencia_obligatoria": [
                        {"ordre": 1, "accio": "recuperar_sense_pilota"},
                        {
                            "ordre": 2,
                            "accio": "rebre_en_carrera",
                            "origen_passada": "EXT",
                            "condicions": ["passada_curta", "sense_bot"],
                        },
                        {
                            "ordre": 3,
                            "accio": "atacar_carril_1-2",
                            "es_finta": False,
                        },
                    ],
                },
            ],
            "ordre_global": ["1", "2", "3", "4", "5", "6", "7", "8"],
        },
        "contracte_futur_renderer": {
            "estat": "no_executable_encara",
            "principi": "test",
            "regles_obligatories": [],
        },
        "validacions_semantiques": [{i: i} for i in range(9)],
        "governanca": {
            "semantica_tactica": {},
            "geometria": {},
            "render": {},
        },
    }


@pytest.fixture
def schema() -> dict:
    return {
        "$id": "test",
        "type": "object",
        "required": ["meta", "identificacio", "model_exercici"],
    }


def test_valid_document_passes_all_semantic_rules(valid_document, schema):
    report = validate_document(valid_document, schema)

    assert report["valid"] is True
    assert report["errors"] == []
    assert report["warnings"] == []
    assert report["summary"]["semantic_checks_run"] == 13


MUTATIONS = (
    ("VAL-1X1-01", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][0].update(destinacio="INT_X")),
    ("VAL-1X1-02", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][1].update(des_de="INT_X")),
    ("VAL-1X1-03", lambda doc: doc["model_exercici"]["espais_i_intervals"][1].update(tipus="interval_recepcio")),
    ("VAL-1X1-04", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][1].update(forma_funcional="corba")),
    ("VAL-1X1-05", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][-1].update(accio="passar")),
    ("VAL-1X1-06", lambda doc: doc["model_exercici"]["referencies_oposicionals"][0].update(equivalencia="decoratiu")),
    ("VAL-SA2-01", lambda doc: doc["model_exercici"]["subaccions"][1]["recuperacio"].update(amb_pilota=True)),
    ("VAL-SA2-02", lambda doc: doc["model_exercici"]["subaccions"][1]["sequencia_obligatoria"][1].update(condicions=["passada_curta"])),
    ("VAL-SA2-03", lambda doc: doc["model_exercici"]["espais_i_intervals"][2].update(relacio="davant_D_Z2")),
    ("VAL-KNOW-01", lambda doc: doc["model_exercici"]["espais_i_intervals"][0].update(nom_canonic="espai_generic")),
    ("VAL-KNOW-02", lambda doc: doc["model_exercici"]["subaccions"][1]["sequencia_obligatoria"][2].update(es_finta=True)),
    ("VAL-KNOW-03", lambda doc: doc["model_exercici"]["materials"][2].update(participa_com_a_defensor=True)),
    ("VAL-KNOW-04", lambda doc: doc["model_exercici"]["espais_i_intervals"][3].update(principis=[])),
)


@pytest.mark.parametrize(("expected_code", "mutate"), MUTATIONS)
def test_each_semantic_invariant_has_a_negative_case(
    valid_document, schema, expected_code, mutate
):
    document = deepcopy(valid_document)
    mutate(document)

    report = validate_document(document, schema)

    assert report["valid"] is False
    assert [error["code"] for error in report["errors"]] == [expected_code]
    assert all({"code", "path", "message"} <= error.keys() for error in report["errors"])


def test_structural_errors_prevent_semantic_checks(valid_document, schema):
    del valid_document["model_exercici"]

    report = validate_document(valid_document, schema)

    assert report["valid"] is False
    assert report["errors"][0]["code"] == "SCHEMA_ERROR"
    assert report["summary"]["semantic_checks_run"] == 0
    assert len(SEMANTIC_RULES) == 13


def test_repository_document_passes_schema_and_semantic_rules():
    document = json.loads(
        (ROOT / "exercises" / "TR-UVOF-001" / "semantic.json").read_text(
            encoding="utf-8"
        )
    )
    schema = json.loads(
        (ROOT / "schema" / "traca.semantic.schema.v1.0.json").read_text(
            encoding="utf-8"
        )
    )

    report = validate_document(document, schema)

    assert report["valid"] is True
    assert report["errors"] == []
    assert report["summary"]["semantic_checks_run"] == 13


@pytest.fixture
def valid_corpus() -> dict:
    return json.loads(
        (ROOT / "corpus" / "uvof.semantic.json").read_text(encoding="utf-8")
    )


@pytest.fixture
def corpus_schema() -> dict:
    return json.loads(
        (
            ROOT / "schema" / "traca.exercise-corpus.schema.v1.1.json"
        ).read_text(encoding="utf-8")
    )


def _corpus_exercise(corpus: dict, exercise_id: str) -> dict:
    return next(
        exercise
        for exercise in corpus["exercicis"]
        if exercise["id"] == exercise_id
    )


def _corpus_decision(exercise: dict, decision_id: str) -> dict:
    return next(
        decision
        for phase in exercise["fases"]
        for decision in phase["decisions"]
        if decision["id"] == decision_id
    )


def test_repository_corpus_passes_schema_and_semantic_rules(
    valid_corpus, corpus_schema
):
    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert report["valid"] is True
    assert report["errors"] == []
    assert report["summary"]["exercise_count"] == 15


def test_corpus_rejects_mandatory_switch_side(valid_corpus, corpus_schema):
    decision = _corpus_decision(
        _corpus_exercise(valid_corpus, "TR-UVOF-006"),
        "D_CANVI_BANDA",
    )
    decision["caracter"] = "obligatori"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF006_SWITCH_PREFERRED" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_permutation_receiver(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-009")
    permutation = next(
        action
        for phase in exercise["fases"]
        for action in phase["accions"]
        if action["accio"] == "permuta"
    )
    permutation["receptor_despres_permuta"] = "L"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "CORPUS_PERMUTA_RECEIVER" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_undeclared_ball_flow(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-009")
    exercise["fases"][0]["fluxos_pilota"][0]["pilota_id"] = "B9"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "CORPUS_BALL_UNDECLARED" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_missing_active_defender_in_uvof002(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-002")
    exercise["participants"] = [
        participant
        for participant in exercise["participants"]
        if participant["id"] != "D1"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF002_ACTIVE_DEFENDERS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_disconnected_pass_return_in_uvof002(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-002")
    return_flow = next(
        flow
        for phase in exercise["fases"]
        for flow in phase["fluxos_pilota"]
        if flow.get("trajectoria_id") == "FINTA_12_23"
        and flow.get("ordre") == 2
    )
    return_flow["posseidor_inicial"] = "CE"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "CORPUS_BALL_FLOW_DISCONNECTED" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_incomplete_6x6_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    exercise["participants"] = [
        participant
        for participant in exercise["participants"]
        if participant["id"] != "D1_OPOSAT"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_FULL_6X6" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_optional_pivot_pass_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    decision = _corpus_decision(exercise, "D_PASSADA_PIVOT")
    decision["caracter"] = "disponible"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_PIVOT_PASS_TASK_RULE" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_optional_wing_pass_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    decision = _corpus_decision(exercise, "D_PASSADA_EXTREM")
    decision["caracter"] = "disponible"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_WING_PASS_GAME_RULE" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_broken_wing_pass_flow_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    flow = next(
        flow
        for phase in exercise["fases"]
        for flow in phase["fluxos_pilota"]
        if flow.get("trajectoria_id") == "SUPERA_12_AMB_AJUDA"
    )
    flow["accio"] = "passada_2x1_exterior"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_WING_PASS_FLOW" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_missing_wing_anticipation_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    actions = exercise["fases"][0]["accions"]
    actions[:] = [
        action
        for action in actions
        if action["accio"]
        != "mantenir_amplitud_anticipar_passada_i_finalitzar_a_espai_exterior"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_WING_ANTICIPATION" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_optional_task_switch_in_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    decision = _corpus_decision(exercise, "D_CANVI_BANDA")
    decision["caracter"] = "preferent"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_SWITCH_TASK_RULE" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_analytic_classification_for_full_uvof003(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    exercise["tipus_exercici"] = "analitic"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_FULL_6X6" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_missing_uvof003_task_condition(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-003")
    exercise["condicions_tasca"].remove(
        "passada_pivot_obligatoria_si_D3_ajuda"
    )

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF003_TASK_CONDITIONS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_non_situation_game_classification_for_any_6x6(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-005")
    exercise["tipus_exercici"] = "analitic"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "CORPUS_6X6_SITUATION_GAME" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_cone_as_substitute_defender_in_uvof004(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-004")
    exercise["materials"][0]["funcio"] = "substitut_de_defensor"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF004_D2_CONE_HANDICAP" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_incomplete_51_defense_in_uvof005(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-005")
    exercise["participants"] = [
        participant
        for participant in exercise["participants"]
        if participant["id"] != "DAV"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF005_FULL_6X6_51" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_missing_cylinder_handicap_in_uvof006(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-006")
    exercise["materials"] = [
        material
        for material in exercise["materials"]
        if material["id"] != "CIL_D3_OPOSAT"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF006_CYLINDER_HANDICAPS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_second_2x1_defender_in_uvof007(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-007")
    second_action = next(
        action
        for phase in exercise["fases"]
        for action in phase["accions"]
        if action["actor"] == "EXT_2" and "2x1" in action["accio"]
    )
    second_action["accio"] = "jugar_2x1_amb_lateral_que_recupera_contra_D3"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF007_ORDERED_2X1" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_incomplete_51_in_uvof008(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-008")
    exercise["participants"] = [
        participant
        for participant in exercise["participants"]
        if participant["id"] != "DAV"
    ]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF008_FULL_6X6_51" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_ball_flow_in_uvof008(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-008")
    exercise["fases"][0]["fluxos_pilota"][0]["posseidor_final"] = "L_LOCAL"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF008_FULL_6X6_51" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_first_holder_in_uvof009(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-009")
    exercise["pilotes"][0]["posseidor_inicial"] = "PV"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF009_ORDERED_THREE_FLOWS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_provisional_restricted_space_cylinder_in_uvof009(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-009")
    cylinder = next(
        material
        for material in exercise["materials"]
        if material["id"] == "CIL_RESTRINGIT"
    )
    cylinder["estat_coneixement"] = "provisional"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF009_ORDERED_THREE_FLOWS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_opposite_lateral_passer_in_uvof010(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-010")
    exercise["organitzacio"]["passador_permuta"] = "EXT"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF010_ORDERED_CONDITIONAL_ACTION" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_unvalidated_pivot_cone_in_uvof010(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-010")
    cone = next(
        material for material in exercise["materials"]
        if material["id"] == "CON_PV"
    )
    cone["estat_coneixement"] = "provisional"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF010_ORDERED_CONDITIONAL_ACTION" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_broken_specific_l_ext_l_flow_in_uvof011(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-011")
    exercise["fases"][0]["fluxos_pilota"][1]["posseidor_final"] = "CE"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF011_SPECIFIC_L_EXT_L_FLOW" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_wrong_first_passer_in_uvof012(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-012")
    first_flow = exercise["fases"][0]["fluxos_pilota"][0]
    first_flow["posseidor_inicial"] = "PV"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF012_TWO_ORDERED_SUPERIORITIES" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_missing_pivot_flow_in_uvof013(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-013")
    exercise["fases"][0]["fluxos_pilota"].pop()

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF013_ORDERED_4X4_FIRST_POST" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_non_match_classification_in_uvof014(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-014")
    exercise["tipus_exercici"] = "situacio_partit_reduida"

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF014_FULL_MATCH_SITUATION" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_single_graphic_ball_as_only_ball_in_uvof015(
    valid_corpus, corpus_schema
):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-015")
    exercise["pilotes"] = exercise["pilotes"][:1]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "UVOF015_THREE_SIMULTANEOUS_DUELS" in [
        error["code"] for error in report["errors"]
    ]


def test_corpus_rejects_geometry(valid_corpus, corpus_schema):
    exercise = _corpus_exercise(valid_corpus, "TR-UVOF-015")
    exercise["coordenades"] = [{"x": 1, "y": 2}]

    report = validate_corpus_document(valid_corpus, corpus_schema)

    assert "CORPUS_NO_GEOMETRY" in [
        error["code"] for error in report["errors"]
    ]
