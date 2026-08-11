# Compositor global de representacions

## Frontera arquitectònica

```text
text de l’entrenador
  → Interpretation / KnowledgeResolver
  → TacticalIR estructurat
  → CompositionGraph
  → operator registry
  → CompositionPlan + constraints + ball flow
  → composition preflight
  → geometry resolver, només si hi ha prou relacions
  → primitives geomètriques
  → renderer literal
```

`RepresentationComposer` no rellegeix text, no consulta `exercise_id`, no tria una plantilla UVOF i no interpreta tàctica al renderer. Rep `tacticalIR` o `interpretation.tactical_ir`. El contracte públic és [`traca.tactical-ir.schema.v0.1.json`](../schema/traca.tactical-ir.schema.v0.1.json); la sortida auditable és [`traca.composition-plan.schema.v0.1.json`](../schema/traca.composition-plan.schema.v0.1.json).

## TacticalIR i graf

El TacticalIR conté participants, estats, pilotes, materials, espais, accions, decisions, fases, fluxos i relacions, sempre amb autoritat i `source_refs`. `CompositionGraph` els converteix en nodes tipats i arestes com `actor`, `target`, `opponent`, `partner`, `follows`, `simultaneous` o `belongs_to_phase`. L’ordre d’execució és topològic i determinista; un cicle temporal bloqueja el pla.

## Operadors

El registre actual inclou:

| Operador | Entrada semàntica | Composició | Geometria |
|---|---|---|---|
| `movement` | moviment, recuperació | estats origen/destí + trajectòria | amb posició o espai resoluble |
| `dribble` | desplaçament amb bot | moviment + possessió estable | amb origen/destí resolts |
| `pass` | passada | emissor, receptor, pilota i estat receptor | amb dos estats posicionats |
| `reception` | recepció | comparteix l’estat d’arribada de la passada | condicional; moviment si és en carrera |
| `shot` | llançament/finalització | posseïdor → porteria | amb posició de llançament |
| `feint` | finta/1x1 | atac inicial, oposició, contigüitat i sortida | parcial; exigeix waypoints funcionals explícits |
| `block` | bloqueig/pantalla | relació bloquejador-defensor | amb posicions relacionals |
| `numerical_relation` | 2x1, 2x2, 3x2 | participants + relació; sense glif propi | relacional, no crea coordenades |
| `permutation` | permuta | intercanvi de posicions funcionals | si les posicions inicials són resoltes |
| `crossing` | encreuament | actors, ordre i atac de l’espai contrari | no resolta universalment |
| `pivot_slide` | lliscament de pivot | moviment proper a 6 m | només amb destí explícit |

Afegir una família nova exigeix un operador registrat amb slots obligatoris, primitives, constraints, traçabilitat i proves. No s’afegeix un `if` per exercici.

## Estats compartits i pilota

`StateRegistry` manté identitats temporals estables. Si una passada precedeix una recepció, el final de la passada, el final de la cursa i l’inici de l’acció següent reutilitzen el mateix `participant_state`. `BallFlow` valida el posseïdor abans de passada, bot o llançament i registra cada transició. Una recuperació sense pilota no altera la possessió.

## Constraints abans de coordenades

Els operadors produeixen relacions `ATTACKS`, `OPPOSES`, `CONTIGUOUS`, `SURPASSES_DEFENSIVE_LINE`, `BLOCKS`, `NUMERICAL_RELATION`, `OCCUPIES_FUNCTIONAL_POSITION`, `CROSSES_RELATIVE_TO` o `NEAR_6M`. La contigüitat d’intervals es deriva només si comparteixen el delimitador defensiu correcte o si està declarada explícitament.

El preflight comprova participants, estats, materials amb equivalència oposicional, possessió, slots, candidats aplicats, cicles i conflictes. Dues regles incompatibles retornen `blocked`; no se n’escull una silenciosament.

## Estats de resultat

- `ready`: totes les accions estan compostes i no hi ha preguntes ni conflictes.
- `partial`: almenys una acció està composta i una altra continua no resolta o no suportada.
- `needs_input`: falten slots obligatoris; la sortida inclou preguntes ordenades pel nombre d’accions que desbloquegen.
- `unsupported`: no hi ha cap operador aplicable.
- `blocked`: hi ha una contradicció estructural.

`composition_status` i `geometry_status` són independents. Un pla pot estar `ready` i la geometria `needs_input`.

## Autoritat i no-invenció

Un slot obligatori només es pot omplir des d’entrada explícita, corpus/relacions validats, coneixement local validat o una regla validada. Un candidat pot aparèixer com a suggeriment, però no decideix. El resolutor geomètric només usa posicions explícites, posicions funcionals ja resoltes o l’àncora d’un espai justificat. No existeix cap graella arbitrària per rol o índex.

## Traçabilitat i determinisme

Cada acció del pla apunta a l’acció semàntica i a la versió de l’operador; cada primitiva apunta a l’acció i al diccionari; cada element geomètric apunta a la primitiva. Els IDs derivats i el fingerprint del pla són estables. Cent execucions de la mateixa entrada produeixen el mateix fingerprint.

La cobertura del corpus es publica a [`COMPOSER_COVERAGE.md`](COMPOSER_COVERAGE.md).
