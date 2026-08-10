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
posició del segon i és qui rep després de la permuta.

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
v0.2 amb `TR-UVOF-001` i `TR-UVOF-002`. La geometria de sortida continua
pendent.

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
