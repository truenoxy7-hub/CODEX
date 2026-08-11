# Contracte de geometria derivada v0.1

## Propòsit

Aquesta capa converteix un contracte espacial `ready` en metres de pista sense
modificar la semàntica ni les relacions d'origen. La primera plantilla suportada
és `TR-UVOF-015`.

```text
semàntica validada
  → relacions espacials v0.3
  → preflight ready
  → geometria derivada v0.1
  → renderer SVG
```

## Perfil de pista

`config/handball-court.ihf-2025.json` conserva les mesures de les [Rules of the
Game for Indoor Handball, 1 July 2025](https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf):

- pista de 40 × 20 m i mitja pista de 20 × 20 m;
- porteria de 3 × 2 m;
- àrea definida per un tram recte de 3 m i dos quarts de cercle de radi 6 m;
- línia discontínua de 9 m amb segments i buits de 15 cm;
- línia de 7 m d'1 m i línia de porter de 4 m de 15 cm;
- línies ordinàries de 5 cm i línia de gol de 8 cm.

## Garanties

- l'entrada ha de superar el preflight amb estat `ready`;
- els fingerprints de la pista i del contracte espacial queden registrats;
- cap alternativa decisional queda seleccionada a `geometry.json`;
- les dotze alternatives d'UVOF015 es resolen separadament;
- cada entitat i trajectòria apunta a la relació espacial que la justifica;
- la política visual provisional es declara explícitament.

## Límits

Les coordenades de cons, participants i amplades de zona són una política de
lectura simètrica per a l'MVP. No són coneixement tàctic validat. El renderer
pot canviar-les sense alterar el corpus, sempre que preservi zones, espais,
contigüitats, línies defensives i alternatives.

## Còpia de treball editable

La interfície carrega la geometria canònica d'UVOF015 com a
`generatedGeometry` immutable i en crea una còpia `workingGeometry`. Els
moviments i ajustos de trajectòria només afecten la còpia i generen
esdeveniments de correcció. Desfer, refer i reiniciar reprodueixen l'historial
des de l'original.

La validació de pantalla pot congelar `validatedGeometry` com a versió del cas.
No modifica `geometry.json`, no torna coordenades a la capa espacial i no
promou una correcció a regla. El motor de text arbitrari encara no forma part
d'aquest contracte executable.
