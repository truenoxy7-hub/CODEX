# Contracte de relacions espacials v0.1

## Propòsit

El contracte converteix la semàntica tàctica validada en un graf qualitatiu que
un futur motor espacial podrà resoldre. Defineix **què ha de quedar relacionat**
sense decidir encara **a quines coordenades** s'ha de dibuixar.

La primera instància executable és
`exercises/TR-UVOF-001/spatial-relations.json` i compleix
`schema/traca.spatial-relations.schema.v0.1.json`.

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
pilota, ajust sense pilota o resolució. Els qualificadors expliquen la intenció
tàctica; no descriuen una corba.

Els trams consecutius d'un mateix actor han de ser connectats: la destinació
d'un tram és l'origen del següent quan aquest origen està declarat.

### 5. Branques decisionals

Una branca referencia una decisió semàntica i conserva almenys dues
alternatives. La resolució és sempre `no_predeterminada`.

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
simetria. La versió 0.1 encara no executa la reflexió.

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

## Abast i pendents de v0.1

La versió 0.1 valida l'arquitectura amb `TR-UVOF-001`; encara no és un motor.
Abans de congelar-ne el vocabulari cal:

- provar-lo amb exercicis d'encreuament, permuta, bloqueig i situació de partit;
- definir com canvien els intervals quan els defensors es desplacen entre
  estats;
- especificar la normalització de costat i la reflexió de les dues bandes;
- separar les prioritats tàctiques de les preferències del futur solucionador;
- decidir el contracte de sortida geomètrica en una versió posterior.
