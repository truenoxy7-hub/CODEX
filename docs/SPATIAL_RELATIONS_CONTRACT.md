# Contracte de relacions espacials v0.2

## Propòsit

El contracte converteix la semàntica tàctica validada en un graf qualitatiu que
un futur motor espacial podrà resoldre. Defineix **què ha de quedar relacionat**
sense decidir encara **a quines coordenades** s'ha de dibuixar.

Les instàncies executables actuals són les de `TR-UVOF-001` a `TR-UVOF-006`;
totes compleixen
`schema/traca.spatial-relations.schema.v0.2.json`.

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

Un espai és una relació derivada, no una franja fixa. La versió 0.1 admet:

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

La primera instància representa:

- `INT_1` entre el primer defensor implícit i el banc;
- `INT_2` entre el banc i el tercer defensor;
- `INT_PV_SA1` com a interval `3–3` complementari per al pivot;
- la recepció, finta, superació i resolució de `SA1`;
- la recuperació de `L` per darrere del banc;
- la recepció orientada i l'atac directe d'`INT_3` a `INT_4`;
- l'amplitud permanent de l'extrem;
- les dues resolucions 2x1 com a branques obertes.

Les dues bandes es descriuen a partir d'una plantilla i una declaració de
simetria. La versió 0.2 encara no executa la reflexió geomètrica.

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

## Validacions executables

El validador comprova:

- compliment de l'esquema;
- absència de geometria;
- correspondència amb l'exercici font;
- identificadors únics;
- existència de participants, materials, espais, fases i referències;
- contigüitats simètriques amb un referent realment compartit;
- relacions i transicions sense referències penjants;
- continuïtat de les transicions d'un mateix actor;
- continuïtat del posseïdor dins cada flux de pilota;
- correspondència de pilotes i decisions amb la font semàntica;
- presència dels invariants de no-coordenades, identitat persistent i decisió
  no predeterminada.

Els errors mantenen `code`, `path` i `message`.

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

## Abast i pendents de v0.2

La versió 0.2 valida l'arquitectura amb `TR-UVOF-001`–`TR-UVOF-006`; encara no
és un motor. Abans de congelar-ne el vocabulari cal:

- provar-lo amb exercicis de permuta i situació de partit;
- definir com canvien els intervals quan els defensors es desplacen entre
  estats;
- especificar la normalització de costat i la reflexió de les dues bandes;
- separar les prioritats tàctiques de les preferències del futur solucionador;
- decidir el contracte de sortida geomètrica en una versió posterior.
