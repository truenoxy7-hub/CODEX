# Instruccions per a Codex — Projecte TRAÇA

## Missió

Construeix TRAÇA com un sistema d'enginyeria de coneixement per a exercicis d'handbol. El sistema ha de conservar el significat tàctic, validar-lo i, en una fase posterior, convertir-lo en geometria i SVG deterministes.

La prioritat no és “fer un dibuix plausible”. La prioritat és representar exactament allò que l'entrenador ha validat.

## Autoritat i fonts de veritat

Ordre de prioritat:

1. Correccions i validacions explícites de l'entrenador.
2. JSON semàntic aprovat de cada exercici.
3. Definicions canòniques del vocabulari tàctic.
4. Text i gràfic originals.
5. Inferències del sistema, sempre marcades com a provisionals.

No converteixis una proposta geomètrica o una inferència en coneixement tàctic validat.

## Regles innegociables

- No generis geometria, SVG ni PNG si la tasca no ho demana explícitament.
- No modifiquis la semàntica per fer passar un test.
- No recuperis les coordenades dels prototips v0.x com a font de veritat.
- No tractis el JSON com un SVG indirecte o una llista de punts.
- Separa sempre: semàntica tàctica, relacions espacials, geometria resolta i render.
- El mateix jugador manté una identitat persistent al llarg de les fases.
- Les situacions decisionals descriuen opcions, no una solució gràfica obligatòria.
- Qualsevol dada inferida ha de portar estat `provisional` o equivalent.
- L'entrenador és l'única autoritat que pot aprovar una interpretació tàctica.

## Definició canònica actual: 1x1 / finta

L'ordre funcional és sempre:

1. Rebre en carrera a un interval o espai inicial.
2. Canviar de direcció per atacar l'interval o espai contigu. La forma funcional és una U: amenaça, ruptura direccional i acceleració de sortida.
3. Resoldre la situació que apareix a continuació.

Normalment l'oposició és un defensor real. Pot ser substituït per un banc, un con, un cilindre o un altre objecte. El substitut no canvia el contingut tàctic: només canvia la referència oposicional usada en la tasca.

Una corba suau sense canvi de direcció no és una finta.

## TR-UVOF-001

El primer exercici validat parcialment té dues bandes simètriques i dues subaccions:

- `SA1`: central passa al lateral; lateral rep en carrera a l'exterior de la referència, executa una finta en U cap a l'interval contigu i resol un 2x1 amb pivot.
- `SA2`: el mateix lateral recupera sense pilota per darrere de la referència, rep una passada curta de l'extrem orientat a porteria, ataca l'interval entre defensor exterior i con i resol un 2x1 amb extrem.

El banc representa el defensor directe i s'ubica semànticament entorn de 9 m. Els cons delimiten espais funcionals de finalització, no són decoratius.

## Flux de treball obligatori

Abans de tocar codi:

1. Llegeix `docs/PROJECT_CONTEXT.md`.
2. Llegeix `docs/DOMAIN_MODEL.md`.
3. Llegeix `docs/DECISIONS.md`.
4. Llegeix `docs/CURRENT_STATE.md`.
5. Inspecciona l'exercici i l'esquema afectats.

Durant la implementació:

- Fes canvis petits i justificables.
- Mantén compatibilitat amb l'esquema o incrementa'n la versió.
- Afegeix tests per a cada invariant nou.
- No amaguis amb coordenades un problema semàntic.
- Si una decisió tàctica no està validada, atura't i deixa-la com a pregunta oberta.

Abans d'acabar:

```bash
python scripts/validate_semantic.py
python -m pytest -q
```

Informa de:

- fitxers modificats;
- decisions semàntiques introduïdes;
- inferències provisionals;
- tests executats;
- preguntes que requereixen l'entrenador.

## Estil de codi

- Python 3.11 o superior.
- Tipatge quan aporti claredat.
- Funcions petites i noms explícits.
- JSON UTF-8, indentació de 2 espais i claus estables.
- Errors de validació amb `code`, `path` i `message`.
- No afegeixis dependències pesades sense necessitat.

## Pull requests

El resum del PR ha d'incloure:

1. problema resolt;
2. canvis semàntics;
3. canvis d'esquema;
4. proves;
5. riscos o punts pendents de validació humana.
