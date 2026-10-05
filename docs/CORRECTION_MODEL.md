# Model de correcció

## Historial i revisió 2

El paquet v0.6 conserva l’overlay editable i l’historial atòmic (50 ordres),
separats de l’original generat immutable. Un arrossegament produeix un sol
esdeveniment, amb revisió d’origen, objectiu i efectes derivats sobre l’estat
compartit. Cancel·lar/pèrdua de captura restaura; l’últim pointerup es registra.
La transformació inversa queda congelada durant el gest per evitar que el
panell contextual mogui una figura sense haver mogut el punter.

Eliminar una dependència conserva referències irresoltes documentades i un
desfer; no inventa un substitut. Les còpies/miralls remapegen la clausura de
vincles, incloses accions anotades, sense aprovar-les com a tàctica nova.
Regenerar és un merge de tres vies sobre els IDs: les correccions compatibles
es conserven i els canvis incompatibles exigeixen elecció. La validació es
recalcula després del merge, no es tracta com una correcció editable.

Desar a SQLite no aprova. Les aprovacions d’acció tenen revisió i abast;
canvis geomètrics o semàntics les invaliden, mentre etiquetes/aparença poden
conservar-ne la traça. Els criteris reutilitzables s’aproven per separat.

## Esdeveniment

Cada correcció compleix
`schema/traca.correction-event.schema.v0.1.json`. A més del canvi tècnic
(`before`, `after`, operació i objectiu), conserva:

- `machine_diff` i `machine_explanation`, calculats pel sistema;
- `coach_explanation`, redactada i editable per l’entrenador;
- `concept_refs` i `context_refs`, preparats per comparar casos futurs;
- `correction_type`, `target_role` i `target_relation`;
- `change_role: primary` i una llista d'`derived_effects` explicables;
- autor, abast, estat, fonts i marca temporal.

## Classificació

- canviar què significa una trajectòria o acció és `semantic`;
- canviar interval, zona, contigüitat o relació és `spatial`;
- moure una posició o un vèrtex és `geometry`;
- canviar color, símbol, traç o convenció és `visual`.

Un moviment no es converteix en regla tàctica pel fet d’haver estat validat.

Quan es mou un participant, l'objectiu primari és el seu
`participant_state.position`, no el cercle ni cada fletxa per separat. El
sistema sincronitza l'entitat, els extrems dels moviments i les passades
enllaçades. Aquests canvis són efectes derivats del mateix esdeveniment i no
incrementen el recompte de correccions.

## Reconstrucció

Les correccions semàntiques i espacials es reprodueixen sobre els models de
treball. Les geomètriques s’apliquen a una còpia de `generatedGeometry` o de
`coach_reference_geometry`; les visuals, a una còpia de `baseVisualGrammar`.
Desfer, refer i reiniciar tornen a calcular l’estat, sense sobreescriure cap
font.

La reconstrucció executa després el reconciliador de dependències. Per això
desfer o refer una sola correcció d'estat restaura de manera coherent totes les
seves conseqüències visuals.

## Validació i similitud futura

El preflight s’executa abans de validar. Els events passen de `draft` a
`validated` només per al cas. Els camps de concepte, context, rol i relació
permetran cercar correccions semblants més endavant sense necessitat
d’embeddings en aquest MVP.

La generalització està documentada a
[`KNOWLEDGE_PROMOTION.md`](KNOWLEDGE_PROMOTION.md). Cap esdeveniment entra
automàticament en un candidat.
