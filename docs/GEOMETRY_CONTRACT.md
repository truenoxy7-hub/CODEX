# Contracte de geometria derivada v0.2

## Propòsit

Aquesta capa converteix un contracte espacial `ready` en metres de pista sense
modificar la semàntica ni les relacions d'origen. La primera plantilla
suportada és `TR-UVOF-015`.

```text
semàntica validada
  → relacions espacials v0.3
  → preflight ready
  → geometria derivada v0.2
  → renderer SVG literal
```

## Perfil de pista

`config/handball-court.ihf-2025.json` conserva les mesures de les Rules of the
Game for Indoor Handball vigents des de l'1 de juliol de 2025: pista de 40 ×
20 m, porteria de 3 × 2 m, àrea de 6 m, línia discontínua de 9 m i línies de 7
i 4 m.

## Garanties

- l'entrada ha de superar el preflight amb estat `ready`;
- els fingerprints de la pista i del contracte espacial queden registrats;
- cap alternativa decisional queda seleccionada a `geometry.json`;
- les dotze alternatives d'UVOF015 es resolen separadament;
- cada entitat, estat i trajectòria apunta a la font que la justifica;
- la política visual provisional es declara explícitament.

## Espais relacionals i límits físics

Un espai tàctic no és una primitiva gràfica. `spaces` conserva la relació
`between`, els delimitadors, un `anchor` d'inspecció i una
`calculation_region` interna, sempre amb `render_policy: hidden`. La vista neta
no dibuixa cap d'aquests camps. La vista de control només pot mostrar una
àncora i una etiqueta petites.

Les zones d'UVOF015 representen límits físics de la tasca materialitzats pels
cons. Poden tenir polígon intern i contorn discret a Control, sense farciment;
desapareixen a la vista neta.

## Estats persistents i dependències

Cada posició temporal d'un participant és un `participant_state` amb identitat
estable, fase, posició i estat `current`, `future` o `past`. Les entitats
visibles apunten al seu estat actual. Una trajectòria de moviment declara
`actor_ref`, `from_state_ref` i `to_state_ref`; una passada declara també
pilota, emissor i receptor. Una posició futura es mostra sempre que sigui
l’origen o el destí d’una trajectòria visible; reutilitza el mateix símbol del
participant amb el farciment translúcid. Només és editable a Control.

En una recepció en carrera, la cursa sense pilota, la passada que retorna la
pilota i l'acció posterior comparteixen un únic `participant_state`: el
moviment i la passada hi acaben, i la resolució hi comença. No es poden crear
posicions futures diferents per representar aquests tres moments del mateix
punt de recepció.

`dependencies` declara quins símbols, moviments i passades depenen de cada
estat. Moure un estat és una única correcció principal: el workspace recalcula
els efectes derivats, els enumera a l'historial i no crea correccions noves.

## Segments funcionals

Les trajectòries canòniques utilitzen segments `line` i `cubic`, amb inici,
final i controls explícits. El resolver —no el renderer— determina la corba.
La finta d'UVOF015 combina `cubic → line → cubic` i conserva un punt funcional
`direction_break`; no es pot substituir per un suavitzat genèric.

Les passades s'enllacen als estats dels participants. El renderer en retalla
només la presentació al perímetre dels símbols (`symbol_perimeter`), sense
alterar la geometria tàctica ni guardar extrems flotants.

## Límits

Les coordenades de cons, participants i amplades de zona són una política de
lectura simètrica per a l'MVP. No són coneixement tàctic validat. El resolver
pot revisar-les sempre que preservi relacions, límits físics, contigüitats,
línies defensives i alternatives. El renderer no pot inventar geometria.

## Còpia de treball editable

La interfície carrega la geometria canònica d'UVOF015 com a
`generatedGeometry` immutable i en crea una còpia `workingGeometry`. Les
correccions actuen sobre estats, segments o convencions visuals de la còpia.
Desfer, refer i reiniciar reconstrueixen el resultat des de l'original i tornen
a executar les dependències.

La validació pot congelar `validatedGeometry` com a versió del cas. No modifica
`geometry.json`, no retorna coordenades a la capa espacial i no promociona cap
correcció a regla general.
