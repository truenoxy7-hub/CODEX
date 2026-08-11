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
| `movement` | segments resolts continus amb fletxa |
| `movement_without_ball` | línia contínua amb fletxa |
| `pass` | línia discontínua amb fletxa |
| `shot` | línia contínua destacada amb fletxa |
| `feint` | segments funcionals; preserva el trencament direccional |
| `future_position` | referència discontínua sense confondre-la amb passada |
| `generic_action` | trajectòria provisional encara no canonitzada |

Els tipus geomètrics actuals es mapen amb àlies: `initial_pass` i
`return_pass` són `pass`; `run_without_ball` és `movement_without_ball`; i
`continuation` és `movement`.

## Espais i superposicions

- els espais tàctics relacionals no són primitives gràfiques i no es pinten;
- `spatial_zone`: límit físic de treball amb contorn subtil només a Control;
- `finishing_zone`: zona funcional de finalització;
- `defensive_reference`: línia o referència defensiva que permet comprovar la
  superació.

Control pot mostrar una àncora i una etiqueta petites per inspeccionar una
relació espacial. No pot mostrar rectangles, polígons farcits ni subdivisions
artificials dels intervals. La vista neta no mostra cap ajuda espacial interna.

Les posicions futures no són ajudes espacials: formen part de l’acció visible.
Reutilitzen forma, color i etiqueta del participant, amb farciment translúcid,
i apareixen sempre que una trajectòria visible hi comença o hi acaba. La
trajectòria toca el perímetre del símbol, no un punt flotant ni el seu centre.
Quan un jugador rep en carrera, el destí visual de la cursa i de la passada és
la mateixa posició futura, que també és l'origen de l'acció següent.

## Finta i canvi de direcció

Una finta no és una corba decorativa. Els punts representen atac a un espai,
compromís del defensor, canvi de direcció i de ritme, atac de l'espai contigu i
superació. Per això:

- `path_mode` és `functional_segments`;
- `preserve_vertices` és `true`;
- la geometria resol `cubic → line → cubic` i el renderer només emet `M/C/L`;
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
- **Control:** afegeix límits físics discrets, àncores relacionals,
  identificadors, línies defensives, estats futurs necessaris i tiradors.

Canviar de vista no modifica el cas.
