# Coneixement canònic d'handbol

## Propòsit i governança

Aquest document recull el coneixement tàctic confirmat per l'entrenador i serveix de
base viva per al llenguatge de TRAÇA. No pretén tancar tot el domini de l'handbol.

Cada afirmació s'ha d'interpretar segons un dels nivells següents:

- **invariant**: forma part de la definició del concepte;
- **principi preferent**: guia la conducta, però admet adaptació contextual;
- **condició de tasca**: és obligatòria només dins l'exercici que la declara;
- **provisional**: encara requereix contrast amb l'entrenador.

Les ampliacions futures han de conservar aquesta distinció. Una preferència o una
condició d'un exercici no es pot convertir en invariant general.

## Rols ofensius

Les posicions ofensives bàsiques són:

- central;
- lateral esquerre i lateral dret;
- extrem esquerre i extrem dret;
- pivot.

La identitat del participant és persistent. La posició inicial, la posició ocupada
durant l'acció i la funció tàctica actual són propietats diferents. Un lateral pot
ocupar temporalment una posició de central o extrem sense deixar de ser el mateix
participant.

## Rols defensius

Els rols es numeren des de l'exterior cap al centre:

- `1r defensor`, sinònim de `defensor exterior`;
- `2n defensor`;
- `3r defensor`, sinònim de `central defensiu`;
- `avançat`.

Pot haver-hi un o dos jugadors amb el mateix rol. La quantitat i la profunditat
depenen de la predisposició estructural.

### Sistemes defensius

La nomenclatura d'un sistema es llegeix des de la línia més pròxima a porteria
cap a la més avançada.

- `6:0`: sis jugadors a la primera línia; dos exteriors, dos segons i dos
  centrals defensius.
- `5:1`: cinc jugadors a la primera línia; dos exteriors, dos segons i un
  central defensiu; un avançat.
- `3:2:1`: dos exteriors i un central defensiu a 6 m; dos segons en una
  segona línia amb profunditat; un avançat sempre per davant dels segons.
- `4:2`, `3:3` i altres estructures segueixen la mateixa lògica de línies,
  rols, costats i profunditat, però la seva caracterització detallada continua
  oberta a exemples futurs.

El sistema no es pot deduir només dels noms dels rols: també cal representar la
línia, el costat i la profunditat relativa.

## Espais i intervals

Un interval és l'espai dinàmic entre dos defensors. El defineixen els rols i les
posicions actuals dels defensors, encara que estiguin a profunditats diferents.
No és una franja fixa ni una coordenada.

La numeració recomença simètricament des de cada costat:

- interval `1–2`: entre el primer i el segon defensor;
- interval `2–3`: entre el segon i el tercer defensor;
- interval `3–3`: entre els dos tercers o centrals defensius.

El terme **carril** és sinònim específic de l'interval `1–2`. No s'utilitza per
als intervals `2–3` o `3–3`.

Dos intervals són contigus quan comparteixen el defensor que els delimita. Per
exemple, `1–2` i `2–3` són contigus perquè comparteixen el segon defensor.

### Espai de finalització de l'extrem

És el tram exterior de l'àrea de 6 metres comprès entre la línia de fons —la
línia on hi ha la porteria— i el primer defensor. `0–1` es pot conservar com a
àlies tècnic, però no és la denominació principal de l'entrenador.

L'extrem ha de mantenir l'amplitud. En la finalització sempre busca guanyar angle:
l'última passa ha de permetre saltar cap al centre i l'extrem sempre salta cap a
dins.

## Finta i superació

La finta té forma funcional de U i consta sempre de:

1. atac a un espai o interval;
2. compromís del defensor;
3. canvi de direcció;
4. canvi de ritme;
5. atac de l'espai contigu;
6. superació del defensor.

La fixació és un mitjà dins la finta; l'objectiu és la superació. Un defensor
queda superat quan l'atacant travessa la línia defensiva marcada per la seva
posició i progressa cap a porteria per darrere d'aquesta línia.

La recepció en carrera és preferible perquè conserva el bot i manté més opcions,
però no és un invariant de tota finta. Pot ser una condició obligatòria d'una
tasca concreta.

No són fintes:

- una corba sense compromís defensiu;
- un canvi de direcció abans de comprometre el defensor;
- continuar pel mateix espai;
- canviar d'espai sense canvi de ritme.

