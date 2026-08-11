# Contracte de relacions espacials v0.3

## Propòsit

El contracte converteix la semàntica tàctica validada en un graf qualitatiu que
un futur motor espacial podrà resoldre. Defineix **què ha de quedar relacionat**
sense decidir encara **a quines coordenades** s'ha de dibuixar.

Les quinze instàncies, de `TR-UVOF-001` a `TR-UVOF-015`, compleixen
`schema/traca.spatial-relations.schema.v0.3.json`. Complir l'esquema no implica
estar preparat per a un resolutor: el preflight pot retornar `partial` o
`blocked` sense invalidar estructuralment el document.

L'esquema v0.2 es conserva com a versió històrica read-only. La migració és
explícita `0.2.0 → 0.3.0` i no existeix cap downgrade implícit.

## Límits de la capa

El contracte pot contenir:

- participants, materials i referències reglamentàries;
- intervals i zones definits per altres referents;
- ocupacions i relacions vigents en un moment de la tasca;
- transicions entre espais;
- alternatives espacials associades a una decisió tàctica;
- invariants que el futur resolutor haurà de conservar.

No pot contenir:

- `x`, `y`, punts, vèrtexs ni distàncies gràfiques;
- geometria resolta;
- instruccions SVG;
- una solució única per a una situació decisional oberta;
- relacions tàctiques noves no presents a la font, tret que es marquin com a
  `provisional`.

## Traçabilitat i tipus de v0.3

Cada artefacte declara:

- `semantic_source`: exercici, versió, candidats, estat canònic/conflictiu i
  digest SHA-256 del fragment exacte;
- `integrity.spatial_digest`: fingerprint determinista del mateix document,
  excloent el valor del digest;
- referències estables en forma `camí/artefacte.json#/JSON/Pointer`;
- `namespace.entities`: identitats globals tipades
  `traca:TR-UVOF-NNN:tipus:ID`, contrastades amb les entitats reals;
- `bindings`: correspondència entre actors genèrics de la font i instàncies
  participants;
- `participant_semantics`: equip, rol canònic, costat, rol temporal i funció
  com a dimensions separades. Un camp absent queda `unknown`; no es parteixen
  ni interpreten strings compostes;
- `participant_groups`: cardinalitat esperada i instàncies identificables;
- `material_semantics`: funció i capabilities declarades per instància, mai
  deduïdes de la forma física;
- `typed_relations`: papers diferenciats d'atacant principal, suport i
  defensor als 2x1;
- `typed_conditions`: condició de tasca, estat, observació o predicat, amb
  referència al literal d'origen;
- `operator_frames`: eix, punt de vista, proximitat i tancament per als
  operadors ambigus;
- `decision_mappings`: una entrada individual per cada opció semàntica, encara
  que només es pugui preservar simbòlicament;
- `semantic_coverage`: inventari de preservació de participants, materials,
  pilotes, accions, fluxos, decisions i opcions;
- `dependencies`: arestes tipades que permeten detectar cicles no ancorats;
- `replication`: simetria pendent o mapping explícit d'identitats, sense
  duplicació inferida;
- `unresolved_items`: buits coneguts, impacte i necessitat d'entrenador.

Els valors `validated`, `provisional`, `unknown` i `unresolved` conserven l'estat
del coneixement. Un valor provisional o unresolved que afecti el preflight no
es promociona silenciosament.

## Model de graf

### 1. Nodes

Un node és una entitat que pot definir o ocupar una relació espacial:

- `participant`;
- `material`;
- `pilota`;
- `defensor_implicit`;
- `referencia_reglamentaria`;
- `referencia_funcional`.

Els participants conserven la seva identitat. Un canvi de posició no crea un
node nou. Els defensors absents que delimiten un interval poden aparèixer com a
nodes implícits, però han de declarar el seu estat de coneixement.

### 2. Espais

Un espai és una relació derivada, no una franja fixa. La versió 0.3 admet:

- `entre(A, B)`;
- `exterior_de(A)`;
- `interior_de(A)`;
- `darrere_de(A)`;
- `proper_a(A)`;
- `delimitat_per(A, B, ...)`.

Cada espai pot referenciar l'espai semàntic d'origen. Les contigüitats es
declaren en tots dos sentits i indiquen el referent compartit. Una definició
principal pot afegir restriccions relacionals: l'espai de finalització de
l'extrem, per exemple, queda entre línia de fons i primer defensor i alhora
dins l'àrea de 6 metres.

