# KnowledgeResolver

## Objectiu

`interface/js/knowledge-resolver.js` reuneix coneixement de fonts diferents sense confondre coincidència amb autoritat. Retorna conceptes, buits, suggeriments, regles visuals actives i un resum d'autoritat.

## Ordre d'autoritat

1. confirmació de l'entrenador (`coach_validated`);
2. llegenda gràfica rebuda i validada;
3. cas canònic validat;
4. coneixement semàntic validat;
5. relació espacial validada;
6. observació repetida;
7. candidat;
8. inferència o coincidència provisional.

Un cas canònic només s'activa si coincideixen l'identificador i `case_type: canonical_specimen`. Una regla visual només és activa si té estat `validated`, autoritat suficient i totes les seves `evidence_refs` existeixen.

## Coneixement local reutilitzable

`coach_validated_local_knowledge` conté criteris que un entrenador ha declarat reutilitzables després de validar el cas font. Cada registre inclou:

- `id`, `label`, `definition` i `aliases`;
- `category` i `semantic_ref` opcional;
- `authority: coach_validated` i `status: validated`;
- `source_case_uid` i correccions font;
- una o més `evidence_refs` resolubles.

En un cas posterior, una coincidència explícita pot produir un concepte validat amb `source: coach_validated_local_knowledge`. Una observació `case_only` no entra mai en aquesta col·lecció.

## Candidats

Les col·leccions acabades en `_candidates` s'avaluen per mostrar suggeriments. El resolver no les fusiona amb els conceptes aplicats. Per tant:

```text
candidate match → suggestions[]
candidate match ↛ concepts[]
```

## Límit

El matcher és lèxic i local. No resol coreferència general, temporalitat complexa ni intenció tàctica implícita. El compositor o l'entrenador han de demanar/completar identitats i relacions que el text no fixa.
