# Contracte d’InterpretationProvider

## Propòsit

La interpretació és substituïble i inspectable. Un provider retorna coneixement
amb estat i font; no retorna una falsa certesa ni geometria.

## Providers locals de l’MVP

- `canonical_case_provider`: recupera coneixement validat només quan coincideix
  l’identificador i el cas està marcat explícitament `canonical_specimen`;
- `local_rule_provider`: detecta termes literals del vocabulari local i els
  marca `provisional_match` / `provisional`;
- `manual_builder_provider`: representa les aportacions i confirmacions
  explícites de l’entrenador.

El resultat separa `concepts`, `unknown_concepts`, `unresolved`, `notes` i la
llista de providers. Cada coincidència local conserva evidència, font,
referència canònica i motiu. Una frase com «passada i va» es preserva com a
concepte desconegut fins que l’entrenador la defineixi.

## Garanties

- text arbitrari no activa el provider canònic;
- una coincidència lèxica no és una interpretació tàctica validada;
- un desconegut no desapareix i no es converteix silenciosament en un terme
  proper;
- no hi ha crides LLM, embeddings ni simulació de comprensió general;
- afegir un provider futur no canvia el contracte d’autoritat.

La implementació local viu a `interface/js/interpretation-provider.js` i el
vocabulari mínim a `interface/data/handball-knowledge.js`.
