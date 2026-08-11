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
| `goalkeeper` | porter o portera |
| `generic_participant` | participant encara no canonitzat |
| `ball` | pilota i possessió visible |
| `cone` | límit, handicap o referència segons la semàntica del cas |
| `bench` | banc com a material funcional |
| `cylinder` | cilindre o handicap defensiu |
| `generic_material` | material encara no canonitzat |

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
| `generic_action` | trajectòria provisional encara no canonitzada |

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

## Capes d’autoritat visual

1. `baseVisualGrammar`: diccionari base immutable durant el cas;
2. `caseVisualOverrides`: correccions que afecten només el cas actual;
3. `visual_rule_candidates`: propostes explícites de reutilització;
4. `validated_visual_dictionary`: convencions globals aprovades fora d’aquest
   flux.

Un override individual no canvia la gramàtica base i una validació de cas no
el converteix en regla global.

## Vistes

- **Generat:** proposta original del resolver, read-only.
- **Corregit:** geometria de treball amb correccions del cas.
- **Comparar:** original en ghost blanc i resultat corregit sòlid, read-only.
- **Control:** afegeix zones, espais, identificadors, línies defensives i
  tiradors de trajectòria.

Canviar de vista no modifica el cas.
