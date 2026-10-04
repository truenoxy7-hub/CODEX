# Contracte de geometria derivada v0.4

## Propòsit

Aquesta capa converteix relacions espacials resolubles en metres de pista sense
modificar la semàntica ni les relacions d'origen. El resolver general v0.4
resol la primera cadena executable sense coordenades manuals: passada,
recepció en carrera, finta amb canvi de direcció i relació oberta de 2x1.
UVOF015 es conserva com a cas canònic i entra al mateix contracte mitjançant un
adaptador explícit, sense reescriure el seu artefacte històric v0.2.

```text
semàntica validada
  → TacticalIR / relacions espacials v0.3
  → CompositionPlan + constraints
  → composition preflight ready
  → geometria derivada v0.4 + obligacions + validació física
  → renderer SVG literal
```

## Perfil de pista

`config/handball-court.ihf-2025.json` conserva les mesures de les Rules of the
Game for Indoor Handball vigents des de l'1 de juliol de 2025: pista de 40 ×
20 m, porteria de 3 × 2 m, àrea de 6 m, línia discontínua de 9 m i línies de 7
i 4 m.

`interface/js/court-geometry.js` és l'única font executable de la forma de la
pista. Construeix l'àrea amb el tram recte de 3 m davant la porteria i els arcs
de 6 m centrats als pals, deriva la línia discontínua de 9 m i exposa les
mateixes funcions al resolver, al validador i al renderer. També calcula
distàncies, mostreja línies i corbes i obté el `viewBox` útil sense ocultar
porteria, 6 m ni 9 m.

## Garanties

- l'entrada ha de superar el preflight amb estat `ready`;
- els fingerprints de la pista i del contracte espacial queden registrats;
- cap alternativa decisional queda seleccionada a `geometry.json`;
- les dotze alternatives d'UVOF015 es resolen separadament;
- cada entitat, estat i trajectòria apunta a la font que la justifica;
- la política visual provisional es declara explícitament;
- `composition_status` i `geometry_status` es calculen separadament;
- `renderability_status`, `geometry_validation_status` i
  `tactical_validation_status` no es col·lapsen en una sola garantia;
- el resolver general no consulta `exercise_id` ni distribueix participants en
  una graella per rol o índex;
- cada primitiva visual crea una obligació comprovable i cada obligació queda
  `satisfied`, `unsatisfied` o `conflicting`;
- si una relació qualitativa no determina una posició, retorna `needs_input`
  o `partial`, emet un diagnòstic accionable i conserva la composició;
- una àncora manual incompatible amb una relació tàctica es declara com a
  conflicte: mai no guanya silenciosament.
- tota trajectòria a terra queda fora de l'àrea de porteria i respecta el marge
  provisional dels símbols;
- una pilota inicial visible és única i les passades conserven el seu
  `ball_ref`.

## Política relacional provisional

La posició és una conseqüència del graf, no una entrada obligatòria. El
resolver ordena els delimitadors defensius a partir dels intervals `between`,
els situa sobre una línia defensiva declarada com a política provisional i
calcula la regió útil de cada espai com un interval transversal. Cada regió
conserva àncores funcionals de recepció, amenaça i sortida. La recepció es
deriva de la línia de 9 m i la sortida es manté fora de l'àrea de 6 m. A partir
d'aquestes àncores:

- `ATTACKS` col·loca l'estat d'aproximació davant de l'espai;
- la passada enllaça els estats de l'emissor i del receptor;
- la recepció reutilitza el mateix estat de destí de la passada;
- `CONTIGUOUS`, `OPPOSES` i la sortida de la finta determinen aproximació,
  compromís del defensor, trencament de direcció i sortida;
- `NUMERICAL_RELATION` conserva tots els participants de l'acció i obre
  visualment el 2x1, però no inventa una resolució final. El portador principal
  es deriva de l'acció predecessora i suport i defensor es col·loquen respecte
  de les arestes del graf, no de l'ordre de les llistes ni dels IDs.

Les coordenades resultants no són coneixement tàctic. Cada decisió queda a
`meta.policy.decisions` amb la relació que la justifica i es pot substituir
després d'una validació de l'entrenador.

## Espais relacionals i límits físics

Un espai tàctic no és una primitiva gràfica. `spaces` conserva la relació
`between`, els delimitadors, un `anchor` d'inspecció i una
`calculation_region` interna, sempre amb `render_policy: hidden`. La vista neta
no dibuixa cap d'aquests camps. La vista de control només pot mostrar una
àncora i una etiqueta petites.

Les zones d'UVOF015 representen límits físics de la tasca materialitzats pels
cons. Poden tenir polígon intern i contorn discret a Control, sense farciment;
desapareixen a la vista neta.

Un delimitador defensiu implícit pot aparèixer com a
`contextual_reference`: orienta la lectura de l'interval amb un símbol obert,
però declara `active_participant: false` i no es converteix en oponent.

## Estats persistents i dependències

