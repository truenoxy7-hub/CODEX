# Registre de decisions

## D-001 — Separar semàntica i geometria

**Decisió:** el JSON semàntic no conté coordenades.

**Motiu:** els prototips van convertir la semàntica en un SVG indirecte i van produir resultats tàcticament erronis.

## D-002 — L'entrenador és l'autoritat final

**Decisió:** cap interpretació tàctica es marca com a aprovada sense contrast humà.

## D-003 — Definició de 1x1/finta

**Decisió:** l'ordre funcional és atac d'un espai → compromís del defensor →
canvi de direcció i ritme → atac de l'espai contigu → superació → resolució.
La recepció en carrera és preferent, però no és invariant general.

## D-004 — Referència oposicional substituïble

**Decisió:** defensor, banc, con o cilindre poden ocupar el mateix rol semàntic de referència oposicional. El material no canvia el contingut.

## D-005 — Resolució no predeterminada

**Decisió:** un 2x1 es modela com una situació decisional amb opcions, no com una fletxa obligatòria.

## D-006 — Identitat persistent

**Decisió:** les posicions successives no són jugadors diferents. Són estats del mateix participant.

## D-007 — Recuperació de TR-UVOF-001

**Decisió:** després de la primera subacció, el lateral recupera sense pilota per darrere del banc.

## D-008 — Segona recepció funcional

**Decisió:** la passada de l'extrem ha de ser curta i la recepció ha de ser en
carrera i orientada a porteria. `SA2` es resol sense bot per condició explícita
de la tasca.

## D-009 — La funció dels materials es declara per instància

**Decisió:** un material pot substituir activament un defensor, representar
passivament la posició d'un defensor absent o delimitar un espai. No es pot
deduir la funció només del tipus de material.

## D-010 — No reprendre prototips geomètrics

**Decisió:** les versions geomètriques v0.x es conserven només com a historial d'errors i no són base d'implementació.

## D-011 — Vocabulari viu i nivells d'autoritat

**Decisió:** el coneixement es classifica com a invariant, principi preferent,
condició de tasca o provisional. El vocabulari continuarà ampliant-se amb
validacions de l'entrenador.

## D-012 — Nomenclatura defensiva relacional

**Decisió:** els rols es numeren de l'exterior al centre. `1r` i `exterior` són
sinònims; `3r` i `central defensiu` també. Els intervals `1–2`, `2–3` i `3–3`
es deriven de les posicions dels defensors. Carril és el nom específic de
l'interval `1–2`.

## D-013 — Superioritat preparada o generada

**Decisió:** un 2x1 local pot ser generat per una acció anterior o preparat
artificialment per una tasca. El model ha d'indicar-ne l'origen i no inventar
una causalitat.

## D-014 — Amplitud i finalització exterior

**Decisió:** l'extrem manté l'amplitud. En finalitzar des d'una zona exterior,
l'última passa i el salt busquen sempre guanyar angle cap al centre.

## D-015 — Encreuament amb amenaça real

**Decisió:** després de cada encreuament el receptor busca superar. Si no hi ha
avantatge local, el canvi de banda és una opció preferent i no obligatòria.

## D-016 — Regla ordenada de la permuta

**Decisió:** a la notació `primer-segon`, el primer jugador canvia cap a la
posició del segon, el segon ocupa l'espai deixat i el primer rep després de la
permuta. Per norma general, la direcció també determina la topologia de passada:

- `central–lateral`: el central va a lateral i la passada habilitadora es fa
  amb l'extrem;
- `lateral–central`: el lateral va al centre i rep del lateral contrari.

La passada habilitadora és un flux de pilota explícit i separat del canvi de
posicions. Si una tasca valida un flux específic diferent, com `L → EXT → L` a
`TR-UVOF-011`, el corpus el conserva com a particularitat de l'exercici.

## D-017 — Fort conceptual i fort individual

**Decisió:** el punt fort conceptual és cap al centre i el feble cap a
l'exterior. La sortida forta individual depèn de la mà dominant i es representa
separadament.

## D-018 — Bloqueig estàtic i lliscament del pivot

**Decisió:** guanyar posició és la intenció; el bloqueig estàtic n'és un mitjà.
El lliscament respon a l'ajuda interior i pot ser obligatori quan la tasca ho
declara.

## D-019 — Situació de partit com a tipus d'exercici

**Decisió:** una situació de partit conserva oposició real, rols complets i
decisions obertes encara que tingui una condició inicial o de finalització.

## D-020 — Corpus v1.1 i fluxos de pilota

