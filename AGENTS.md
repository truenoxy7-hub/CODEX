# Instruccions per a Codex — Projecte TRAÇA

## Missió

Construeix TRAÇA com un sistema d'enginyeria de coneixement per a exercicis d'handbol. El sistema ha de conservar el significat tàctic, validar-lo i, en una fase posterior, convertir-lo en geometria i SVG deterministes.

La prioritat no és “fer un dibuix plausible”. La prioritat és representar exactament allò que l'entrenador ha validat.

## Autoritat i fonts de veritat

Ordre de prioritat:

1. Correccions i validacions explícites de l'entrenador.
2. JSON semàntic aprovat de cada exercici.
3. Definicions canòniques del vocabulari tàctic.
4. Text i gràfic originals.
5. Inferències del sistema, sempre marcades com a provisionals.

No converteixis una proposta geomètrica o una inferència en coneixement tàctic validat.

## Regles innegociables

- No generis geometria, SVG ni PNG si la tasca no ho demana explícitament.
- No modifiquis la semàntica per fer passar un test.
- No recuperis les coordenades dels prototips v0.x com a font de veritat.
- No tractis el JSON com un SVG indirecte o una llista de punts.
- Separa sempre: semàntica tàctica, relacions espacials, geometria resolta i render.
- El contracte espacial és un graf qualitatiu; no hi afegeixis coordenades,
  distàncies gràfiques ni una resolució única de decisions obertes.
- El mateix jugador manté una identitat persistent al llarg de les fases.
- Les situacions decisionals descriuen opcions, no una solució gràfica obligatòria.
- Qualsevol dada inferida ha de portar estat `provisional` o equivalent.
- L'entrenador és l'única autoritat que pot aprovar una interpretació tàctica.

## Definició canònica actual: 1x1 / finta

L'ordre funcional és sempre:

1. Atacar un espai o interval inicial.
2. Comprometre el defensor.
3. Canviar de direcció i de ritme per atacar l'espai contigu.
4. Superar la línia defensiva marcada pel defensor.
5. Resoldre la situació que apareix a continuació.

La forma funcional és una U: amenaça, compromís defensiu, ruptura direccional
i acceleració de sortida. La recepció en carrera és preferent, però només és
obligatòria quan la tasca ho declara.

Normalment l'oposició és un defensor real. Un material pot substituir-lo
activament, representar passivament la posició d'un defensor absent o limitar
un espai. La funció s'ha de declarar per instància i no es dedueix del tipus de
material.

Una corba suau sense canvi de direcció no és una finta.

## TR-UVOF-001

El primer exercici validat té dues bandes simètriques i dues subaccions:

- `SA1`: central passa al lateral; lateral rep en carrera a l'interval `1–2`,
  supera el segon defensor simulat pel banc mitjançant una finta cap a `2–3`
  i genera un 2x1 amb pivot contra el tercer defensor.
- `SA2`: el mateix lateral recupera sense pilota per darrere de la referència,
  rep una passada curta de l'extrem, orientat a porteria i sense bot, i ataca
  directament el carril `1–2`. El 2x1 amb l'extrem està preparat per la tasca;
  `SA2` no és una finta.

El banc representa activament el segon defensor i s'ubica semànticament entorn
de 9 m. `C1` i `C2` delimiten l'espai de `SA1`; `C3` representa passivament el
segon defensor absent i també delimita l'espai de `SA2`. L'extrem manté
amplitud al seu espai de finalització.

## TR-UVOF-002

El lateral comença amb pilota. Per iniciar la finta `1–2 → 2–3`, passa a
l'extrem, inicia la cursa sense pilota i rep la devolució just quan comença el
canvi de direcció. Per iniciar `2–3 → 1–2`, fa la mateixa seqüència amb el
central.

`D1`, `D2` i els dos `D3` són defensors reals i actius. El xirimbolo és només
un handicap sostingut per `D2`. Si el lateral supera, finalitza quan no hi ha
ajuda; si l'ajuda tanca, dona continuïtat al central a `3–3` o a l'extrem dins
el seu espai exterior. El central espera darrere del lateral per rebre de cara.
Si no hi ha superació, el lateral continua arrossegant `D2` i el central o
l'extrem encreuen per darrere per atacar l'interval oposat.

El contracte espacial vigent és la v0.2. La pilota té un flux independent i
les alternatives utilitzen trajectòries identificades; no s'han d'encadenar
branques incompatibles com si fossin una sola seqüència.