Exemple:

```text
INT_1 = entre(D1_SA1_IMPLICIT, BANC)
INT_2 = entre(BANC, D_Z1)
contigüitat(INT_1, INT_2) comparteix BANC
```

Aquesta topologia expressa la finta de `1–2` a `2–3` sense assignar cap punt a
la pista.

### 3. Estats

Un estat agrupa relacions simultànies dins una fase i un moment funcional:

- un lateral `ocupa` un interval de recepció;
- un extrem `mante_amplitud_a` l'espai de finalització;
- un pivot `evita_superposicio_amb` el portador;
- un receptor queda `orientat_cap_a` porteria.

Cada relació indica si és obligatòria, preferent o disponible, i el seu nivell
de coneixement.

### 4. Transicions

Una transició conserva la identitat de l'actor i connecta espais:

```text
actor + origen opcional + via opcional + destinació
```

El tipus funcional pot ser recepció, finta, atac d'espai, recuperació sense
pilota, ajust sense pilota, continuïtat, encreuament o resolució. Els
qualificadors expliquen la intenció tàctica; no descriuen una corba.

Els trams consecutius d'un mateix actor i `trajectoria_id` han de ser
connectats: la destinació d'un tram és l'origen del següent quan aquest origen
està declarat. Això permet conservar alternatives incompatibles sense
encadenar-les artificialment.

### 4.1. Flux de pilota

La pilota té una seqüència pròpia separada del moviment dels participants. Cada
transferència declara pilota, trajectòria, ordre, posseïdor inicial, acció i
posseïdor final. Dins la mateixa trajectòria, el posseïdor inicial d'una passada
ha de coincidir amb el posseïdor final de l'anterior.

Aquesta separació permet expressar que el lateral passa, inicia la cursa sense
pilota i rep la devolució just quan comença el canvi de direcció.

### 5. Branques decisionals

Una branca referencia una decisió semàntica i conserva almenys dues
alternatives. La resolució és sempre `no_predeterminada`.

Quan una lectura espacial agrupa diverses decisions semàntiques relacionades,
la branca pot utilitzar `decisions_semantiques_ref` per conservar-ne tota la
traçabilitat.

En el 2x1 de `SA2`, per exemple:

- si el primer defensor no tanca, el lateral pot atacar `Z2`;
- si tanca i queda compromès, l'extrem pot atacar `Z2` mantenint l'orientació
  cap al centre per guanyar angle.

El graf descriu els efectes espacials de cada alternativa, però no escull per
endavant quina succeirà.

## Instància TR-UVOF-001

La primera instància declara el model detallat com a font canònica després de
la validació de l'entrenador. El corpus es conserva com a projecció resumida i
els dos candidats queden vinculats a les mateixes identitats globals mitjançant
`semantic_coverage`. La correspondència inclou `D_Z1 ↔ D3`, `D_Z2 ↔ D1` i
`C1 + C2 ↔ C1_C2`. A més de les relacions següents, v0.3 incorpora B1 i B2 amb
els seus dos fluxos independents:

- `INT_1` entre el primer defensor implícit i el banc;
- `INT_2` entre el banc i el tercer defensor;
- `INT_PV_SA1` com a interval `3–3` complementari per al pivot;
- la recepció, finta, superació i resolució de `SA1`;
- la recuperació de `L` per darrere del banc;
- la recepció orientada i l'atac directe d'`INT_3` a `INT_4`;
- `C3` com a referència passiva del segon defensor absent i delimitador de
  l'espai d'execució i resolució de `SA2`;
- l'amplitud permanent de l'extrem;
- les dues resolucions 2x1 com a branques obertes.

Les dues bandes es descriuen a partir d'una plantilla i una declaració de
simetria pendent. La versió 0.3 no executa cap reflexió ni duplica identitats.

## Instància TR-UVOF-002

La segona instància representa:

- `D1`, `D2` i els dos `D3` com a defensors reals i actius;
- el xirimbolo com a handicap sostingut per `D2`, mai com a substitut;
- `1–2`, `2–3`, `3–3` i l'espai exterior delimitats pels defensors reals;
- passada inicial a extrem per iniciar `1–2 → 2–3`, o a central per iniciar
  `2–3 → 1–2`;
