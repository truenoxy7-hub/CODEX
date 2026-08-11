# Flux d'aprenentatge supervisat

## Propòsit

TRAÇA aprèn mitjançant contrast explícit amb l'entrenador. Una correcció no és
una ordre opaca sobre un SVG: és un esdeveniment traçable vinculat al cas, a la
capa afectada i a les fonts que el van originar.

## Cicle

1. **Descriure.** Es conserva el text i l'origen.
2. **Interpretar.** S'exposen fets, condicions i buits. A l'MVP, aquesta lectura
   ja està validada per UVOF015; el text arbitrari encara no s'executa.
3. **Generar.** El resolutor produeix `generatedGeometry` des d'una entrada
   espacial `ready`.
4. **Revisar.** L'entrenador contrasta vista neta, vista de control i fonts.
5. **Corregir.** Cada canvi s'aplica només a `workingGeometry` o a la gramàtica
   visual de treball i crea un esdeveniment.
6. **Validar.** Es congela `validatedGeometry` i es validen els esdeveniments
   actuals com a decisions d'aquest cas.
7. **Guardar.** El cas validat s'incorpora a la biblioteca local.
8. **Reutilitzar.** Només una acció explícita crea un candidat de patró o de
   regla general.

## Garanties

- l'original generat no es muta;
- desfer i refer reprodueixen l'historial;
- reiniciar elimina les correccions i recalcula des de l'original;
- canviar l'alternativa visible no crea cap correcció;
- validar un cas no altera la semàntica ni les relacions espacials canòniques;
- una regla general sempre neix amb estat `candidate`;
- la promoció canònica queda fora de l'MVP i requereix revisió humana.

## Persistència i portabilitat

La sessió es desa a `localStorage`. El paquet exportat conserva:

- descripció i referències d'origen;
- referències semàntiques i espacials;
- geometria i gramàtica visual generades;
- correccions i estat de validació;
- geometria i gramàtica visual validades, si existeixen;
- decisions visuals i alternatives visibles;
- casos desats i candidats de promoció;
- metadades que declaren `canonical_promotion: false`.

La importació valida la forma mínima del paquet abans de restaurar l'estat.

## Evolució prevista amb UVOF001

El mateix model d'estat està preparat per afegir múltiples estats temporals,
posicions futures, bancs i cons, rols de pivot i extrem, passades, fintes, 2x1,
recuperacions, dues subaccions i simetria. Aquesta extensió s'ha de fer sobre el
model; no mitjançant catorze resolutors independents dins la interfície.
