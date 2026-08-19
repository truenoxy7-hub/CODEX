# Cobertura del compositor global

## Mètode

`scripts/composer_coverage.py` utilitza els 15 UVOF com a banca d’acceptació, mai com a plantilles geomètriques. Classifica de manera genèrica transicions espacials tipades, fluxos de pilota, relacions tipades i accions semàntiques especials. No consulta l’ID de l’exercici per decidir cap operador.

El resultat actual és:

- 15/15 exercicis auditats;
- 203 unitats estructurades disponibles;
- 175/203 (86,21%) amb família d’operador reconeguda;
- 164/203 (80,79%) amb relacions mínimes suficients per a composició;
- 0/203 amb geometria genèrica completa des d’aquesta banca.

El 0% geomètric és deliberat: els contractes espacials declaren `geometria_resolta: no_inclosa`. UVOF015 conserva el seu resolver i `geometry.json` com a regressió independent; no es compta com a prova que el resolutor genèric pugui inventar coordenades.

## Matriu d’operadors

| ACTION / COMPOSITION | SEMANTIC SUPPORT | COMPOSITION SUPPORT | GEOMETRY SUPPORT | VISUAL SUPPORT | STATUS | NOTES |
|---|---|---|---|---|---|---|
| movement | sí | sí | condicional | sí | partial | necessita origen/destí resolubles |
| dribble | sí | sí | condicional | sí | partial | conserva el mateix posseïdor |
| pass | sí | sí | condicional | sí | partial | emissor i receptor obligatoris |
| reception | sí | sí | condicional | composició | partial | comparteix l’estat de recepció |
| shot | sí | sí | condicional | sí | partial | exigeix posició de llançament |
| feint / 1x1 | sí | sí | condicional | sí | partial | contigüitat i canvi funcional obligatoris |
| block | sí | sí | condicional | sí | partial | material només amb equivalència oposicional |
| 2x1 / NxM | sí | sí | relacional | composició | partial | no té glif propi |
| permutation | sí | sí | condicional | composició | partial | intercanvia posicions funcionals |
| crossing | sí | sí | unresolved | composició | partial | falta resolució geomètrica universal |
| pivot slide | sí | sí | condicional | composició | partial | manté la relació amb 6 m |

## Cobertura per exercici

| Exercici | Unitats | Operadors reconeguts | Relacions suficients | Composition | Geometry | Informació que falta | Unsupported |
|---|---:|---|---:|---:|---:|---|---|
| TR-UVOF-001 | 10 | feint, movement, numerical_relation, pass, reception | 8/10 | 80,00% | 0% | tipus concret de resolució | `resolucio` |
| TR-UVOF-002 | 21 | crossing, feint, movement, pass, reception | 18/21 | 85,71% | 0% | slots de crossing; tipus de resolució | `resolucio` |
| TR-UVOF-003 | 23 | block, crossing, movement, numerical_relation, pass | 18/23 | 78,26% | 0% | defensor del block; slots de crossing; resolució | `resolucio` |
| TR-UVOF-004 | 18 | movement, numerical_relation, pass, reception | 15/18 | 83,33% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-005 | 6 | movement | 3/6 | 50,00% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-006 | 20 | crossing, movement, numerical_relation, pass, reception | 16/20 | 80,00% | 0% | slots de crossing; resolució | `resolucio` |
| TR-UVOF-007 | 7 | crossing, movement, numerical_relation | 4/7 | 57,14% | 0% | slots de crossing; resolució | `resolucio` |
| TR-UVOF-008 | 7 | crossing, movement, pass | 5/7 | 71,43% | 0% | slots de crossing; resolució | `resolucio` |
| TR-UVOF-009 | 16 | movement, numerical_relation, pass, permutation, pivot_slide, reception | 13/16 | 81,25% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-010 | 12 | movement, pass, permutation, pivot_slide, reception | 11/12 | 91,67% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-011 | 7 | movement, pass, permutation, reception | 7/7 | 100,00% | 0% | — | — |
| TR-UVOF-012 | 16 | movement, numerical_relation, pass, permutation, pivot_slide, reception | 13/16 | 81,25% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-013 | 10 | movement, pass, permutation, pivot_slide, reception | 9/10 | 90,00% | 0% | tipus de resolució | `resolucio` |
| TR-UVOF-014 | 6 | movement, pass, permutation, reception | 6/6 | 100,00% | 0% | — | — |
| TR-UVOF-015 | 24 | feint, movement, pass, reception | 18/24 | 75,00% | 0% | tipus de resolució | `resolucio` |

## Lectura per a la iteració següent

Els buits prioritaris són: tipar `resolucio` abans de compondre, completar els dos actors i espais de l’encreuament, vincular el defensor concret del bloqueig i traduir relacions qualitatives validades a geometria sense defaults. Afegir coordenades genèriques per rol no augmentaria cobertura real.