- devolució al lateral just a l'inici del canvi de direcció;
- continuïtat del central esperant darrere del lateral i rebent de cara;
- encreuament de central o extrem per darrere del lateral quan no hi ha
  superació;
- amplitud de l'extrem i salt cap al centre en la finalització exterior;
- alternatives obertes segons la superació i l'ajuda de `D1` o `D3`.

## Instància TR-UVOF-003

La tercera instància representa:

- un atac `6x6` complet contra els sis defensors reals d'un `6:0`;
- llibertat del lateral per atacar `1–2` o `2–3`;
- `2x1` exterior amb l'extrem contra `D1` i interior amb el pivot contra `D3`;
- passada obligatòria a l'extrem com a principi de joc quan `D1` tanca, amb
  anticipació, amplitud, recepció exterior i salt cap al centre;
- pivot inicialment a `3–3`, davant del tercer que no ajuda, mantenint el
  bloqueig estàtic i la línia de passada;
- passada al pivot obligatòria només com a condició pedagògica quan `D3` ajuda;
- encreuament amb central o extrem segons l'interval final sense superació;
- retorn de la pilota al jugador que ocupa temporalment la posició central;
- canvi de banda obligatori dins la tasca i reinici del `1x1` pel lateral
  contrari;
- adaptació del pivot al nou tercer que no participa en l'ajuda.

## Instància TR-UVOF-004

La quarta instància representa:

- passada a extrem i devolució per rebre en carrera i atacar `1–2`;
- passada a central i devolució per rebre en carrera i atacar `2–3`;
- recorregut de `D2` pel con contrari a la passada com a handicap de la tasca;
- `D2` com a defensor directe real i els cons només com a materials;
- recuperació de `D2` o finalització directa com a alternatives;
- continuïtats contra `D1` i `D3`, que defensen activament.

## Instància TR-UVOF-005

La cinquena instància representa:

- els sis atacants i els sis defensors reals d'un `5:1`;
- dos primers, dos segons, un tercer o central defensiu i un avançat;
- pivot a una banda i inici del lateral contrari a l'espai alliberat;
- continuïtats obertes segons la resposta defensiva;
- finalització obligatòria des de 6 m com a condició de tasca;
- classificació `situacio_partit` derivada de la relació `6x6`.

La font declara B1 però no un flux verificable. El document no inventa
posseïdors ni passades i el preflight retorna `partial`.

## Instància TR-UVOF-006

La sisena instància representa:

- `CIL_D2_LOCAL` sostingut per `D2_LOCAL` i `CIL_D3_OPOSAT` sostingut per
  `D3_OPOSAT`, tots dos com a handicaps visibles;
- `D1_LOCAL`, `D2_LOCAL`, `D3_LOCAL` i `D3_OPOSAT` com a defensors reals;
- llibertat d'atac del lateral a `1–2` o `2–3`;
- 2x1 exterior amb extrem i interior amb pivot;
- encreuaments de central o extrem amb intenció real de superar;
- retorn al jugador que ocupa temporalment el centre;
- canvi de banda preferent i no obligatori.

## Instància TR-UVOF-007

La setena instància representa:

- `CIL_D2` com a substitut actiu del segon defensor;
- `EXT_1` activat primer per resoldre amb `CE` contra `D3`;
- recuperació de `L` abans de la segona activació;
- `EXT_2` activat després per resoldre amb `L` contra `D1`;
- identitats i decisions separades per als dos extrems de la fila.

La font no especifica pilota ni flux. El preflight ho conserva com a
informació absent i retorna `partial`.

## Instància TR-UVOF-008

La vuitena instància representa:

- els sis atacants i els sis defensors d'un `5:1` complet;
- `PV` ocupant l'interval local `2–3` entre `D2_LOCAL` i `D3_CENTRAL`;
- `CE` iniciant amb pilota, col·locant `PV` i mobilitzant `DAV` cap a la
  mateixa zona;
- `DAV` sense intervenir sobre el pivot;
- la passada `CE → L_OPOSAT` després de mobilitzar l'avançat;
- la llibertat de `L_OPOSAT` per atacar `1–2` o `2–3` a la banda afavorida;
- finalització, continuïtat o encreuament com a alternatives obertes.

`ZONA_CONCENTRACIO` queda ancorada dins `INT_23_LOCAL` i el flux de pilota es
conserva explícitament. Ambdues dades han estat validades per l'entrenador i el
resultat del preflight passa a `ready` sense afegir geometria.

## Instància TR-UVOF-009

