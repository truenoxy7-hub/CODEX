# Estat actual

## IMPLEMENTAT

### Coneixement i geometria canònics

- Corpus semàntic `TR-UVOF-001`–`TR-UVOF-015` i contracte
  `spatial-relations` v0.3.
- Preflight qualitatiu pur amb estats `ready`, `partial` o `blocked`.
- Perfil IHF, contracte geomètric general v0.4 i adaptador compatible amb la
  geometria canònica v0.2 d’UVOF015.
- UVOF015 conserva tres zones, sis espais, setze entitats, tres branques i
  dotze alternatives.
- Els sis espais són relacions ocultes; només els límits físics de les tres
  zones poden aparèixer discretament a Control.
- Participants amb estats persistents, trajectòries segmentades i passades
  enllaçades a emissor/receptor; la finta conserva compromís, trencament,
  separació de l'oponent i sortida funcional.
- Les posicions futures connectades a l’acció visible reutilitzen el símbol del
  participant sense farciment i amb contorn discontinu; passades i moviments queden ancorats al
  perímetre dels símbols d’origen i destí.
- Cada recepció en carrera és un únic estat compartit: la cursa i la passada hi
  acaben, i la trajectòria posterior comença exactament des del mateix punt.
- Resolver relacional A1–A3 sense coordenades manuals per a passada, recepció,
  finta amb canvi de direcció mesurable i 2x1 obert, inclosa la variant de
  costat i invariant davant reordenacions o canvis d'identificador.
- Mòdul únic de geometria de pista per a línies, arcs, distàncies i validació:
  les trajectòries a terra no poden envair l'àrea de porteria ni travessar el
  marge reservat als símbols.
- La pilota inicial es representa una sola vegada i conserva la mateixa
  identitat durant la passada; els delimitadors defensius estructurals són
  referències contextuals, no participants actius.
- `renderability`, `geometry_validation` i `tactical_validation` són garanties
  separades. A1–A3 són renderitzables i geomètricament vàlids; la lectura
  tàctica continua pendent de validació de l'entrenador.
- Obligacions exhaustives per primitiva i relació, diagnòstics accionables i
  conflicte explícit quan una àncora manual contradiu el graf.
- Tres exemples reproduïbles amb TacticalIR, geometria v0.4, SVG i comparació
  visual amb v0.3 a `examples/general-geometry/`.

### MVP funcional v0.5

- La pantalla inicial és un cas en blanc amb el flux `ESCRIURE → GENERAR → CORREGIR → GUARDAR`.
- Cada cas té `case_uid` durable i un codi curt; esborranys i casos validats viuen en col·leccions diferents.
- L’origen es registra com a entrada de l’entrenador i les etiquetes es deriven
  automàticament dels conceptes explícits reconeguts; no són camps obligatoris.
- `KnowledgeResolver` ordena les fonts per autoritat. El coneixement local que
  l'entrenador valida explícitament en un cas validat pot ajudar casos futurs;
  candidats i inferències només suggereixen.
- La pantalla normal mostra «He entès» i «Em falta»; els quatre estats interns
  continuen disponibles al mode avançat.
- Constructor assistit de participants, materials, espais, accions, decisions
  i fases.
- Casos sense resolver poden continuar, guardar-se i tenir una
  `coach_reference_geometry` explícitament no generada.
- Correccions amb canvi principal, efectes derivats, diff, explicació
  automàtica i motiu de l’entrenador.
- Pipeline general `TacticalIR → CompositionGraph → operator registry →
  CompositionPlan → constraints → preflight → geometry`.
- Operadors de moviment, bot, passada, recepció, llançament, finta/1x1,
  bloqueig, relació numèrica, permuta, encreuament i lliscament de pivot.
- Estat de recepció compartit, màquina d’estats de pilota, preguntes de slots,
  cobertura per acció i traçabilitat fins a la font.
- `composition_status` separat de `geometry_status`; el compositor pot quedar
  complet encara que la geometria necessiti dades.
- Els intervals canònics creen referències defensives estructurals estables
  per als delimitadors implícits. Aquestes identitats només delimiten l'espai,
  no actuen com a oponents, i una menció explícita posterior reutilitza la
  mateixa identitat.
- El preflight no bloqueja una composició per un delimitador derivable d'una
  relació validada, però continua bloquejant referències desconegudes. La
  composició pot quedar `ready` mentre la geometria resta `needs_input`.
- Vistes neta, d'edició, comparada i original.
- Preflight amb errors bloquejants, warnings i informació accionable.
- El diagnòstic avançat combina `TacticalIR` i `CompositionPlan` per mostrar
  l'espai funcional de cada acció i explica en llenguatge humà els bloquejos o
  les dades espacials que encara falten.
- Les clarificacions són progressives: la pantalla normal mostra una única
  pregunta activa, mentre el diagnòstic conserva totes les pendents, respostes,
  opcions i derivacions. Els catàlegs canònics ofereixen referències sense
  convertir-les en fets; una selecció materialitza la identitat estable.
