# Model de domini tàctic

Aquest model es complementa amb el vocabulari viu validat a
[`HANDBALL_KNOWLEDGE.md`](HANDBALL_KNOWLEDGE.md).

## 1. Contingut tàctic

Un contingut tàctic és una definició reutilitzable independent de l'exercici concret. Exemples futurs: 1x1/finta, fixació, passada i va, creuament, bloqueig, 2x1.

### 1x1 / finta

Seqüència funcional invariant:

1. `atacar_espai_inicial`.
2. `comprometre_defensor`.
3. `finta_canvi_direccio_i_ritme`.
4. `atacar_espai_contigu`.
5. `superar_defensor`.
6. `resolucio_posterior`.

La recepció en carrera és preferent, però només és invariant quan la tasca la
declara com a condició. La finta ha de contenir:

- amenaça del primer interval;
- compromís del defensor compartit;
- canvi explícit de direcció;
- canvi de ritme;
- sortida pel costat contigu de la referència oposicional.
- superació de la línia defensiva marcada pel defensor.

## 2. Referència oposicional

La referència habitual és un defensor real. Un material pot actuar com a:

- substitut oposicional actiu;
- referència posicional passiva d'un defensor absent;
- límit espacial sense equivalència defensiva.

Camps mínims:

- `tipus_real`;
- `tipus_utilitzat_exercici`;
- `equivalencia`;
- `funcio_tactica`;
- `posicionament_semantic`.

La funció s'ha de declarar per instància. No s'ha de deduir del tipus de
material.

## 3. Espais i intervals

Un interval és una relació dinàmica entre dos defensors, no una coordenada.

Exemples:

- `1–2`, entre primer i segon defensor, també anomenat carril;
- `2–3`, entre segon i tercer defensor;
- `3–3`, entre els dos tercers o centrals defensius.

Dos intervals són contigus quan comparteixen un defensor. L'espai de
finalització de l'extrem és un espai funcional diferent: el tram de l'àrea de
6 m entre la línia de fons i el primer defensor.

Cada interval ha de declarar:

- identificador;
- tipus;
- relació;
- funció;
- contigüitat quan sigui rellevant.

### 3.1. Referència defensiva estructural

Mencionar un interval canònic declara també les identitats necessàries per
definir-lo. Si `INT_12` apareix al text, `D1` i `D2` poden existir al
`TacticalIR` com a `structural_reference`, amb autoritat
`derived_from_validated_rule`, encara que l'entrenador no els hagi mencionat
com a participants actius. Aquesta presència conserva només identitat, rol
defensiu i funció de delimitador; no implica oposició, moviment, decisió ni
coordenades.

Una menció explícita posterior enriqueix la mateixa identitat i canvia la seva
presència a explícita; no crea un segon participant. Una referència que no es
pot justificar amb una definició o relació validada continua sent absent i
bloqueja el preflight. Els materials delimitadors conserven la seva funció per
instància i no adquireixen equivalència defensiva per delimitar un espai.

## 4. Subacció

Una subacció agrupa una seqüència funcional coherent. Ha d'incloure:

- executor;
- passador, si existeix;
- referència oposicional;
- espais inicial i final;
- seqüència obligatòria;
- situació decisional posterior.

## 5. Situació decisional

Una situació decisional descriu:

- relació numèrica;
- atacants;
- defensors;
- espai;
- opcions possibles.

No imposa una única resolució.

## 6. Flux de pilota

La pilota ha de tenir un flux separat del moviment dels jugadors. Una passada només és vàlida quan l'actor té possessió. Una recuperació sense pilota no pot heretar possessió de la fase anterior.

## 7. Geometria derivada

La geometria serà derivada de:

- pista reglamentària;
- rol posicional;
- referències espacials;
- intervals;
- distàncies funcionals;
- invariants tàctics.

Les coordenades no pertanyen al JSON semàntic.

Un espai tàctic continua sent una relació entre delimitadors quan arriba a la
geometria: pot tenir una regió interna de càlcul, però no es converteix en un
rectangle visible. En canvi, una delimitació física de la tasca —per exemple
els cons d'UVOF015— sí que pot tenir geometria de control.

La posició d'un participant es modela amb estats persistents. Una trajectòria
connecta dos estats del mateix actor i una passada connecta l'estat de
l'emissor amb el del receptor. Les corbes formen part de la geometria resolta;
el render només n'executa els segments.

La primera instància executable és UVOF015. Utilitza un perfil de pista IHF
versionat, exigeix un preflight `ready`, registra fingerprints d'entrada i
preserva totes les alternatives. Les coordenades de lectura viuen només a
`geometry.json` i poden revisar-se sense canviar el significat tàctic. El
contracte es documenta a [`GEOMETRY_CONTRACT.md`](GEOMETRY_CONTRACT.md).

La interfície MVP accepta text arbitrari, però no afirma entendre’l completament.
`KnowledgeResolver` retorna coneixement validat, provisional, desconegut,
candidat i no resolt. La capa d’interpretació produeix un `TacticalIR`
estructurat; `RepresentationComposer` només consumeix aquest contracte i pot
compondre moviment, bot, passada, recepció, llançament, finta/1x1, bloqueig,
relacions numèriques, permuta, encreuament i lliscament de pivot. Composició
completa no implica geometria completa: si falten posicions o relacions
resolubles, la geometria queda `needs_input` o `partial`.

Sense resolver, l’entrenador pot crear una `coach_reference_geometry`. Aquest
artefacte és una referència del cas, no geometria derivada, i conserva
`canonical_promotion: false`. La correcció gràfica només modifica la versió de
treball i queda vinculada a un esdeveniment traçable.