**Decisió:** la família UVOF es representa en un corpus genèric v1.1. Les files,
l'ordre d'activació i les múltiples pilotes són estructures explícites. No
s'infereix un flux de pilota que no hagi estat validat.

## D-021 — Contracte espacial com a graf qualitatiu

**Decisió:** la capa anterior a la geometria és un graf de nodes, espais
relacionals, estats, transicions i branques. Els intervals es defineixen pels
seus delimitadors i les contigüitats pel defensor compartit.

**Motiu:** permet preparar un motor espacial sense convertir la semàntica en
coordenades ni tancar decisions que depenen de la lectura del jugador.

**Abast actual:** la decisió continua vigent i el contracte ha evolucionat a
v0.3 amb `TR-UVOF-001`–`TR-UVOF-015`. La geometria continua fora d'aquest
contracte; UVOF015 ja en té una primera derivació posterior v0.1.

## D-022 — Flux de pilota i trajectòries alternatives al contracte espacial

**Decisió:** la pilota es representa amb un flux propi per trajectòria. Les
passades no s'infereixen del moviment dels jugadors i cada transferència ha de
conservar el posseïdor resultant del pas anterior.

**Decisió:** un encreuament és una transició explícita del receptor per darrere
del portador cap a un interval que s'ataca amb intenció de superar. Les
trajectòries alternatives s'identifiquen separadament perquè el validador no
les encadeni com si fossin una única solució.

**Motiu:** `TR-UVOF-002` conté dues direccions de finta i desenllaços diferents
segons la superació i l'ajuda defensiva. Barrejar-los en un sol recorregut faria
perdre la lògica tàctica validada.

## D-023 — Continuïtat després de superar el segon defensor

**Decisió:** superar el segon per l'exterior genera un `2x1` amb l'extrem contra
el primer defensor; superar-lo per l'interior genera un `2x1` amb el pivot
contra el tercer. En la superació exterior, si el primer no tanca el lateral
finalitza; si el primer tanca, la passada a l'extrem és obligatòria com a
principi general de joc. L'extrem anticipa la passada, manté l'amplitud i
finalitza dins el seu espai exterior amb el salt cap al centre.

**Decisió:** una resposta obligatòria dins un exercici s'etiqueta com a
`condicio_tasca`. A `TR-UVOF-003`, la passada al pivot quan el tercer ajuda i el
canvi de banda després d'un encreuament sense avantatge són obligacions
pedagògiques, no regles universals de la situació real. La passada exterior a
l'extrem quan el primer tanca no és una `condicio_tasca`: és una regla del joc
validada per l'entrenador.

## D-024 — Classificació canònica del 6x6

**Decisió:** qualsevol exercici que declari una relació `6x6` es categoritza com
a `situacio_partit`. La regla és independent de les condicions pedagògiques
d'inici, finalització o recompte d'errors.

**Motiu:** el 6x6 conserva els rols complets, l'oposició real i les decisions
obertes pròpies del joc. La taxonomia es podrà especialitzar més endavant sense
perdre aquesta categoria base.

## D-025 — Cilindres com a handicaps de defensors reals

**Decisió:** un cilindre o xirimbolo sostingut per un defensor limita la seva
intervenció, però no el substitueix ni l'elimina. Quan el gràfic mostra diversos
cilindres, cada material referencia explícitament el defensor que el sosté.

**Aplicació validada:** a `TR-UVOF-006`, `CIL_D2_LOCAL` condiciona el segon
defensor directe i `CIL_D3_OPOSAT` condiciona el tercer oposat. `D1_LOCAL` i
`D3_LOCAL` continuen defensant activament les continuïtats.

## D-026 — Permuta amb recepcions i fluxos independents

**Decisió:** la permuta només canvia la posició funcional; no canvia la
identitat del participant. A `TR-UVOF-009`, `CE` va a lateral i rep d'`EXT_1`,
mentre `L` ocupa el centre i rep de `PV`. El flux inicial `L → EXT_1 → CE`, el
flux `PV → L` i el flux posterior `EXT_2 → PV` es declaren separadament i en
ordre.

**Decisió:** dos bancs visibles amb funcions diferents són dos materials
diferents: `BANC_EXTERIOR` substitueix l'oposició del 1x1 de `CE` i
`BANC_CENTRAL` condiciona la trepitjada del llançament de `L`.

**Aplicació validada:** a `TR-UVOF-009`, `CIL_RESTRINGIT` referencia l'espai
restringit des del qual el pivot finalitza després del lliscament.

