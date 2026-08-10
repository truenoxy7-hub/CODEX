# Estat actual

## Completat

- Estructura inicial del projecte.
- Definició semàntica reutilitzable de `1x1_finta`.
- Model semàntic inicial de `TR-UVOF-001`.
- Esquema JSON v1.0.
- Validador estructural local.
- Validador semàntic executable dels 9 invariants declarats.
- Tests positius i negatius del validador semàntic.
- CI bàsica.
- Corpus semàntic complet de `TR-UVOF-001` a `TR-UVOF-015`.
- Esquema genèric de corpus v1.1.
- Model explícit de fases, decisions, permutes, files i múltiples pilotes.
- Vocabulari validat d'encreuament, permuta, bloqueig estàtic, lliscament,
  situació de partit i punt fort/feble.
- Contracte de relacions espacials v0.2 sense coordenades.
- Instàncies relacionals executables de `TR-UVOF-001` a `TR-UVOF-012`.
- Flux de pilota per trajectòria i encreuament explícit per darrere del portador.
- Bloqueig estàtic del pivot, rols temporals i canvi de banda validats en 6x6.
- Passada–devolució amb handicap de recorregut, defensa 5:1 completa i
  handicaps defensius amb cilindres representats explícitament.
- Classificació executable de qualsevol relació 6x6 com a `situacio_partit`.
- Ordre d'activació de dos extrems, concentració defensiva completa en 5:1 i
  primera permuta central–lateral amb tres fluxos de pilota independents.
- Cilindre d'UVOF009 validat com a referència de l'espai restringit del pivot.
- Topologia general de passada de les permutes i variant específica
  `L → EXT → L` d'UVOF011 representades explícitament.
- Activació condicional posterior d'UVOF010 i dues superioritats ordenades
  d'UVOF012 amb defensors `D3` i `D1` diferenciats.
- Validacions de referències, contigüitats, continuïtat i decisions obertes.

## No completat

- Vocabulari complet per a totes les famílies d'exercicis.
- Motor de resolució d'intervals.
- JSON geomètric.
- Renderer SVG nou.

## Risc principal

Tornar a introduir coordenades abans d'haver estabilitzat el model tàctic.

## En curs

- Primera versió viva del coneixement canònic d'handbol.
- Consolidació del corpus UVOF com a font de proves per al futur motor espacial.
- Contrast del contracte relacional amb exercicis més enllà de `TR-UVOF-001`.

## Pròxima fita recomanada

Aplicar el contracte relacional v0.2 a `TR-UVOF-013`–`TR-UVOF-015`, completar
el primer corpus relacional UVOF i revisar-lo abans de definir el resolutor
geomètric.
