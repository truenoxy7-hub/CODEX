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

El primer exercici validat parcialment té dues bandes simètriques i dues subaccions:

- `SA1`: central passa al lateral; lateral rep en carrera a l'interval `1–2`,
  supera el segon defensor simulat pel banc mitjançant una finta cap a `2–3`
  i genera un 2x1 amb pivot contra el tercer defensor.
- `SA2`: el mateix lateral recupera sense pilota per darrere de la referència,
  rep una passada curta de l'extrem, orientat a porteria i sense bot, i ataca
  directament el carril `1–2`. El 2x1 amb l'extrem està preparat per la tasca;
  `SA2` no és una finta.

El banc representa activament el segon defensor i s'ubica semànticament entorn
de 9 m. `C1` i `C2` delimiten l'espai de `SA1`; `C3` representa passivament el
segon defensor absent de `SA2`. L'extrem manté amplitud al seu espai de
finalització.

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