Cada posició temporal d'un participant és un `participant_state` amb identitat
estable, fase, posició i estat `current`, `future` o `past`. Les entitats
visibles apunten al seu estat actual. Una trajectòria de moviment declara
`actor_ref`, `from_state_ref` i `to_state_ref`; una passada declara també
pilota, emissor i receptor. Una posició futura es mostra sempre que sigui
l’origen o el destí d’una trajectòria visible; reutilitza el mateix símbol del
participant sense farciment i amb contorn discontinu. Només és editable a Control.

En una recepció en carrera, la cursa sense pilota, la passada que retorna la
pilota i l'acció posterior comparteixen un únic `participant_state`: el
moviment i la passada hi acaben, i la resolució hi comença. No es poden crear
posicions futures diferents per representar aquests tres moments del mateix
punt de recepció.

`dependencies` declara quins símbols, moviments i passades depenen de cada
estat. Moure un estat és una única correcció principal: el workspace recalcula
els efectes derivats, els enumera a l'historial i no crea correccions noves.

`balls` materialitza només l'estat inicial visible de cada pilota. `ball_flow`
manté la identitat i el canvi de posseïdor de cada passada; el renderer no
duplica la pilota al destí ni dibuixa una resolució que el text no declari.

## Segments funcionals

Les trajectòries canòniques utilitzen segments `line` i `cubic`, amb inici,
final i controls explícits. El resolver —no el renderer— determina la corba.
La finta general conserva una seqüència funcional d'aproximació, compromís,
trencament, separació, bypass i sortida. Els punts `commitment`,
`direction_break`, `clearance` i `exit` fan mesurables el canvi de direcció, la
proximitat inicial, la separació de l'oponent i l'entrada a l'interval
objectiu. L'adaptador
d'UVOF015 conserva literalment els seus trams `cubic → line → cubic`; cap dels
dos casos es pot substituir per un suavitzat genèric.

Les passades s'enllacen als estats dels participants. El renderer en retalla
només la presentació al perímetre dels símbols (`symbol_perimeter`), sense
alterar la geometria tàctica ni guardar extrems flotants.

## Obligacions i diagnòstics

`obligations` és la prova executable que la figura diu tot el que exigeix la
composició. Com a mínim cobreix cada primitiva, l'estat compartit de recepció,
la relació numèrica i qualsevol superació de línia defensiva. `result.summary`
compta les obligacions satisfetes, pendents i en conflicte; `diagnostics`
explica per què una obligació no s'ha pogut representar.

Una geometria és `ready` només quan no hi ha obligacions pendents ni
conflictes. Pot ser `partial`, `needs_input` o `blocked` sense degradar ni
modificar el `CompositionPlan`.

`validation` separa tres famílies de comprovacions:

- `renderability`: referències, segments i punts necessaris per produir SVG;
- `geometry`: pista, marges, finta funcional, 2x1 i continuïtat de pilota;
- `tactical`: sempre `not_validated_by_coach` per a la política generada.

Cada comprovació publica estat, mesures i `source_refs`. Un error físic
bloqueja `ready`; superar els tests automàtics no converteix els llindars
provisionals en coneixement tàctic.

## Límits

Les coordenades de cons, participants i amplades de zona són una política de
lectura simètrica per a l'MVP. No són coneixement tàctic validat. El resolver
pot revisar-les sempre que preservi relacions, límits físics, contigüitats,
línies defensives i alternatives. El renderer no pot inventar geometria.

El resolver general actual cobreix passada, recepció en carrera, finta i
relació numèrica oberta quan el graf identifica participants, espais i
delimitadors. No decideix a quin jugador acaba una superioritat, no afegeix
una passada o un llançament final i no converteix un delimitador estructural en
oponent actiu. L’encreuament no té encara geometria universal i el lliscament
de pivot necessita un destí resoluble. Un pla `ready` pot, per tant, tenir
geometria `partial` o `needs_input`.

Els casos reproduïbles A1–A3 són a `examples/general-geometry/`; el generador
`scripts/generate_general_geometry_examples.js` produeix TacticalIR,
geometria v0.4 i SVG a partir del mateix pipeline de la interfície. La
comparació amb la versió v0.3 és a `examples/general-geometry/COMPARISON.md`.

L'adaptador d'UVOF015 preserva tres branques, dotze alternatives i els fluxos
de pilota històrics. El validador v0.4 detecta que algunes trajectòries v0.2
entren a l'àrea recta de 6 m i retorna `blocked`. Aquesta regressió física queda
visible fins que es regeneri l'artefacte; no es desactiva el validador ni es
codifica cap excepció per exercici.

## Còpia de treball editable

La interfície carrega la geometria canònica d'UVOF015 com a
`generatedGeometry` immutable i en crea una còpia `workingGeometry`. Les
correccions actuen sobre estats, segments o convencions visuals de la còpia.
Desfer, refer i reiniciar reconstrueixen el resultat des de l'original i tornen
a executar les dependències.

La validació pot congelar `validatedGeometry` com a versió del cas. No modifica
`geometry.json`, no retorna coordenades a la capa espacial i no promociona cap
correcció a regla general.