## D-027 — Un gràfic exemplar pot descriure rèpliques simultànies

**Decisió:** quan el text i la validació de l'entrenador declaren diverses
accions simultànies equivalents, un únic flux dibuixat al gràfic es considera
un exemple visual i no limita el nombre d'execucions del model.

**Aplicació validada:** a `TR-UVOF-015`, la pilota visible exemplifica una
passada–devolució que es replica a les tres zones. El corpus declara tres
pilotes, tres passadors, tres defensors i tres decisions de 1x1 independents.
Quatre cons delimiten les tres zones i els dos cons interiors són referents
compartits.

**Motiu:** confondre la quantitat dibuixada amb la quantitat operativa eliminaria
dos dels tres duels simultanis especificats per la tasca.

## D-028 — Contracte v0.3 traçable i sense selecció implícita de font

**Decisió tècnica:** cada instància v0.3 declara candidats de font, versió,
selector JSON Pointer i fingerprint determinista. Un exercici ordinari exigeix
exactament un candidat canònic. Si les fonts discrepen sense una decisió de
l'entrenador, el contracte declara `conflict`, cap candidat esdevé canònic i el
preflight retorna `SEMANTIC_SOURCE_CONFLICT`.

**Decisió tècnica:** el validador no pot seleccionar el `semantic.json` germà
per la seva mera existència. La font executable és únicament la declarada i
fingerprinted per l'artefacte v0.3.

**Motiu:** la coincidència d'IDs o de l'últim segment d'un pseudo-camí no prova
identitat ni preservació semàntica.

## D-029 — Preflight pur com a gate anterior al resolutor

**Decisió tècnica:** el preflight és read-only, no genera geometria i només
retorna `ready`, `partial` o `blocked`. `valid` descriu conformitat estructural;
no és sinònim de `ready`.

**Decisió tècnica:** els bloquejos es deriven dels tipus i invariants generals:
resolució de referències, namespace, bindings, cardinalitat, capabilities,
cobertura semàntica, mapping d'opcions, marcs i cicles. Els buits coneguts que
requereixen entrenador viuen a l'artefacte com `unresolved_items`, no en una
regla del validador condicionada pel número d'UVOF.

## D-030 — Migració mecànica, preservació simbòlica i estats de coneixement

**Decisió tècnica:** v0.2 es conserva com a esquema històric read-only. La
migració a v0.3 no completa buits tàctics: pot mapar una entitat, preservar-la
simbòlicament o declarar-la `unknown`, `provisional` o `unresolved`.

**Decisió tècnica:** equip, rol canònic, costat, rol temporal i funció són camps
separats. No es dedueixen costat o rol temporal dels IDs ni es parteixen rols
compostos. La funció i les capabilities del material es declaren per instància.

**Decisió tècnica:** una simetria només pot donar-se per resolta amb mapping
explícit d'identitats. No es dupliquen participants, materials o pilotes per
inferència.

## D-031 — Font canònica i mapping validat d'UVOF001

**Decisió de l'entrenador:** el model detallat
`exercises/TR-UVOF-001/semantic.json` és la font canònica. L'entrada del corpus
és una projecció resumida i no una autoritat alternativa. Les dues fonts es
vinculen mitjançant `semantic_coverage`, compartint les mateixes identitats
globals per a participants, materials, pilotes, accions i decisions.

**Mapping validat:** `D_Z1 ↔ D3`, `D_Z2 ↔ D1` i els materials separats `C1` i
`C2` corresponen a l'agregat `C1_C2` del corpus. `B1` i `B2` mantenen fluxos
independents. `C3` representa passivament el segon defensor absent i també
delimita l'espai d'execució i resolució de `SA2`.

**Efecte tècnic:** s'elimina `SEMANTIC_SOURCE_CONFLICT` d'UVOF001 i el
preflight passa de `blocked` a `ready`, sense introduir geometria.

## D-032 — Ancoratge i flux validats d'UVOF008

**Decisió de l'entrenador:** `PV` ocupa l'interval `2–3` de la banda de
concentració. `CE` inicia amb pilota, mobilitza `DAV` cap a la mateixa zona
sense que l'avançat intervingui sobre el pivot i passa a `L_OPOSAT`.
`L_OPOSAT` pot atacar lliurement `1–2` o `2–3` a la banda alliberada i resoldre
amb finalització, continuïtat o encreuament.

**Efecte tècnic:** `ZONA_CONCENTRACIO` s'ancora a `INT_23_LOCAL`, es preserva
el flux `B1: CE → L_OPOSAT` i desapareixen tant el cicle no ancorat com la
pilota no especificada. El preflight d'UVOF008 passa de `blocked` a `ready`
sense introduir coordenades.

