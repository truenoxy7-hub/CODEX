from __future__ import annotations

from copy import deepcopy

import pytest

from scripts.validate_semantic import SEMANTIC_RULES, validate_document


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
                    "tipus_utilitzat_exercici": "banc",
                    "equivalencia": "substitut_de_defensor_directe",
                }
            ],
            "espais_i_intervals": [
                {
                    "id": "INT_2",
                    "tipus": "interval_contigu",
                    "relacio": "interior_de_REF_1X1",
                },
                {
                    "id": "INT_4",
                    "tipus": "interval_contigu",
                    "relacio": "entre_D_Z2_i_C3",
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
                    "sequencia_obligatoria": [
                        {"ordre": 1, "accio": "recuperar_sense_pilota"},
                        {
                            "ordre": 2,
                            "accio": "rebre_en_carrera",
                            "origen_passada": "EXT",
                            "condicions": ["passada_curta", "sense_bot"],
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
    assert report["summary"]["semantic_checks_run"] == 9


MUTATIONS = (
    ("VAL-1X1-01", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][0].update(destinacio="INT_X")),
    ("VAL-1X1-02", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][1].update(des_de="INT_X")),
    ("VAL-1X1-03", lambda doc: doc["model_exercici"]["espais_i_intervals"][0].update(tipus="interval_recepcio")),
    ("VAL-1X1-04", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][1].update(forma_funcional="corba")),
    ("VAL-1X1-05", lambda doc: doc["model_exercici"]["subaccions"][0]["sequencia_obligatoria"][-1].update(accio="passar")),
    ("VAL-1X1-06", lambda doc: doc["model_exercici"]["referencies_oposicionals"][0].update(equivalencia="decoratiu")),
    ("VAL-SA2-01", lambda doc: doc["model_exercici"]["subaccions"][1]["recuperacio"].update(amb_pilota=True)),
    ("VAL-SA2-02", lambda doc: doc["model_exercici"]["subaccions"][1]["sequencia_obligatoria"][1].update(condicions=["passada_curta"])),
    ("VAL-SA2-03", lambda doc: doc["model_exercici"]["espais_i_intervals"][1].update(relacio="davant_D_Z2")),
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
    assert len(SEMANTIC_RULES) == 9