## TR-UVOF-003

És un `6x6` contra defensa `6:0` al 100%. El lateral local comença amb pilota i
té llibertat per atacar `1–2` o `2–3`. Superar el segon per l'exterior genera un
`2x1` amb l'extrem contra el primer; superar-lo per l'interior genera un `2x1`
amb el pivot contra el tercer.

El pivot parteix a `3–3`, guanya posició davant del tercer que no ajuda i manté
un bloqueig estàtic. Si el tercer ajuda, la passada al pivot és obligatòria com
a condició pedagògica de l'exercici, no com a principi universal.

Si el lateral supera el segon per `1–2` i el primer defensor tanca, la passada
a l'extrem és obligatòria com a principi general de joc. L'extrem anticipa la
passada mantenint l'amplitud i finalitza dins el seu espai exterior amb el salt
cap al centre.

Si el lateral acaba a `2–3` sense superar, encreua el central per atacar `1–2`;
si acaba a `1–2`, encreua l'extrem per atacar `2–3`. Si l'encreuament tampoc
genera avantatge, el jugador que ocupa temporalment la posició central connecta
obligatòriament amb el lateral contrari, que reinicia el `1x1`. El pivot adapta
el bloqueig al nou tercer que no ajuda.

## TR-UVOF-004

El lateral comença amb pilota, passa a l'extrem o al central i rep la devolució
en carrera. La passada a l'extrem activa l'atac de `1–2`; la passada al central
activa `2–3`. `D2` és el defensor directe real i volta el con del costat contrari
de la passada. Els cons només creen el handicap de recorregut.

Si `D2` recupera, es resol l'1x1; si no recupera, el lateral finalitza. Després de
superar, `D1` i `D3` defensen activament les continuïtats amb extrem i central.

## TR-UVOF-005

És un `6x6` complet contra defensa `5:1`: sis atacants i sis defensors —dos
primers, dos segons, un tercer o central defensiu i un avançat. El pivot se situa
a una banda i el lateral contrari inicia l'1x1 a l'espai alliberat. La
continuïtat és oberta, però la finalització des de 6 m i el canvi atac–defensa
cada tres pèrdues són condicions de la tasca.

Tot exercici declarat `6x6` s'ha de categoritzar com a `situacio_partit`.

## TR-UVOF-006

El lateral té llibertat per atacar `1–2` o `2–3` contra `D2_LOCAL`. El cilindre
de `D2_LOCAL` és un handicap i no un defensor. El gràfic també declara un segon
cilindre sostingut per `D3_OPOSAT`; aquest tercer continua sent un defensor real.
`D1_LOCAL` i `D3_LOCAL` defensen activament les continuïtats exterior i interior.

Superar per `1–2` genera el 2x1 amb l'extrem; superar per `2–3`, el 2x1 amb el
pivot. Sense superació, encreuen central o extrem segons l'interval final i cada
receptor busca superar. Si la cadena no crea avantatge, el canvi de banda és
preferent, mai obligatori.

## TR-UVOF-007

Dos extrems diferents s'activen en ordre. `CIL_D2` simula el segon defensor.
`EXT_1` encreua amb `L` i resol el primer 2x1 amb `CE` contra `D3`; després `L`
recupera i `EXT_2` resol el segon 2x1 amb `L` contra `D1`.

## TR-UVOF-008

És un `6x6` complet contra `5:1`. `PV` ocupa el `2–3` local i `CE`, que inicia
amb pilota, mobilitza `DAV` cap a aquesta mateixa zona sense que l'avançat
intervingui sobre el pivot. Després `CE` passa a `L_OPOSAT`: el lateral pot
atacar lliurement `1–2` o `2–3` a la banda alliberada i resoldre amb
finalització, continuïtat o encreuament.

## TR-UVOF-009

En la permuta central–lateral, `CE` va a lateral i rep d'`EXT_1`; `L` ocupa el
centre, rep de `PV` i llença trepitjant `BANC_CENTRAL`. Abans, `L` passa a
`EXT_1`. `CE` fa l'1x1 contra `BANC_EXTERIOR` i resol el 2x1 amb `EXT_1` contra
`D1`. Després `EXT_2`, el següent extrem de la fila, passa a `PV`, que llisca i
finalitza des de l'espai restringit. Els tres fluxos de pilota són independents.
El cilindre referencia l'espai restringit de finalització del pivot.