La novena instància representa:

- permuta central–lateral amb `CE` a lateral i `L` al centre;
- flux `B1`: `L → EXT_1 → CE`;
- flux `B2`: `PV → L`, amb llançament trepitjant `BANC_CENTRAL`;
- 1x1 de `CE` contra `BANC_EXTERIOR` i 2x1 amb `EXT_1` contra `D1`;
- flux `B3`: `EXT_2 → PV`, després del lliscament del pivot;
- el cilindre com a referència validada de l'espai restringit del pivot.

## Instància TR-UVOF-010

La desena instància representa:

- permuta lateral–central amb `L` al centre, `CE` obert a lateral i recepció
  `L_OPOSAT → L`;
- primera acció oberta amb superació, continuïtat o encreuament;
- segona pilota independent `PV → L`, activada només si `L` no ha estat
  necessari en la continuïtat posterior de la primera acció;
- `CON_PV` delimitant l'espai inicial del pivot, oposat a la trajectòria de
  `L`, sense superposició entre els dos atacants;
- 2x1 conceptual contra `D3` tancat a llançament exterior si queda pla o
  passada a `PV` si puja;
- lliscament de `PV` des del con cap a l'espai lliure únicament si `D3` puja.

`ESPAI_PV` queda ancorat a `CON_PV`, no a `D3`. La posició del defensor només
activa una de les dues respostes tancades, de manera que desapareix el cicle i
el preflight passa a `ready` sense introduir geometria.

## Instància TR-UVOF-011

L'onzena instància representa:

- situació de partit reduïda `4x4` amb `EXT`, `L`, `CE` i `PV`;
- flux específic validat `L → EXT → L`, que preval sobre la topologia general
  de la permuta;
- `L` rebent al centre com a rol temporal de central i iniciant l'1x1;
- finalització, continuïtat o encreuament com a alternatives obertes.

`DEF_4` declara cardinalitat esperada quatre però només té una instància. La
situació resta `blocked` fins que l'entrenador identifiqui o validi els quatre
defensors.

## Instància TR-UVOF-012

La dotzena instància representa:

- permuta lateral–central habilitada per `L_OPOSAT → L`;
- primer 2x1 de `L` i `PV` contra `D3`, amb lliscament obligatori del pivot si
  `D3` puja;
- segon flux independent `EXT → CE`, amb 2x1 de `CE` i `EXT` contra `D1`;
- amplitud de l'extrem i salt cap al centre si rep per finalitzar.

## Instància TR-UVOF-013

La tretzena instància representa:

- 4x4 amb passador extern que no computa en la relació;
- permuta lateral–central habilitada per `L_OPOSAT → L`;
- atac obligatori de `L` a l'interval `2–3`, anomenat primer pal a la tasca;
- resolució condicionada per `D3_LOCAL`: finalització si queda pla o
  lliscament i passada obligatòria al pivot si puja.

## Instància TR-UVOF-014

La catorzena instància representa:

- situació de partit 6x6 contra defensa 6:0 completa;
- sis identitats ofensives i sis identitats defensives explícites;
- permuta inicial lateral–central amb recepció `L_OPOSAT → L_LOCAL`;
- continuació oberta després de complir la condició pedagògica inicial.

Les sis opcions de la decisió semàntica tenen sis referències individuals.
`encreuament` no desapareix: es conserva simbòlicament fins que existeixi un
mapping espacial aprovat. Per això el preflight actual és `partial`.

## Instància TR-UVOF-015

La quinzena instància representa:

- tres zones contigües definides per quatre cons delimitadors;
- tres 1x1 simultanis, cadascun amb atacant, passador, defensor i pilota propis;
- passada, desmarcatge, devolució orientada i duel sense bot a cada zona;
- tres branques decisionals independents, una per defensor;
- la pilota única del gràfic font com a exemple visual replicable i no com a
  límit operatiu de la tasca.

La font no diferencia l'espai inicial, l'espai contigu ni el criteri de
superació de cada finta. Les transicions ho conserven sense inventar i el
preflight retorna `FINTA_ADJACENT_SPACE_MISSING` amb estat `blocked`.

## Validacions executables

`scripts/spatial_preflight.py` és pur i read-only. Carrega les fonts declarades,
però no selecciona cap candidat en conflicte. Retorna només:

- `ready`: cap diagnòstic impedeix el futur pas següent;
- `partial`: el model preserva informació absent, provisional o simbòlica que
  no requereix inventar geometria;
