# Le banc d'essai

Trente suites, et toutes ouvrent un navigateur. C'est ce qui le distingue de
`npm test` à la racine, qui éprouve la logique pure en quelques secondes :
une suite qui n'a pas besoin d'un navigateur n'a rien à faire ici. Il y en
avait une — `verify_format.mjs`, qui empaquetait un module avec esbuild faute
de lanceur de tests — et elle est partie dans `src/features/client/
performedFormat.test.ts`.

Il mène l'application dans un vrai navigateur — cliquer, taper, terminer une
séance — et lit ce qu'elle affiche. Aucune base de données : `mock-server.mjs`
sert une API Kettle en mémoire, avec un jeu de données qui couvre les formats
qui cassent (EMOM, Tabata, AMRAP, chipper, échelle, un bloc « Every »
d'avant la fusion) et un historique qui donne de quoi comparer.

## Le lancer

```sh
npm install                       # depuis verify/
cd .. && npm install && npx vite  # le front, sur le port 5173
```

Le front doit trouver l'API d'essai : `VITE_API_URL=http://localhost:3001`
dans un `.env` à la racine.

```sh
node runner.mjs verify_recap.mjs verify_landscape.mjs
node runner.mjs --all             # ce que lance `npm run verify`
```

Le lanceur redémarre un serveur neuf avant chaque suite : une suite qui
tournerait sur l'état laissé par la précédente ne prouverait rien.

Il en fait tourner plusieurs à la fois — autant que la machine a de cœurs,
quatre au plus —, chacune contre son propre serveur d'essai sur son propre
port. Trente suites l'une après l'autre prenaient 14 min 23 s ; sur quatre
files, 4 min 12 s. Chaque ligne du résultat porte la durée de sa suite : un
banc qui s'allonge dit ainsi où.

```bash
node runner.mjs --all --jobs 1    # la file d'avant, pour lire dans l'ordre
```

Seule, une suite garde le port 3001, celui que le front vise. À plusieurs,
`launch()` détourne vers le port de la suite ce que la page envoie à 3001 ;
depuis Node, c'est `API` (de `common.mjs`) qui donne la bonne adresse. Une
route posée par une suite qui laisse passer une requête le fait par
`route.fallback()`, jamais `route.continue()` : ce dernier l'enverrait au
port 3001 sans passer par le détour.

Nommez les suites explicitement, ou passez `--all`. Sans argument, le lanceur
ne lance rien du tout, et le dit plutôt que d'annoncer un vert qui ne couvre
aucune assertion.

## Écrire une suite

`common.mjs` porte ce qu'elles refont toutes : se connecter, lancer une séance
guidée, lire l'écran. Trois pièges méritent d'être connus :

- **Ne jamais naviguer au texte de l'écran.** Chaque tour d'un EMOM
  annonce déjà le bloc suivant — « Ensuite · AMRAP 12 · 12 min » — et un
  motif sur « AMRAP » s'arrête un bloc trop tôt. `where(page)` lit
  `aria-valuetext` sur la barre de progression : c'est le seul repère fiable.
- **Normaliser les espaces.** L'interface écrit « 42 secondes » avec des
  espaces insécables ; `clean()` les ramène à des espaces ordinaires.
- **Un bloc chronométré n'a pas de bouton « Suivant ».** Ses tours passent à
  l'horloge. Pour traverser une séance sans savoir ce qu'on franchit,
  `advance(page)` ; pour sauter un bloc, `passBlock(page)` ; pour lancer
  l'horloge, `launchClock(page)`. Le temps se mène avec `page.clock` :
  `runFor` laisse battre la page, `fastForward` saute d'un coup, comme un
  téléphone verrouillé.

La règle de langue est celle du projet : tout ce qui est technique en anglais
— identifiants, noms de fichiers, marqueurs `OK` et `FAIL` que le lanceur lit
—, et tout le reste en français : commentaires, libellés d'assertion, titres
de section, messages du lanceur. Les sélecteurs et les noms de rôle sont en
français parce qu'ils correspondent à l'interface, qui s'adresse à des
francophones.

## La discipline

Un vert ne vaut que si on l'a cassé. Pour chaque mécanisme vérifié, on le
sabote dans le code et on s'assure que l'assertion qui le couvre tombe — et
elle seule. Une assertion qui reste verte quand le mécanisme est cassé ne
vérifie pas ce qu'elle prétend ; c'est arrivé, et il n'y a pas d'autre moyen
de le voir.

Un script de sabotage doit vérifier qu'il a bien saboté quelque chose. Un
motif qui ne correspond plus — parce que le formateur est passé, par exemple —
laisse croire que l'assertion est creuse alors que rien n'a été cassé.

Les sabotages vivent dans `sabotage/`, un fichier de cas par suite. Chaque
cas nomme ce qu'il casse, le remplacement à faire dans le code, et les
assertions qui doivent tomber — celles-là, et aucune autre.

```bash
npm run sabotage -- home          # rejoue les cas de verify_home.mjs
npm run sabotage -- home 3 7      # seulement les cas 3 et 7
npm run sabotage:check            # sans navigateur : chaque motif désigne-t-il
                                  # encore un endroit du code, et un seul ?
```

Un cas s'écrit avec le mécanisme qu'il couvre, dans le même commit. Il ne
se rejoue pas à chaque changement : les 229 demandent plusieurs heures. Ils
se rejouent tous en une passe, avant une fusion sur `main`.
`sabotage:check`, lui, ne coûte qu'une seconde et se lance avant chaque
commit : un motif qui ne correspond plus se répare tout de suite, tant
qu'on sait encore ce qu'il visait — ou se marque `stale`, avec sa raison,
quand le code a été réécrit et que la réparation demande de repenser le
cas. La passe complète le reprendra.

Un cas marqué `stale` est une dette connue : son motif ne correspondait
déjà plus quand les cas sont entrés dans le dépôt — ils vivaient dans un
dossier temporaire, où personne ne les relisait. Il y en a 23. On retire la
marque en réparant le cas.
