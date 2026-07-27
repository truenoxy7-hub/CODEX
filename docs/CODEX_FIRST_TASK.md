# Primera tasca recomanada per a Codex

## Objectiu

Implementar un validador semàntic executable per a `TR-UVOF-001` sense generar geometria ni gràfics.

## Abast

1. Llegir `exercises/TR-UVOF-001/semantic.json`.
2. Validar primer contra `schema/traca.semantic.schema.v1.0.json`.
3. Implementar comprovacions amb codis estables per als invariants:
   - SA1 comença amb recepció en carrera a INT_1.
   - La finta va d'INT_1 a INT_2.
   - INT_2 és contigu a INT_1.
   - La forma funcional és U.
   - SA1 acaba amb resolució posterior.
   - El banc equival semànticament a defensor directe.
   - La recuperació de SA2 és sense pilota.
   - La passada de l'extrem és curta i sense bot.
   - INT_4 queda entre D_Z2 i C3.
4. Afegir proves positives i negatives.
5. Generar un informe JSON amb `valid`, `errors`, `warnings` i `summary`.

## Fora d'abast

- coordenades;
- geometria;
- SVG;
- imatges;
- reinterpretació tàctica.

## Criteri d'acceptació

```bash
python scripts/validate_semantic.py
python -m pytest -q
```

Tots dos han d'acabar amb codi 0 per al document actual i els tests negatius han de demostrar que cada invariant es detecta.
