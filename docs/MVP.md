# MVP de TRAÇA

## Resultat de producte

L'entrenador escriu la descripció d'un exercici, revisa què ha interpretat
TRAÇA i, després de confirmar-ho, obté un gràfic traçable.

```text
descripció
  → interpretació semàntica provisional
  → confirmació de l'entrenador
  → relacions espacials
  → geometria derivada
  → SVG
```

## Iteracions

1. Interfície navegable amb un exercici validat.
2. Resolució geomètrica i SVG de `TR-UVOF-015` des del contracte v0.3 `ready`.
3. Interpretació de text nou dins d'un abast 1x1, revisió i geometria
   provisional. **En curs.**
4. Ampliació progressiva del llenguatge: variants 1x1, 2x1, continuïtats,
   col·laboracions i situacions de partit.
5. Edició, regeneració, persistència i exportació de producte.

## Pantalla mínima

- descripció original editable;
- resum de participants, organització, materials, fases i decisions;
- preguntes pendents o confirmació explícita;
- previsualització del gràfic;
- estat de traçabilitat de cada capa;
- exportació SVG i PNG quan existeixi un render validat.

## Assolit a la primera vertical executable

- perfil de mitja pista basat en les regles IHF de juliol de 2025;
- tres zones i sis espais derivats de les relacions d'UVOF015;
- dotze alternatives conservades sense selecció tàctica automàtica;
- un selector independent per duel;
- renderer SVG i descàrrega de l'SVG visible;
- traçabilitat fins als nodes, espais, transicions i alternatives d'origen.

## Assolit al primer intèrpret de text nou

- l'exemple de pantalla és text editable i no un identificador del corpus;
- detecció explícita d'una única situació 1x1;
- extracció de rol atacant i defensiu, costat, possessió inicial, suport, bot i
  llibertat o direcció declarada;
- aplicació traçable del criteri general validat de llibertat en el 1x1 quan el
  text no tanca la sortida;
- dades absents i detalls encara no representables marcats abans de confirmar;
- rebuig explícit de 2x1, múltiples zones o textos on el 1x1 no és inequívoc;
- una geometria provisional amb dues sortides, continuïtats i fintes, sense
  convertir cap alternativa en decisió canònica.

## Fora d'abast actual

- interpretar descripcions noves fora de l'abast d'un únic 1x1;
- escollir automàticament una alternativa decisional;
- persistència, comptes d'usuari o publicació d'exercicis;
- PNG;
- resolució geomètrica general dels altres catorze exercicis.

## Criteri de validació de la interfície

L'entrenador ha de poder entendre sense ajuda:

1. on escriure la descripció;
2. què ha entès TRAÇA;
3. què ha de confirmar;
4. on apareixerà el gràfic;
5. en quin punt del procés es troba.
