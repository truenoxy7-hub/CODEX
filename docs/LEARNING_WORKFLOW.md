# Flux d’aprenentatge supervisat

## Cicle

1. **Descriure.** Es conserva el text exacte, l’origen, les etiquetes i notes.
2. **Interpretar.** Els providers locals separen coneixement validat,
   coincidències provisionals, desconeguts i punts no resolts.
3. **Completar.** L’entrenador afegeix o confirma elements del model semàntic.
4. **Representar.** Un resolutor identificat pot aportar geometria. Sense
   resolutor es pot continuar i crear una referència manual.
5. **Corregir.** Cada canvi produeix un esdeveniment traçable i reversible.
6. **Preflight.** Es comproven límits, identitats, fonts i contradiccions
   tàctico-geomètriques amb severitat humana.
7. **Validar.** Només els errors bloquegen. La validació congela el cas, no una
   regla universal.
8. **Guardar i aprendre.** El cas i els seus punts no resolts entren a la
   biblioteca local. Una promoció separada pot crear un candidat.

## Garanties

- l’entrada arbitrària no es reemplaça per un UVOF;
- `generatedGeometry` no es muta;
- `coach_reference_geometry` mai no es presenta com a generada;
- desfer i refer reprodueixen l’historial;
- validar no canvia corpus, contractes ni gramàtica global;
- warnings i desconeguts són visibles i poden quedar dins el cas;
- tota generalització neix com a candidat i requereix una decisió explícita.

## Paquet portable 0.3

L’exportació conserva cas, text, interpretació, models semàntic i espacial,
estat del resolutor, geometria generada o referència del tècnic, geometria de
treball, gramàtica base, overrides del cas, correccions, explicacions,
observacions, validació, alternatives i biblioteca. Les metadades declaren
sempre `canonical_promotion: false`.

## UVOF015

UVOF015 continua preservant tres zones, sis espais, tres branques i dotze
alternatives. Carregar-lo explícitament activa el provider canònic i el resolver
existent. No compartir-ne l’identificador i el tipus `canonical_specimen` evita
qualsevol activació accidental.
