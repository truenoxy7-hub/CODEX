# TRAÇA

TRAÇA és un projecte per construir un llenguatge canònic i una base de coneixement d'exercicis d'handbol. L'objectiu és transformar exercicis descrits en text i gràfics originals en una representació semàntica verificable i, només després, generar-ne una geometria i un SVG deterministes.

## Estat actual

El projecte es troba en la fase de **modelatge semàntic, preflight espacial i
primer MVP d'aprenentatge supervisat**.
La primera família completa és `MITJANS 1V1 OFENSIUS`, amb `TR-UVOF-001` a
`TR-UVOF-015` interpretats i validats amb l'entrenador.

Els quinze artefactes qualitatius han migrat al contracte
`spatial-relations` v0.3. El preflight comprova traçabilitat, preservació i
resolubilitat de l'entrada. UVOF015 disposa ja d'un primer resolutor geomètric
canònic; un artefacte pot ser estructuralment vàlid i continuar `partial` o
`blocked`.

La geometria i el renderer anteriors es consideren prototips descartables. No s'han de reprendre com a font de veritat. La font actual és:

- `exercises/TR-UVOF-001/semantic.json`
- `corpus/uvof.semantic.json`
- `schema/traca.semantic.schema.v1.0.json`
- `schema/traca.exercise-corpus.schema.v1.1.json`
- `exercises/TR-UVOF-001/spatial-relations.json`
- `exercises/TR-UVOF-002/spatial-relations.json`
- `exercises/TR-UVOF-003/spatial-relations.json`
- `exercises/TR-UVOF-004/spatial-relations.json`
- `exercises/TR-UVOF-005/spatial-relations.json`
- `exercises/TR-UVOF-006/spatial-relations.json`
- `exercises/TR-UVOF-007/spatial-relations.json`
- `exercises/TR-UVOF-008/spatial-relations.json`
- `exercises/TR-UVOF-009/spatial-relations.json`
- `exercises/TR-UVOF-010/spatial-relations.json`
- `exercises/TR-UVOF-011/spatial-relations.json`
- `exercises/TR-UVOF-012/spatial-relations.json`
- `exercises/TR-UVOF-013/spatial-relations.json`
- `exercises/TR-UVOF-014/spatial-relations.json`
- `exercises/TR-UVOF-015/spatial-relations.json`
- `schema/traca.spatial-relations.schema.v0.3.json`
- `schema/traca.spatial-relations.schema.v0.2.json` (històric, read-only)
- `scripts/spatial_preflight.py`
- `config/handball-court.ihf-2025.json`
- `schema/traca.geometry.schema.v0.2.json`
- `schema/traca.geometry.schema.v0.1.json` (històric, read-only)
- `exercises/TR-UVOF-015/geometry.json`
- `scripts/resolve_geometry.py`
- `docs/DOMAIN_MODEL.md`
- `docs/SPATIAL_RELATIONS_CONTRACT.md`
- `docs/GEOMETRY_CONTRACT.md`
- `docs/LEARNING_WORKFLOW.md`
- `docs/VISUAL_GRAMMAR.md`
- `docs/CORRECTION_MODEL.md`
- `docs/DECISIONS.md`
- `docs/OPEN_QUESTIONS.md`

## Principi de treball

```text
text original + gràfic original
→ fets explícits
→ interpretació semàntica provisional
→ validació de l'entrenador
→ model semàntic aprovat
→ geometria derivada
→ SVG determinista
→ contrast final
```

No es genera geometria ni gràfic abans de validar la semàntica.

## Validació local

```bash
python -m pip install -r requirements.txt
make check
```

Equivalentment:

```bash
python scripts/validate_semantic.py
python -m pytest -q
```

## Workspace universal de l’MVP

La interfície accepta qualsevol descripció nova i avança fins on arriba el
coneixement local. Separa conceptes validats, coincidències provisionals,
desconeguts i preguntes; permet completar el model, guardar casos sense
resolver i crear una referència manual que mai es confon amb geometria
generada. UVOF015 continua sent l’espècimen executable i la regressió canònica.

El matcher actual és local i auditable; no és un intèrpret tàctic general. El
workspace no inventa geometria ni presenta una adaptació d’UVOF015 com si fos
un cas nou. Validar un cas tampoc promociona cap regla.

```bash
make interface
```

La interfície queda disponible a `http://localhost:8000` i també es pot obrir
directament. L’estat s’emmagatzema només a `localStorage` i es pot
exportar/importar com un paquet JSON v0.3. L’abast es documenta a
[`docs/MVP.md`](docs/MVP.md) i
[`docs/UNIVERSAL_CASE_WORKFLOW.md`](docs/UNIVERSAL_CASE_WORKFLOW.md).

Per veure exclusivament la matriu read-only del preflight:

```bash
python scripts/spatial_preflight.py
```

## Com començar amb Codex

Obre aquest repositori a Codex i utilitza el contingut de
`CODEX_START_PROMPT.md`. El treball viu de coneixement i relacions espacials es
manté a la issue #3.

## Documents per començar

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/DOMAIN_MODEL.md`
4. `docs/DECISIONS.md`
5. `docs/CURRENT_STATE.md`
6. `docs/OPEN_QUESTIONS.md`
7. `docs/CODEX_FIRST_TASK.md`
8. `CODEX_START_PROMPT.md`