## D-033 — Con complementari i lliscament condicional d'UVOF010

**Decisió de l'entrenador:** `PV` parteix sempre del con que delimita l'espai
oposat a la trajectòria de `L`. Lateral i pivot no poden ocupar ni atacar el
mateix espai. `PV` només abandona el con i llisca cap a l'espai lliure quan
`D3` puja; si `D3` queda pla, `L` resol amb llançament exterior.

**Efecte tècnic:** `CON_PV` esdevé l'ancoratge independent d'`ESPAI_PV`; `D3`
deixa de definir l'espai i només activa la branca de resolució. Desapareix el
cicle no ancorat i el preflight d'UVOF010 passa de `blocked` a `ready` sense
introduir coordenades.

## D-034 — Quatre defensors reals i actius d'UVOF011

**Decisió de l'entrenador:** la defensa de la situació reduïda `4x4` està
formada per `D1_LOCAL`, `D2_LOCAL`, `D3_LOCAL` i `D3_OPOSAT`. Tots quatre són
participants reals i actius; `DEF_4` no és una persona ni una representació
vàlida de la defensa completa.

**Aplicació espacial:** `D1_LOCAL` delimita l'espai exterior entre el primer
defensor i la línia de fons. Els dos tercers es conserven com a identitats
separades, local i oposada. No es força cap emparellament directe no validat per
a l'1x1 que `L` inicia des del centre temporal.

**Efecte tècnic:** el corpus i el namespace contenen vuit participants
individuals, la cobertura semàntica mapeja els quatre defensors i desapareix el
grup no instanciat. El preflight d'UVOF011 passa de `blocked` a `ready` sense
introduir coordenades.

## D-035 — Llibertat bilateral dels tres duels d'UVOF015

**Decisió de l'entrenador:** a cadascuna de les tres zones, l'atacant té
llibertat absoluta per escollir inicialment qualsevol dels dos espais contigus
al defensor. Si hi ha avantatge, continua i supera pel mateix espai; si el
defensor el tanca, canvia direcció i ritme per atacar l'altre. L'acció es manté
dins els límits de zona i sense bot.

**Criteri de superació:** l'atacant supera quan travessa la línia defensiva
marcada pel defensor real de la zona.

**Efecte tècnic:** cada duel exposa les dues continuïtats i les dues fintes
direccionals, les contigüitats comparteixen el defensor i totes les branques
conserven el criteri de superació. Desapareixen els marcs incomplets i el
preflight d'UVOF015 passa de `blocked` a `ready` sense introduir coordenades.

## D-036 — Primera geometria derivada i revisable

**Decisió tècnica:** la geometria viu en un artefacte nou i no s'afegeix al
corpus ni al contracte espacial. Només es deriva d'una entrada amb preflight
`ready`, referencia el fingerprint d'origen i manté traçabilitat fins als nodes,
espais, transicions i alternatives.

**Aplicació MVP:** UVOF015 conserva les quatre alternatives de cadascun dels
tres duels. La interfície en pot mostrar una per zona, però aquesta selecció és
estat de previsualització i no una decisió tàctica canònica.

**Política provisional:** l'amplada visual de les tres zones i les distàncies
de lectura dels participants són una política de render revisable. Les línies i
dimensions de pista provenen del perfil IHF versionat; cap coordenada dels
prototips descartats es reutilitza.

## D-037 — El corpus és coneixement de referència, no un catàleg tancat

**Decisió de producte:** l'entrada principal de TRAÇA és una descripció nova de
l'entrenador. Els UVOF validats aporten vocabulari, invariants, exemples i
proves de regressió, però l'usuari no ha de limitar-se a seleccionar-ne un.

**Primera aplicació revisada:** l'arquitectura continua orientada a text nou,
però l'espai de treball executable utilitza UVOF015 com a espècimen real. La
interfície declara que encara no pot interpretar text arbitrari amb garanties;
si el text canvia, no reutilitza ni adapta silenciosament la geometria del cas.
El prototip local d'intèrpret 1x1 no forma part del motor de producció.

**Separació de garanties:** quan s'habiliti geometria creada des de text nou,
serà un esborrany de previsualització. No serà un artefacte canònic v0.1, no
superarà per si sola el preflight espacial i no s'incorporarà automàticament al
corpus. La confirmació d'interfície no equivaldrà a validació tàctica permanent.

## D-038 — Aprenentatge per correccions de cas i promoció explícita

