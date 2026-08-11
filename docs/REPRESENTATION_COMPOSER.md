# RepresentationComposer

## Objectiu i límit

`interface/js/representation-composer.js` és un compositor de primitives conegudes. No selecciona una geometria d'un exercici del corpus i no pretén resoldre qualsevol situació d'handbol.

La primera composició és una passada simple:

1. identifica rols ofensius explícits;
2. resol la relació `from → to` si la frase la declara;
3. si falta, pregunta `pass_from` i `pass_to`;
4. crea participants i possessió inicial;
5. crea la passada vinculada a emissor, receptor i estats;
6. si la recepció és en carrera, crea un estat futur del receptor;
7. fa acabar la seva trajectòria i la passada exactament en aquest estat.

## Resultats

- `ready`: hi ha geometria provisional i llista de primitives usades;
- `needs_input`: no hi ha geometria i hi ha preguntes directes;
- `unsupported`: la interpretació no conté una acció composable coneguda.

## Geometria i traçabilitat

La sortida declara `TRACA_composed_geometry`, autoritat `known_primitives`, política de layout provisional, estats persistents, dependències i referències `coach_input`. Els espais relacionals no es dibuixen i les col·leccions `spaces` i `zones` queden buides per defecte.

El preflight verifica identitats, propietaris d'estat, actor de moviment, emissor/receptor de passada, ancoratge visual i límits de pista.

## Ampliació

Una nova composició només s'ha d'afegir quan existeixin:

- semàntica i relacions mínimes definides;
- primitives visuals validades amb evidència;
- preguntes per als camps que no es poden inferir;
- dependències per mantenir destinacions compartides;
- proves positives, negatives i de no-invenció.

Els candidats i les relacions amb `universal_geometry: unresolved` no habiliten composició automàtica.
