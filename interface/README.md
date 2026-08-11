# Interfície MVP de TRAÇA

Primera vertical executable del flux:

```text
descripció → interpretació provisional → confirmació → geometria → SVG
```

La interfície utilitza `TR-UVOF-015` com a exemple real. El resolutor deriva una
geometria separada del contracte espacial, conserva les dotze alternatives i la
pantalla permet previsualitzar-ne una de manera independent a cada zona.

Per obrir-la localment des de l'arrel del repositori:

```bash
make interface
```

Després cal visitar `http://localhost:8000`. La mateixa pantalla també es pot
obrir directament perquè el paquet geomètric es genera com un recurs derivat de
la interfície.