## TR-UVOF-010

Després de la permuta lateral–central, la segona acció només s'activa si `L`
no ha participat en la continuïtat de la primera. `PV` parteix de `CON_PV`, que
delimita l'espai oposat a la trajectòria de `L`; lateral i pivot no poden ocupar
ni atacar el mateix espai. Si `D3` queda pla, `L` llança des de fora. Només si
`D3` puja, `PV` abandona el con, llisca cap a l'espai lliure i rep de `L`.

## TR-UVOF-011

És una situació de partit reduïda `4x4`. Els atacants reals són `EXT`, `L`,
`CE` i `PV`; els defensors reals i actius són `D1_LOCAL`, `D2_LOCAL`,
`D3_LOCAL` i `D3_OPOSAT`. No s'ha de representar la defensa amb un participant
abstracte `DEF_4`.

El flux específic és `L → EXT → L`: `L` passa abans de la permuta, ocupa
temporalment el centre, rep d'`EXT` i inicia l'1x1. `D1_LOCAL` delimita l'espai
exterior de l'extrem. La continuació del 4x4 manté obertes la finalització, la
continuïtat i l'encreuament segons la resposta dels quatre defensors, sense
forçar un emparellament directe no validat.

## TR-UVOF-013

És un `4x4` amb un passador extern que no computa en la relació. Després de la
permuta lateral–central, `L` rep de `L_OPOSAT` al centre i ataca obligatòriament
l'interval `2–3`, anomenat primer pal a la tasca. Si `D3_LOCAL` no puja, `L`
continua i finalitza; si puja, `PV` llisca i la passada és obligatòria.

## TR-UVOF-014

És una situació de partit `6x6` contra una defensa `6:0` completa. L'atac ha de
començar amb permuta lateral–central: `L_LOCAL` ocupa el centre, `CE` s'obre i
`L_LOCAL` rep de `L_OPOSAT`. Després d'aquest inici obligatori, les decisions de
joc continuen obertes.

## TR-UVOF-015

Són tres 1x1 simultanis en tres zones delimitades per quatre cons. Cada zona té
atacant, passador de suport, defensor real i pilota propis. L'atacant passa,
inicia en carrera, rep orientat i resol sense bot dins els límits de la seva
zona. La pilota única del gràfic és un exemple visual que es replica a les tres
zones; no s'ha de reduir el model a un sol duel.

## Regla general de permuta

La direcció nomena el jugador que canvia de posició i el lloc que ocupa. En una
permuta `central–lateral`, `CE` va a lateral i la recepció s'habilita amb
`EXT`. En una permuta `lateral–central`, `L` va al centre i rep de
`L_OPOSAT`. La passada habilitadora és un flux separat; una variant específica
de tasca només preval si l'entrenador l'ha validada explícitament.

## Flux de treball obligatori

Abans de tocar codi:

1. Llegeix `docs/PROJECT_CONTEXT.md`.
2. Llegeix `docs/DOMAIN_MODEL.md`.
3. Llegeix `docs/DECISIONS.md`.
4. Llegeix `docs/CURRENT_STATE.md`.
5. Inspecciona l'exercici i l'esquema afectats.
6. Si la tasca afecta la capa espacial, llegeix
   `docs/SPATIAL_RELATIONS_CONTRACT.md`.

Durant la implementació:

- Fes canvis petits i justificables.
- Mantén compatibilitat amb l'esquema o incrementa'n la versió.
- Afegeix tests per a cada invariant nou.
- No amaguis amb coordenades un problema semàntic.
- Si una decisió tàctica no està validada, atura't i deixa-la com a pregunta oberta.

Abans d'acabar:

```bash
python scripts/validate_semantic.py
python -m pytest -q
```

Informa de:

- fitxers modificats;
- decisions semàntiques introduïdes;
- inferències provisionals;
- tests executats;
- preguntes que requereixen l'entrenador.

## Estil de codi

- Python 3.11 o superior.
- Tipatge quan aporti claredat.
- Funcions petites i noms explícits.
- JSON UTF-8, indentació de 2 espais i claus estables.
- Errors de validació amb `code`, `path` i `message`.
- No afegeixis dependències pesades sense necessitat.

## Pull requests

El resum del PR ha d'incloure:

1. problema resolt;
2. canvis semàntics;
3. canvis d'esquema;
4. proves;
5. riscos o punts pendents de validació humana.