**Decisió de producte:** l'entrenador ha de poder corregir la representació
sense sobreescriure la geometria generada. Cada canvi és un esdeveniment amb
capa, referència, propietat, abans, després, autor, abast, estat, raó i fonts.
L'estat de treball es reconstrueix aplicant aquests esdeveniments a l'original.

**Separació de capes:** una correcció semàntica o espacial queda anotada però
no muta els artefactes canònics. Una correcció geomètrica o visual modifica
només la còpia de treball. Desfer, refer i reiniciar mai no operen directament
sobre `generatedGeometry`.

**Validació i reutilització:** validar congela una versió del cas. Guardar el
cas, crear un candidat de patró i proposar una regla general candidata són tres
accions explícites diferents. Cap acció local promociona automàticament
coneixement al corpus.

## D-039 — Renderer literal i gramàtica visual estructurada

**Decisió tècnica:** el renderer no conté política tàctica ni suavitzat de
trajectòries. Dibuixa els punts amb segments `M/L` i rep les convencions des
d'una gramàtica visual versionada.

**Aplicació:** la passada és discontínua; tot moviment del jugador, inclosa la
cursa sense pilota, és continu. La finta preserva els vèrtexs funcionals del
canvi de direcció. Vista neta i vista de control comparteixen geometria i només
difereixen en superposicions d'inspecció.

## D-040 — Workspace universal amb UVOF015 com a espècimen

**Decisió:** qualsevol text crea un cas nou independent. UVOF015 només activa el
provider i el resolver canònics quan coincideixen identificador i
`case_type: canonical_specimen`.

## D-041 — Interpretació parcial i auditable

**Decisió:** el matcher local pot reconèixer termes explícits, però els marca
provisionals i conserva evidència, font i referència. Els desconeguts i els
punts no resolts no s’eliminen ni s’assimilen automàticament.

## D-042 — Referència geomètrica de l’entrenador

**Decisió:** un cas sense resolver pot tenir `coach_reference_geometry`. No és
`generatedGeometry`, no prova cap invariant tàctic i no es promociona.

## D-043 — Preflight explicable per severitat

**Decisió:** els errors estructurals o les contradiccions bloquegen la
validació. Els warnings i les preguntes demanen revisió però poden quedar dins
un cas validat. Cada diagnòstic ofereix missatge, objectiu i accions possibles.

## D-044 — Promoció construïda des d’evidència seleccionada

**Decisió:** només un cas validat pot obrir una promoció. El candidat conserva
tipus, abast, cas font i únicament les correccions seleccionades; sempre neix
`candidate` i no canònic.

## D-045 — Quatre nivells de gramàtica visual

**Decisió:** gramàtica base, override del cas, candidat visual i diccionari
validat són nivells separats. Corregir un color o traç no modifica cap convenció
global.

## D-046 — Els espais tàctics no són objectes gràfics

**Decisió:** un interval o espai tàctic continua sent una relació entre
delimitadors. Pot conservar àncora i regió de càlcul internes, però la vista
neta no el dibuixa i Control només en mostra una ajuda mínima. Els polígons de
zona queden reservats als límits físics de la tasca i mai no es farceixen.

## D-047 — Geometria segmentada resolta abans del render

**Decisió:** línies, corbes, controls i punts funcionals formen part de
`geometry.json`. El renderer emet literalment `M/L/C`; no aplica suavitzat. La
finta conserva explícitament un `direction_break` i no pot degradar-se a una
corba decorativa.

## D-048 — Estats persistents i passades amb identitat

**Decisió:** les posicions temporals són `participant_state`. Els moviments
enllacen estats del mateix actor i les passades identifiquen pilota, emissor,
receptor i estats d'origen i destí. El retall al perímetre del símbol és només
una responsabilitat visual del renderer.

## D-049 — Una correcció principal, efectes derivats

**Decisió:** moure un estat registra un únic esdeveniment principal. Entitats,
moviments i passades connectats es recalculen com a efectes derivats enumerats
a l'historial. No es creen correccions secundàries ni s'altera la proposta
generada immutable.

## D-050 — Metadades automàtiques del cas

**Decisió de producte:** crear un cas no demana a l’entrenador que entengui ni
ompli `origin` o `tags`. L’origen queda registrat internament com
`coach_input`; després de la interpretació, TRAÇA proposa fins a vuit etiquetes
a partir dels conceptes explícits reconeguts. Les etiquetes descriuen la
classificació del cas, però no converteixen una coincidència provisional en
coneixement validat.
