# Flux universal de casos

## Objectiu

El workspace de TRAÇA accepta una descripció nova de qualsevol situació
d’handbol. Conserva el text exactament, assigna un identificador local i avança
fins on permet el coneixement disponible. `TR-UVOF-015` és un espècimen
canònic i una prova de regressió, no l’arrel oculta de tots els casos.

## Flux

1. **Nou cas.** L’entrenador introdueix nom, text, origen, etiquetes i notes.
2. **Interpretació parcial.** Els providers retornen conceptes validats,
   coincidències provisionals, conceptes desconeguts i preguntes no resoltes.
3. **Construcció assistida.** Es poden completar participants, materials,
   espais, accions, decisions i fases sense inventar una ontologia tancada.
4. **Representació.** Un resolutor existent pot aportar `generatedGeometry`.
   Si no n’hi ha, el cas continua i l’entrenador pot crear una
   `coach_reference_geometry` manual.
5. **Correcció.** Cada discrepància es registra a la capa semàntica, espacial,
   geomètrica o visual amb explicació de màquina i motiu de l’entrenador.
6. **Preflight.** Els errors bloquegen; els warnings i les preguntes es mostren
   però no impedeixen necessàriament validar.
7. **Validació i guardat.** La validació és del cas. Els casos incomplets també
   es poden guardar amb estat `in_construction`.
8. **Promoció opcional.** Només després de validar es pot construir un candidat
   reutilitzable amb les correccions seleccionades.

## Autoritat geomètrica

- `generatedGeometry`: resultat d’un resolutor identificat;
- `workingGeometry`: còpia de treball amb correccions del cas;
- `coach_reference_geometry`: croquis explícit de l’entrenador quan no hi ha
  resolutor;
- `validatedGeometry`: instantània del cas validat.

Una referència manual no es reetiqueta mai com a geometria generada, no crea
coneixement tàctic i no es promociona automàticament.

## Resultat sense resolutor

La manca de resolutor és informació, no un error. El cas pot conservar la
interpretació, el model semàntic, les preguntes, les correccions, una referència
manual i l’estat de validació. TRAÇA no reutilitza l’UVOF015 ni dibuixa una
geometria plausible per amagar aquesta absència.