## Fixació i decisió

Hi ha fixació quan el defensor queda compromès i ja no pot controlar
simultàniament el portador de pilota i el company relacionat amb l'acció.

En una situació decisional:

- si el defensor no tanca, el portador continua o finalitza;
- si el defensor tanca i queda compromès, apareix l'opció de passada.

TRAÇA no ha d'imposar una única solució. El jugador conserva el criteri per llegir
la situació.

## Superioritat local 2x1

Un `2x1` és una superioritat numèrica local: dos atacants relacionats contra un
defensor dins un sector concret. Pot ser:

- conseqüència d'una acció anterior que supera o desequilibra la defensa;
- una situació preparada artificialment per una tasca d'entrenament.

Cal separar:

1. l'acció generadora, quan existeix;
2. la situació local de superioritat;
3. l'explotació mitjançant finalització o passada.

Quan un lateral supera el segon defensor, la direcció de la superació determina
la relació local:

- per l'exterior, dins `1–2`, es genera un `2x1` amb l'extrem contra el primer
  defensor;
- per l'interior, dins `2–3`, es genera un `2x1` amb el pivot contra el tercer
  defensor.

En el `2x1` exterior, si el primer defensor no tanca, el lateral continua i
finalitza. Si el primer tanca, la passada a l'extrem és obligatòria com a
principi general de joc. L'extrem anticipa la passada mantenint l'amplitud, rep
dins el seu espai exterior de finalització i salta cap al centre.

En la continuïtat interior amb el pivot, la tasca pot imposar una resposta
concreta per forçar un aprenentatge —per exemple, passada obligatòria al pivot—,
però aquesta obligació s'ha de marcar com a `condicio_tasca` i no com a principi
universal.

## Coordinació amb jugadors sense pilota

El portador ha d'entendre preferentment quin espai li correspon atacar. Aquesta
assignació és contextual i no fixa.

Com a principi general, els jugadors sense pilota s'adapten a la trajectòria del
portador per evitar superposicions. En la relació lateral–pivot:

- el lateral ha d'evitar atacar l'interval ocupat pel pivot;
- si hi entra, el pivot s'adapta i ocupa l'interval adjacent lliure;
- lateral i pivot no han d'acabar ocupant el mateix interval.

L'extrem manté l'amplitud i utilitza el criteri tàctic per anticipar una possible
passada, iniciar la carrera i guanyar avantatge.

## Recepció orientada i ús del bot

Una recepció orientada permet continuar sense frenar ni reorientar-se:

- es produeix en moviment;
- orienta cos i trajectòria cap a porteria;
- prepara l'atac de l'interval;
- conserva opcions de finalització i passada.

En zones exteriors sempre es busca guanyar angle. L'última passa i el salt
s'orienten cap al centre.

Evitar el bot és un principi preferent. Només és una prohibició quan una tasca ho
declara explícitament.

## Materials i referències

Els materials poden tenir funcions semàntiques diferents:

- **substitut oposicional actiu**: simula el defensor contra el qual s'executa
  una acció;
- **referència posicional passiva**: representa la posició funcional d'un
  defensor absent;
- **límit espacial**: delimita la zona de treball sense representar cap
  defensor.

La funció s'ha de declarar per cada material. No es pot deduir només del fet que
sigui un banc o un con.

Un material també pot actuar com a hàndicap sense representar cap defensor:

- un defensor real pot sostenir un xirimbolo o cilindre que en limita la
  intervenció;
- un con pot obligar el defensor a fer un recorregut addicional;
- en tots dos casos el defensor continua sent la referència oposicional real.

Quan hi ha més d'un material de handicap, cal declarar quin defensor real sosté
cadascun. El material no elimina el rol ni converteix el defensor en passiu.

## Punt fort i punt feble del 1x1

Cal separar el significat conceptual de la relació biomecànica individual.

Conceptualment:

- `punt fort` significa sortir cap a dins, en direcció al centre;
- `punt feble` significa sortir cap a fora, en direcció a l'exterior.

Individualment:

- per a un jugador dretà, la sortida forta és cap a la dreta perquè conserva el
  braç de llançament lliure;
- per a un jugador esquerrà, la sortida forta és cap a l'esquerra.

