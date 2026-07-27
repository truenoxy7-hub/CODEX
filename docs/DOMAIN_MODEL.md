# Model de domini tàctic

## 1. Contingut tàctic

Un contingut tàctic és una definició reutilitzable independent de l'exercici concret. Exemples futurs: 1x1/finta, fixació, passada i va, creuament, bloqueig, 2x1.

### 1x1 / finta

Seqüència invariant:

1. `recepcio_en_carrera` a l'interval inicial.
2. `finta_canvi_direccio` cap a l'interval contigu.
3. `resolucio_posterior`.

La fase 2 ha de contenir:

- amenaça del primer interval;
- canvi explícit de direcció;
- canvi de ritme;
- sortida pel costat contigu de la referència oposicional.

## 2. Referència oposicional

La referència habitual és un defensor real. Els substituts admesos inclouen:

- banc;
- con;
- cilindre;
- altre objecte fix.

Camps mínims:

- `tipus_real`;
- `tipus_utilitzat_exercici`;
- `equivalencia`;
- `funcio_tactica`;
- `posicionament_semantic`.

No s'ha de confondre la referència oposicional amb un material decoratiu.

## 3. Espais i intervals

Un interval és una relació entre referències, no una coordenada.

Exemples:

- exterior d'un defensor o banc;
- interior de la mateixa referència;
- entre defensor exterior i con;
- proper a l'extrem i orientat a porteria.

Cada interval ha de declarar:

- identificador;
- tipus;
- relació;
- funció;
- contigüitat quan sigui rellevant.

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

## 7. Geometria futura

La geometria serà derivada de:

- pista reglamentària;
- rol posicional;
- referències espacials;
- intervals;
- distàncies funcionals;
- invariants tàctics.

Les coordenades no pertanyen al JSON semàntic.
