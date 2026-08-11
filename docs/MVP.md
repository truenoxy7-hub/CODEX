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
3. Interpretació de la descripció original i contrast amb el model aprovat.
4. Cobertura dels quinze exercicis UVOF, edició, regeneració i exportació.

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

## Fora d'abast actual

- interpretar descripcions noves;
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
