# Gramàtica visual de TRAÇA

## Principi

El renderer rep geometria i una gramàtica visual. No infereix tàctica, no
afegeix punts i no suavitza trajectòries. La geometria decideix on; la gramàtica
decideix com; el renderer només executa.

## Entitats mínimes

| Primitiva | Ús |
|---|---|
| `attacker` | participant d'atac |
| `defender` | participant defensiu real |
| `passer` | suport de passada |
| `pivot` | pivot atacant |
| `ball` | pilota i possessió visible |
| `cone` | límit, handicap o referència segons la semàntica del cas |
| `bench` | banc com a material funcional |
| `cylinder` | cilindre o handicap defensiu |

El color no defineix el rol canònic: és una decisió visual editable.

## Trajectòries mínimes

| Primitiva | Convenció |
|---|---|
| `movement` | línia contínua amb fletxa |
| `movement_without_ball` | línia contínua amb fletxa |
| `pass` | línia discontínua amb fletxa |
| `shot` | línia contínua destacada amb fletxa |
| `feint` | polilínia contínua; preserva tots els vèrtexs |
| `future_position` | referència discontínua sense confondre-la amb passada |

Els tipus geomètrics actuals es mapen amb àlies: `initial_pass` i
`return_pass` són `pass`; `run_without_ball` és `movement_without_ball`; i
`continuation` és `movement`.

## Superposicions

- `spatial_zone`: delimitació de treball visible només a la vista de control;
- `finishing_zone`: zona funcional de finalització;
- `defensive_reference`: línia o referència defensiva que permet comprovar la
  superació.

## Finta i canvi de direcció

Una finta no és una corba decorativa. Els punts representen atac a un espai,
compromís del defensor, canvi de direcció i de ritme, atac de l'espai contigu i
superació. Per això:

- `path_mode` és `polyline`;
- `preserve_vertices` és `true`;
- el renderer genera ordres SVG `M` i `L`;
- un ajust de vèrtex crea una correcció geomètrica explícita;
- cap funció de suavitzat pot alterar la lectura funcional.

## Vista neta i vista de control

La vista neta mostra la representació destinada a lectura de pista. La vista
de control afegeix zones, espais, identificadors, línies defensives, selecció i
tiradors de trajectòria. Canviar de vista no modifica el cas.
