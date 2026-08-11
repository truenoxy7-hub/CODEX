# Gramàtica visual-funcional de TRAÇA

## Font i autoritat

La font operativa és [`knowledge/visual-functional-dictionary.v0.1.json`](../knowledge/visual-functional-dictionary.v0.1.json). Cada entrada declara definició, tipus, autoritat, estat, fonts, evidències, projecció visual i referències semàntiques. El renderer no conté convencions tàctiques independents: `visual-grammar.js` projecta el diccionari a estils executables.

L’ordre de treball cita un inventari de 103 evidències i una llegenda gràfica, però aquests fitxers no s’han rebut. El diccionari registra `reported_inventory_evidence_count: 103` i `imported_inventory_evidence_count: 0`. Només s’han activat les convencions confirmades explícitament; no s’han reconstruït evidències absents.

## Convencions actives

| Significat | Representació |
|---|---|
| atacant | cercle de contorn continu |
| atacant amb pilota | atacant més pilota adjacent |
| defensor | triangle de contorn continu |
| moviment sense pilota | línia contínua amb fletxa |
| passada | línia discontínua amb fletxa |
| finta de passada | passada més marca obliqua de cancel·lació |
| llançament | fletxa reforçada de doble traç |
| finta de llançament | llançament més marca obliqua |
| finta | trajectòria funcional amb canvi de direcció preservat |
| bloqueig/pantalla | relació de bloqueig amb marca perpendicular |
| blocatge defensiu | recorregut defensiu i marca perpendicular final |
| posició anterior o posterior | mateixa icona, sense farciment i amb contorn discontinu |
| desplaçament en bot | trajectòria ondulada amb fletxa |

El color pertany al tema i no defineix el significat. El tema actual diferencia atac i defensa per llegibilitat, però la forma és la convenció principal.

## Composicions, no glifs

- `2x1` no té una icona pròpia: es compon amb dos atacants, un defensor, estats i accions.
- Un interval o espai tàctic és una relació interna i no un objecte gràfic visible.
- Un encreuament no és simplement dues línies que es tallen: abans de dibuixar-lo cal resoldre actors, ordre i espais atacats.
- El lliscament del pivot reutilitza moviment, però la geometria universal continua no resolta.

## Identitat temporal

Una trajectòria connecta estats del mateix participant. Una passada connecta l’estat de l’emissor amb el del receptor. Quan la recepció és en carrera, moviment i passada acaben al mateix `participant_state`. Moure aquest estat recalcula els dos finals com a efectes derivats d’una única correcció.

## Responsabilitats

```text
diccionari → què significa i com es codifica
geometria  → on són estats, segments i relacions
renderer   → projecció SVG literal
editor     → correccions explícites, mai regles automàtiques
```

El renderer admet `M/L/C`, doble traç, ona visual, marques terminals o de cancel·lació i contorns temporals. No inventa espais, actors ni decisions.
