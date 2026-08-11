# Model de correcció

## Esdeveniment

Cada correcció compleix
`schema/traca.correction-event.schema.v0.1.json`. A més del canvi tècnic
(`before`, `after`, operació i objectiu), conserva:

- `machine_diff` i `machine_explanation`, calculats pel sistema;
- `coach_explanation`, redactada i editable per l’entrenador;
- `concept_refs` i `context_refs`, preparats per comparar casos futurs;
- `correction_type`, `target_role` i `target_relation`;
- autor, abast, estat, fonts i marca temporal.

## Classificació

- canviar què significa una trajectòria o acció és `semantic`;
- canviar interval, zona, contigüitat o relació és `spatial`;
- moure una posició o un vèrtex és `geometry`;
- canviar color, símbol, traç o convenció és `visual`.

Un moviment no es converteix en regla tàctica pel fet d’haver estat validat.

## Reconstrucció

Les correccions semàntiques i espacials es reprodueixen sobre els models de
treball. Les geomètriques s’apliquen a una còpia de `generatedGeometry` o de
`coach_reference_geometry`; les visuals, a una còpia de `baseVisualGrammar`.
Desfer, refer i reiniciar tornen a calcular l’estat, sense sobreescriure cap
font.

## Validació i similitud futura

El preflight s’executa abans de validar. Els events passen de `draft` a
`validated` només per al cas. Els camps de concepte, context, rol i relació
permetran cercar correccions semblants més endavant sense necessitat
d’embeddings en aquest MVP.

La generalització està documentada a
[`KNOWLEDGE_PROMOTION.md`](KNOWLEDGE_PROMOTION.md). Cap esdeveniment entra
automàticament en un candidat.
