# Model de correcció

## Esdeveniment

Cada correcció compleix
`schema/traca.correction-event.schema.v0.1.json` i conserva:

```json
{
  "id": "CORR-TR-UVOF-015-0001",
  "timestamp": "2026-08-11T10:00:00.000Z",
  "target": {
    "layer": "geometry",
    "ref": "geometry:entity:A_ESQ",
    "property": "position"
  },
  "operation": "move",
  "before": [4.175, 14.1],
  "after": [3.9, 13.8],
  "author": "coach",
  "scope": "case",
  "status": "draft",
  "reason": "Reposicionament manual a la pista",
  "source_refs": ["exercises/TR-UVOF-015/spatial-relations.json#/nodes/0"]
}
```

## Capes

- `semantic`: corregeix o anota el significat; no muta el corpus a l'MVP;
- `spatial`: corregeix una relació qualitativa; no muta el contracte espacial;
- `geometry`: modifica la versió geomètrica de treball;
- `visual`: modifica la gramàtica visual de treball.

## Abast i estat

L'abast inicial és `case`. `pattern_candidate` i
`general_rule_candidate` només apareixen després d'una promoció explícita.
L'estat passa de `draft` a `validated` quan l'entrenador valida la versió del
cas. Aquest canvi no converteix l'esdeveniment en una regla.

## Reconstrucció

`workingGeometry` es calcula aplicant l'historial ordenat a una còpia de
`generatedGeometry`. Desfer elimina l'últim esdeveniment actiu; refer el torna
a aplicar; reiniciar buida historial i pila de refer. Aquesta estratègia evita
acumulacions opaques i permet verificar qualsevol estat.

Les anotacions semàntiques i espacials queden a l'historial, però el reductor
no les aplica a la geometria. Les correccions visuals s'apliquen a una còpia de
la gramàtica generada.

## Validació i promoció

La validació crea una instantània de la geometria i la gramàtica visuals de
treball. Després hi ha tres accions independents:

1. guardar només el cas validat;
2. crear un candidat de patró reutilitzable;
3. proposar una regla general candidata.

Cap de les tres modifica els JSON canònics del repositori. La incorporació
canònica requerirà un flux de revisió posterior.
