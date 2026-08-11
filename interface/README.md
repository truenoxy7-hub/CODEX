# Interfície MVP de TRAÇA

Primera vertical executable del flux de text lliure:

```text
descripció → interpretació provisional → confirmació → geometria → SVG
```

La interfície ja no tracta el corpus com un catàleg tancat. El primer intèrpret
accepta descripcions noves dins d'un abast controlat —una única situació 1x1—,
n'extreu rols, pilota inicial, suport, bot i llibertat de decisió, i marca les
dades que el text no especifica. Una descripció fora d'aquest abast no genera
geometria.

El botó «Carregar exemple 1x1» només omple el camp de text. L'exemple es pot
editar completament i no té cap identificador UVOF. El corpus continua servint
com a coneixement validat i com a conjunt de proves per ampliar l'intèrpret.

Per obrir-la localment des de l'arrel del repositori:

```bash
make interface
```

Després cal visitar `http://localhost:8000`. La mateixa pantalla també es pot
obrir directament: l'intèrpret 1x1 i el perfil de pista IHF estan empaquetats al
navegador.
