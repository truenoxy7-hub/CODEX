# Context complet del projecte TRAÇA

## Objectiu

TRAÇA ha de permetre entendre, emmagatzemar, cercar, validar i representar exercicis d'handbol sense perdre la seva intenció tàctica. El projecte neix d'un banc existent d'exercicis amb text i gràfics manuals.

## Problema detectat durant els prototips

Les primeres iteracions van aconseguir un pipeline JSON → SVG, però el JSON es va convertir massa sovint en una llista manual de coordenades. Això produïa dibuixos tècnicament deterministes però tàcticament incorrectes.

Exemple: es demanava una finta i s'ajustaven punts d'una corba fins que “semblés una U”. El sistema no entenia que una finta exigeix rebre en un interval, amenaçar-lo, canviar de direcció i sortir per l'interval contigu.

Per tant, el projecte s'ha reiniciat des de la capa semàntica.

## Arquitectura prevista

```text
Corpus original
  ↓
Interpretació semàntica provisional
  ↓
Validació de l'entrenador
  ↓
JSON semàntic aprovat
  ↓
Motor de resolució espacial
  ↓
JSON geomètric derivat
  ↓
Renderer SVG determinista
```

Cada capa ha de poder validar-se independentment.

## Principis

- La tècnica i la tàctica són inseparables en la pràctica.
- Només es dibuixa allò necessari per entendre organització, seqüència, condicions visibles i relació tàctica amb espai i porteria.
- Un material pot substituir un defensor, però no altera el contingut tàctic.
- Els intervals són relacionals, no simples coordenades.
- La pilota té un flux temporal propi.
- Un participant manté una única identitat i pot tenir estats temporals.
- El coach valida; TRAÇA prepara, comprova i deriva.

## Banc original

La font és un full de càlcul amb 14 categories i triplets ENLLAÇ / EXPLICACIÓ / GRÀFIC. La categoria actual és `MITJANS 1V1 OFENSIUS`, amb 15 exercicis `TR-UVOF-001` a `TR-UVOF-015`.

El primer exercici s'ha seleccionat perquè ja ha estat analitzat extensament i permet construir les primeres definicions canòniques.

## Text original de TR-UVOF-001

> El treball consisteix en un treball a dues bandes, on en la primera acció amb 1v1 sobre el banc cap al centre juguem un 2v1 amb PV, i recuperem per rebre del extrem donant importància a la trajectòria per jugar un 2v1 amb extrems

## Interpretació validada

- Dues bandes paral·leles i simètriques.
- Dos centrals passadors, un per banda.
- El banc substitueix el defensor directe.
- El lateral rep en carrera per l'exterior del banc.
- Executa una finta amb canvi de direcció cap a l'espai interior contigu.
- Resol un 2x1 amb pivot dins Z1.
- El mateix lateral recupera sense pilota per darrere del banc.
- Rep una passada curta de l'extrem, orientat a porteria i sense necessitat de bot.
- Ataca l'interval entre el defensor exterior i el con.
- Resol un 2x1 amb extrem dins Z2.

## Estat actual

S'ha creat un JSON purament semàntic. No conté coordenades ni render. Aquest és el punt de partida vàlid.
