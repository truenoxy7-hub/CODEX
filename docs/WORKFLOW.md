# Flux de desenvolupament

## Branques

- `main`: només estat coherent i validat estructuralment.
- `feature/...`: noves capacitats.
- `exercise/...`: ingestió o revisió d'un exercici.
- `schema/...`: evolució del llenguatge.

## Cicle per a un exercici

1. Importar text i gràfic originals.
2. Extreure fets explícits.
3. Crear interpretació semàntica provisional.
4. Registrar dubtes.
5. Obtenir validació de l'entrenador.
6. Actualitzar vocabulari reutilitzable.
7. Validar JSON i invariants.
8. Només llavors preparar geometria.

## Política de versions

- Canvi compatible: increment menor.
- Canvi incompatible d'esquema: nova versió principal.
- El JSON d'un exercici declara la versió de llenguatge que utilitza.

## Definition of Done semàntica

- JSON compleix l'esquema.
- Totes les referències existeixen.
- Seqüències tenen ordre explícit.
- Invariants del contingut es compleixen.
- Inferències estan marcades.
- Preguntes obertes estan registrades.
- Tests passen.
- L'entrenador ha validat el significat.
