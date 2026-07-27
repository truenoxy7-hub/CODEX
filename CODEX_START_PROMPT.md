# Ordre d'arrencada per a Codex

Treballa sobre el repositori `truenoxy7-hub/CODEX` i resol la issue #1.

Abans de modificar res:

1. Llegeix íntegrament `AGENTS.md`.
2. Llegeix `docs/PROJECT_CONTEXT.md`, `docs/DOMAIN_MODEL.md`, `docs/DECISIONS.md`, `docs/CURRENT_STATE.md`, `docs/OPEN_QUESTIONS.md` i `docs/CODEX_FIRST_TASK.md`.
3. Inspecciona `exercises/TR-UVOF-001/semantic.json` i `schema/traca.semantic.schema.v1.0.json`.
4. Executa els tests de base.

Implementa exclusivament el validador semàntic executable i les seves proves positives i negatives. No generis coordenades, geometria, SVG ni PNG. No reinterpretis decisions tàctiques. Qualsevol ambigüitat s'ha de registrar com a pregunta per a l'entrenador.

En acabar:

- executa `make check`;
- resumeix els fitxers modificats;
- enumera els invariants implementats;
- indica qualsevol punt provisional;
- prepara un pull request que segueixi `.github/pull_request_template.md`.
