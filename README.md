# TRAÇA

TRAÇA és un projecte per construir un llenguatge canònic i una base de coneixement d'exercicis d'handbol. L'objectiu és transformar exercicis descrits en text i gràfics originals en una representació semàntica verificable i, només després, generar-ne una geometria i un SVG deterministes.

## Estat actual

El projecte es troba en la fase de **modelatge semàntic**. El primer exercici de referència és `TR-UVOF-001`, de la família `MITJANS 1V1 OFENSIUS`.

La geometria i el renderer anteriors es consideren prototips descartables. No s'han de reprendre com a font de veritat. La font actual és:

- `exercises/TR-UVOF-001/semantic.json`
- `schema/traca.semantic.schema.v1.0.json`
- `docs/DOMAIN_MODEL.md`
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

## Com començar amb Codex

Obre aquest repositori a Codex i utilitza el contingut de `CODEX_START_PROMPT.md`. La primera tasca ja està registrada a la issue #1.

## Documents per començar

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/DOMAIN_MODEL.md`
4. `docs/DECISIONS.md`
5. `docs/CURRENT_STATE.md`
6. `docs/OPEN_QUESTIONS.md`
7. `docs/CODEX_FIRST_TASK.md`
8. `CODEX_START_PROMPT.md`