- `blocked`: una contradicció, pèrdua, referència, cicle o entrada tàctica
  pendent impedeix continuar de manera fiable.

Cada diagnòstic té `code`, `impact`, `file`, `entity_ref`, `message` i
`source_refs`. L'ordre és estable i `geometry_generated` és sempre `false`.

El validador i el preflight comproven:

- compliment de l'esquema;
- versió i fingerprints de font i de l'artefacte espacial;
- absència de coordenades, geometria, SVG o render;
- resolució real de JSON Pointer i tipus de referència;
- identificadors locals únics, namespace global i entitats penjants;
- bindings, perfils de participants, cardinalitats i capabilities;
- contigüitats simètriques amb un referent realment compartit;
- papers tipats de 2x1 i procedència de les condicions;
- marcs dels operadors ambigus;
- graf de dependències i cicles no ancorats;
- continuïtat de les transicions d'un mateix actor;
- continuïtat del posseïdor dins cada flux de pilota;
- preservació de participants, materials, pilotes, accions, fluxos, decisions i
  opcions;
- mapping individual i exhaustiu de les opcions;
- simetria només amb mapping explícit, mai per duplicació inferida;
- propagació de `provisional` i `unresolved`;
- presència dels invariants de no-coordenades, identitat persistent i decisió
  no predeterminada.

Codis principals actuals:

| Codi | Significat |
|---|---|
| `SEMANTIC_SOURCE_CONFLICT` | Hi ha fonts divergents sense candidat canònic aprovat |
| `SEMANTIC_SOURCE_DIGEST_MISMATCH` | La font ja no coincideix amb el fingerprint |
| `SEMANTIC_REFERENCE_UNRESOLVED` | Un JSON Pointer no es pot resoldre |
| `SEMANTIC_REFERENCE_TYPE_MISMATCH` | El punter resol una identitat o tipus diferent |
| `GLOBAL_NAMESPACE_COLLISION` | Dues entitats comparteixen la mateixa identitat global |
| `GLOBAL_NAMESPACE_DANGLING_ENTITY` | El namespace apunta a una entitat eliminada |
| `BINDING_TARGET_TYPE_MISMATCH` | Un actor genèric no apunta a participants |
| `UNINSTANTIATED_PARTICIPANT_GROUP` | La cardinalitat real és inferior a l'esperada |
| `SEMANTIC_FLOW_LOSS` | Un flux de la font ha desaparegut |
| `SEMANTIC_OPTION_COVERAGE_GAP` | Una opció no té mapping ni preservació individual |
| `SPATIAL_UNANCHORED_CYCLE` | El graf depèn circularment de si mateix |
| `SPATIAL_FRAME_INSUFFICIENT` | Falta marc per interpretar un operador ambigu |
| `FINTA_ADJACENT_SPACE_MISSING` | No existeix una distinció validada entre espai inicial i contigu |
| `SPATIAL_GEOMETRY_FORBIDDEN` | L'entrada conté geometria, coordenades o SVG fora de contracte |
| `KNOWLEDGE_STATUS_PROPAGATED` | Una entrada provisional/unresolved continua sent-ho |

Els diagnòstics específics d'informació pendent de pilota o entrenador es
declaren a `unresolved_items`; el preflight no els dedueix del número d'UVOF.

## Entrada i sortida del futur resolutor

Entrada:

1. JSON semàntic validat;
2. contracte relacional validat;
3. model reglamentari de pista;
4. paràmetres geomètrics encara per definir.

Sortida futura:

1. una instància geomètrica derivada;
2. traçabilitat de cada resultat cap a una relació del contracte;
3. alternatives separades quan la decisió no és única;
4. cap canvi del significat tàctic per satisfer el dibuix.

## Abast i pendents de v0.3

La versió 0.3 valida l'arquitectura amb `TR-UVOF-001`–`TR-UVOF-015`; encara no
és un resolutor ni un motor geomètric. Abans d'implementar-los cal:

- provar-lo amb més permutes i opcions de resolució tancades;
- definir com canvien els intervals quan els defensors es desplacen entre
  estats;
- validar els camps de costat que ara són `unknown` i aprovar els mappings de
  reflexió quan realment siguin necessaris;
- separar les prioritats tàctiques de les preferències del futur solucionador;
- decidir el contracte de sortida geomètrica en una versió posterior.