- La finta pot derivar l'interval de sortida només quan oponent, espai inicial i
  contigüitat deixen una única opció validada. Aquesta derivació no determina
  el defensor d'una relació numèrica posterior.
- L’encreuament distingeix el primer jugador del jugador que encreua. Pot
  recuperar l’atac espacial previ del jugador referenciat, amb traçabilitat per
  slot i sense confondre’l amb l’últim atac global; context invalidat o
  contradictori queda pendent o bloquejat. El diagnòstic avançat mostra els
  dos rols, l’atac inicial i l’espai objectiu.
- Promotion Builder per tipus, abast i subconjunt seleccionat de correccions.
- Biblioteca inspectable i resum «Què ha après TRAÇA?».
- Diccionari visual-funcional amb les 103 evidències de l’inventari i 13
  evidències normatives de la llegenda, projectat a la gramàtica del renderer.
- Referència visual v0.2 de 14 símbols, política d'estil central v0.1, mode
  monocrom, metadades SVG i exportació SVG/PNG des del workspace.
- Galeria reproduïble amb símbols, A1–A3 abans/després i diagnòstic dels 15
  casos interns, sense presentar geometria absent com a resolta.
- Adaptador selectiu per a una base gràfica externa: només registres activats
  explícitament i confirmats poden entrar al runtime; candidats, ambigus i
  superats són rebutjats com a autoritat operativa.
- Adaptador de model configurable amb sortida estructurada i evidències. La
  seva sortida continua sent una proposta provisional que requereix validació.
- Persistència local i paquet portable `0.5.0`, compatible amb importacions
  `0.2.0`, `0.3.0` i `0.4.0`.
- Fingerprint del text i estat `stale`: cap geometria anterior es pot guardar després de canviar la font.
- `validation` i `completeness` són independents: el snapshot pot estar validat i conservar semàntica o espai parcials.

### Matriu reproduïble del preflight espacial

| Estat | Exercicis |
|---|---|
| `ready` | 001, 002, 003, 004, 006, 008, 009, 010, 011, 012, 013, 015 |
| `partial` | 005, 007, 014 |

El preflight del workspace és un gate posterior i diferent: comprova el cas de
treball, la seva geometria disponible, identitats, fonts i correccions pendents.

## PARTIAL

- L'adaptador d'UVOF015 conserva les tres branques i dotze alternatives, però
  el validador físic v0.4 detecta trajectòries històriques dins l'àrea de 6 m.
  El cas queda explícitament `blocked` fins que se'n regeneri la geometria; no
  hi ha excepcions per identificador d'exercici.
- La cobertura estructural del corpus és 164/203 unitats (80,79%); el detall
  per exercici és a [`COMPOSER_COVERAGE.md`](COMPOSER_COVERAGE.md).
- Bloqueig, permuta i lliscament poden obtenir geometria quan les posicions
  necessàries són explícites. No tenen encara resolució universal.
- L’encreuament es compon a nivell funcional però deixa la geometria sense
  resoldre.
- L’intèrpret local produeix TacticalIR per formulacions explícites comunes;
  no és un intèrpret lingüístic general.

## UNRESOLVED

- Tipar `resolucio` del corpus com a passada, llançament o moviment abans de
  compondre-la.
- Traduir la resta de relacions qualitatives v0.3 a posicions sense defaults.
- Resoldre geometria general d’encreuament i coexistència de trajectòries en
  lliscaments de pivot.
- Decidir a la interpretació els actors/espais que falten en diversos casos;
  el compositor pregunta i s’atura.
- Incorporar i executar els catàlegs `VAL-ENT-001–005`, `D01–D10`,
  `R01–R20` i `T01–T20`: els fitxers
  `TRACA_Base_coneixement_grafics_v0_1.json`, l'HTML associat i el manifest no
  són presents al projecte ni als adjunts disponibles.

## FUTURE

- connexió de credencials i servei real al provider de model configurable;
- resolutor lingüístic general per a text nou;
- ampliar la geometria genèrica a més relacions validades;
- backend, base de dades remota, comptes o col·laboració;
- promoció canònica i modificació del corpus des del navegador;
- regeneració geomètrica del corpus quan les fonts disposin de coordenades o
  relacions qualitatives suficients.

## Invariants de risc

```text
coincidència lèxica ≠ coneixement validat
referència del tècnic ≠ geometria generada
correcció de cas ≠ criteri reutilitzable
candidat ≠ coneixement canònic
override visual del cas ≠ regla visual global
```

## Pròxima fita

Validar amb l'entrenador la política visual provisional, la làmina de 14
símbols i els casos A1–A3, i
regenerar la geometria històrica d'UVOF015 fora de l'àrea de 6 m. Les
correccions aprovades es registraran com a coneixement local, no com a regla
tàctica automàtica. Després, provar permuta i encreuament sense geometria i
prioritzar els buits de `COMPOSER_COVERAGE.md` sense hardcodejar exercicis.