## 8. Correcció supervisada

Una correcció és una decisió de l'entrenador sobre una capa i un cas concrets.
Declara objectiu, propietat, valor anterior i nou, autor, motiu, abast, estat i
fonts. Les capes són `semantic`, `spatial`, `geometry` i `visual`.

Una correcció d'estat és el canvi principal. Les posicions visibles i les
trajectòries que se'n deriven són efectes automàtics explicats, no correccions
independents.

La validació d'un conjunt de correccions crea una versió validada del cas. No
altera automàticament el corpus, el contracte espacial ni les regles generals.
La reutilització exigeix una decisió explícita. Un criteri local confirmat per
l'entrenador, vinculat a un cas validat i a evidències, pot entrar a
`coach_validated_local_knowledge` i ser consumit en casos futurs. Una promoció
del Promotion Builder continua naixent com a candidat i només suggereix.
El model complet es documenta a
[`CORRECTION_MODEL.md`](CORRECTION_MODEL.md).

## 8.1. Model semàntic parcial

Un cas universal pot contenir participants, materials, espais, accions,
decisions i fases amb estats diferents d’autoritat. Una coincidència del
vocabulari local és `provisional`; una confirmació de l’entrenador pot ser
`validated`; una expressió sense definició es conserva com `unknown`. El buit
no s’omple mitjançant una equivalència inventada.

## 9. Corpus d'exercicis

El corpus semàntic agrupa exercicis validats que comparteixen una família. Cada
entrada declara:

- identificació, origen i estat de coneixement;
- tipus d'exercici;
- organització, participants, materials, files i pilotes;
- fases amb accions ordenades;
- fluxos de pilota explícits quan han estat validats;
- decisions obligatòries, preferents o simplement disponibles;
- invariants i condicions de tasca.

Una absència d'informació no s'omple per inferència. En particular, un flux de
pilota buit significa que la font i l'entrenador encara no n'han fixat el
posseïdor o la transferència.

## 10. Permuta

La permuta utilitza la notació `primer_jugador-segon_jugador`. El primer canvia
cap a la posició del segon i rep després de la permuta; el segon ocupa l'espai
deixat. Per norma general, `central–lateral` s'habilita amb una passada de
l'extrem i `lateral–central` amb una passada del lateral contrari. Aquest flux
es declara separadament perquè la identitat del participant, la posició
temporal, el passador i el posseïdor de pilota no són equivalents. Un flux
específic validat per la tasca preval sobre la topologia general.

## 11. Caràcter de les decisions

Cada decisió ha d'indicar-ne el caràcter:

- `obligatori`: la tasca tanca la resposta;
- `preferent`: és la resposta recomanada, però admet criteri contextual;
- `disponible`: és una opció legítima dins una situació oberta.

El canvi de banda després d'una acció sense avantatge és habitualment
`preferent`, no `obligatori`.

## 12. Relacions espacials derivades

La capa de relacions espacials és un graf qualitatiu situat entre el model
semàntic i la geometria. Conté:

- nodes persistents per a participants, materials i referències;
- espais definits per relacions com `entre`, `darrere_de` o `delimitat_per`;
- estats simultanis per fase;
- transicions connectades del mateix participant;
- branques que conserven les alternatives d'una decisió.

Un interval es torna a derivar dels seus delimitadors en cada estat rellevant;
no hereta una posició fixa. Les contigüitats indiquen explícitament el defensor
compartit. Les decisions continuen obertes fins que la lectura de joc en
selecciona una alternativa.

El contracte v0.3 es documenta a
[`SPATIAL_RELATIONS_CONTRACT.md`](SPATIAL_RELATIONS_CONTRACT.md). Encara no
genera geometria per si mateix.

La v0.3 separa també el flux de pilota de les transicions dels participants.
Cada trajectòria alternativa conserva la possessió entre passades i pot
referenciar la condició tàctica que l'activa. Els encreuaments declaren el pas
del receptor per darrere del portador i l'interval que ataca després de rebre.

## 13. Identitat, completitud i derivació

`case_uid` és la identitat durable; `short_code` és només una etiqueta humana.
Un cas pot ser complet semànticament sense geometria, o tenir una composició
provisional sense estar validat. Per això `complete`, `validated` i `saved` no
són sinònims.

Cada capa derivada conserva el fingerprint del text font. Un canvi de text posa
en `stale` les capes que eren `current`. Cap representació obsoleta es pot
validar ni guardar.

## 14. TacticalIR, ActionInstance i CompositionPlan

Una `ActionInstance` és una ocurrència concreta d’una acció, no el seu nom de
vocabulari. Declara identitat, tipus, actor o actors, objectius, oposició,
espais, fase, dependències temporals, autoritat i fonts. Les relacions
`after`, `before` i `simultaneous_with` formen un graf; no es pressuposa que
una llista incidental sigui l’ordre tàctic.

`TacticalIR` agrupa participants, estats, pilotes, materials, espais,
`ActionInstance`, decisions, fases, fluxos i relacions tipades. El compositor
el transforma en `CompositionPlan`: accions compostes o pendents, estats
persistents, flux de pilota, constraints, primitives visuals, preguntes,
cobertura i traçabilitat. Cap coordenada és obligatòria en el pla.

Una relació pot estar composta sense glif propi. El `2x1` és dos atacants, una
referència defensiva i les seves accions; un espai és una relació entre
delimitadors; una alternativa pot quedar només a la semàntica. El renderer no
reinterpreta cap d’aquests conceptes.
