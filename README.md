# TRAÇA

TRAÇA és un projecte per construir un llenguatge canònic i una base de coneixement d'exercicis d'handbol. L'objectiu és transformar una explicació de l'entrenador en una interpretació traçable, una representació corregible i, quan existeix coneixement suficient, geometria reproduïble.

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

La font actual inclou el corpus canònic, els contractes, el diccionari visual-funcional i el bucle local supervisat:

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
- `knowledge/visual-functional-dictionary.v0.1.json`
- `docs/KNOWLEDGE_RESOLVER.md`
- `docs/REPRESENTATION_COMPOSER.md`

## Principi de treball

```text
text de l'entrenador o font original
→ fets explícits
→ interpretació semàntica provisional
→ composició provisional amb primitives conegudes, si és possible
→ preguntes directes per allò que falta
→ correcció i validació de l'entrenador
→ model i geometria del cas aprovats
→ SVG determinista
→ guardat i aprenentatge explícit
```

Una previsualització provisional no és un artefacte canònic. Canviar el text invalida totes les derivacions anteriors i obliga a regenerar abans de guardar.

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

La interfície s'obre amb un cas en blanc i redueix el flux normal a `ESCRIURE →
GENERAR → CORREGIR → GUARDAR`. Separa allò entès d'allò que falta, pregunta
emissor i receptor quan no els pot justificar, i reserva inspector, preflight,
constructor manual i Promotion Builder al mode avançat. UVOF015 només es carrega
explícitament com a exemple i regressió.

El `KnowledgeResolver` aplica autoritat explícita: cas canònic, coneixement
local validat per l'entrenador, vocabulari provisional i candidats que només
suggereixen. El `RepresentationComposer` compon una passada simple i la seva
recepció en carrera amb primitives conegudes; no és un intèrpret o resolutor
tàctic universal.

```bash
make interface
```

La interfície queda disponible a `http://localhost:8000` i també es pot obrir
directament. L’estat s’emmagatzema només a `localStorage` i es pot
exportar/importar com un paquet JSON v0.4, amb migració de 0.2 i 0.3. L’abast es documenta a
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