El punt fort conceptual i el costat fort individual poden no coincidir. El
model ha de conservar separadament la direcció tàctica, la mà dominant i el
costat individual de sortida.

## Encreuament i canvi de banda

Després d'un encreuament sempre es busca una superació real. L'encreuament no
és una circulació neutra ni una preparació mecànica per passar la pilota.

Si l'acció posterior a l'encreuament tampoc genera avantatge local, és
recomanable valorar el canvi de banda per atacar una defensa desplaçada. Aquesta
és una opció preferent, no una obligació: el portador pot continuar al mateix
sector si hi identifica una opció favorable.

La posició ocupada en cada moment determina les relacions. Quan es diu que el
jugador que queda de central connecta amb la banda contrària, `central` descriu
la posició temporal i no necessàriament el rol inicial del participant.

## Permuta

La nomenclatura de la permuta és ordenada:

1. el primer jugador és qui canvia cap a la posició del segon;
2. el segon jugador ocupa l'espai deixat pel primer;
3. el primer jugador és qui rep la pilota després de la permuta.

Per tant:

- `central–lateral`: el central canvia cap a lateral, el lateral va al centre i
  el central original rep mitjançant una passada amb l'extrem;
- `lateral–central`: el lateral canvia cap al centre, el central s'obre i el
  lateral original rep del lateral contrari.

Aquesta és la topologia general de passada. La tasca pot fixar un flux específic
diferent, però s'ha de declarar explícitament i haver estat validat. La passada
habilitadora, l'intercanvi de posicions i la primera acció posterior són moments
separats encara que el llenguatge oral els agrupi sota el terme `permuta`.

La identitat inicial, la posició temporal i la funció actual s'han de conservar
com a propietats separades.

## Pivot: guanyar posició, bloqueig estàtic i lliscament

Guanyar posició és la intenció tàctica del pivot. En un bloqueig estàtic, el
pivot ocupa i manté una posició per davant del defensor per impedir-ne l'ajuda
o la intercepció i conservar una línia de passada.

Quan un defensor interior puja a contactar o ajudar, el pivot pot lliscar cap a
l'espai lliure. Quan una tasca declara el lliscament com a resposta obligatòria,
no s'ha de modelar com una simple opció.

## Situació de partit

`Situació de partit` és un tipus recurrent d'exercici. Pot ser global o reduït i
inclou:

- oposició real;
- relació numèrica i sistema defensiu declarats;
- rols ofensius i defensius actius;
- una o més condicions pedagògiques d'inici o finalització;
- continuïtats obertes segons el criteri dels jugadors.

Una permuta obligatòria, una finalització des de 6 m o un recompte de pèrdues
poden ser condicions de la tasca sense convertir tota la situació en una jugada
tancada.

Com a regla de classificació del corpus, qualsevol exercici `6x6` és una
`situacio_partit`. Més endavant es podrà especialitzar aquest tipus, però no es
reclassifica provisionalment com a exercici analític o reduït.

## Files, ordre d'activació i múltiples pilotes

Una fila pot contenir diversos participants amb el mateix rol. Cada participant
manté una identitat pròpia i pot tenir un ordre d'activació diferent.

Quan una tasca utilitza més d'una pilota, cada pilota ha de declarar el seu
posseïdor inicial i el seu flux. No es pot heretar automàticament la possessió
d'una acció anterior ni inferir el passador quan la font no l'especifica.

Quan diverses accions es desencadenen després d'una permuta, l'ordre de les
passades i les posicions temporals s'han de conservar separadament. Una mateixa
permuta pot activar simultàniament el receptor que s'obre, el jugador que ocupa
el centre i una continuïtat posterior del pivot, sense fusionar les pilotes ni
canviar la identitat inicial dels jugadors.

Dos materials del mateix tipus no comparteixen automàticament funció. Un banc
pot substituir l'oposició d'un 1x1 i un altre pot ser només una base de
trepitjada per a un llançament; el model els ha d'identificar per separat.

## Coneixement encara obert

El vocabulari continuarà creixent amb nous exercicis. Encara cal aprofundir en:

- altres sistemes defensius i les seves transformacions;
- accions col·lectives més enllà del 2x1 i l'encreuament;
- criteris espacials específics per a altres famílies d'exercicis;
- model temporal complet del bot, els passos, la passada i la finalització.
