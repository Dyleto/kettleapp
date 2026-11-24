# Le banc d'essai

Soixante-huit suites, et toutes ouvrent un navigateur. C'est ce qui le distingue de
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
files, 4 min 12 s ; en attendant des états plutôt que des durées, 2 min 50 s.
Le banc a doublé depuis : soixante-huit suites, 9 min 19 s sur la machine de
la session à la fin de la refonte. Chaque ligne du résultat porte la durée de
sa suite : un banc qui s'allonge dit ainsi où.

```bash
node runner.mjs --all --jobs 1    # la file d'avant, pour lire dans l'ordre
```

Seule, une suite garde le port 3001, celui que le front vise. À plusieurs,
`launch()` détourne vers le port de la suite ce que la page envoie à 3001 ;
depuis Node, c'est `API` (de `common.mjs`) qui donne la bonne adresse. Une
route posée par une suite qui laisse passer une requête le fait par
`route.fallback()`, jamais `route.continue()` : ce dernier l'enverrait au
port 3001 sans passer par le détour.

Deux lanceurs côte à côte — la passe complète des sabotages, répartie sur
plusieurs copies du dépôt — ne doivent partager ni front ni ports.
`KETTLE_BASE` dit où est le front de la copie ; `KETTLE_PORT_BASE`, d'où
partent les ports de ses serveurs d'essai. Le serveur d'essai répond au front
que nomme `KETTLE_BASE` : fixé à 5173, il refusait toute autre origine, et
chaque connexion échouait.

```sh
git worktree add --detach ../copie-1 HEAD
cp -al node_modules ../copie-1/ && cp -al verify/node_modules ../copie-1/verify/
rm -rf ../copie-1/node_modules/.vite   # le cache du front, propre à chaque copie
cp .env ../copie-1/ && (cd ../copie-1 && npx vite --port 5181 &)
cd ../copie-1 && KETTLE_BASE=http://localhost:5181 KETTLE_PORT_BASE=3210 \
  node verify/sabotage/run.mjs home
```

La CI est plus lente que la machine où l'on écrit : 8 min au lieu de 6. Une
lecture faite avant l'état qu'elle vérifie y tombe, et seulement là. Pour la
voir avant de pousser, brider le processeur des pages :

```sh
KETTLE_CPU_THROTTLE=2 node runner.mjs --all   # deux fois plus lent
```

Nommez les suites explicitement, ou passez `--all`. Sans argument, le lanceur
ne lance rien du tout, et le dit plutôt que d'annoncer un vert qui ne couvre
aucune assertion.

## La planche

`board.mjs` n'est pas une suite : il n'affirme rien, il montre. Il mène
l'application dans l'état de chacun des 121 cadres de la maquette
(`docs/maquette.html`) et pose les deux côte à côte dans `board/index.html`,
que git ignore. Huit minutes ; il faut le front, et un port libre pour le
serveur d'essai, qu'il relance neuf à chaque cadre.

```sh
node board.mjs                                  # tout
node board.mjs ../docs/maquette.html board k-   # le coach seulement
node board-page.mjs board                       # la page seule, après une relecture
```

Les écarts relevés vont dans `board/notes.json` — un texte par cadre — et la
page les montre sous chaque cadre. Ce qui reste vrai d'une planche à l'autre
va au plan, § 6.

## Écrire une suite

`common.mjs` porte ce qu'elles refont toutes : se connecter, lancer une séance
guidée, lire l'écran. Quatre pièges méritent d'être connus :

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
- **Attendre un état, pas une durée.** Après un geste ou une navigation,
  `settle(page)` attend que plus aucune requête ne soit en vol, puis que la
  page ne bouge plus — trois tours sans que le DOM change, plafonnés à
  400 ms —, puis que les mouvements de moins d'une seconde — une feuille qui
  monte, une couleur qui glisse — soient finis : c'est ce que la page attend
  elle aussi. Le réseau calme ne suffisait pas : la réponse arrivée, son
  rendu attend encore son tour, et la CI lisait entre les deux. Ce qui ne
  dépend que de l'écran — un focus, une carte, l'ouverture d'une séance — se
  guette en plus par son élément, `waitFor` avec un plafond. Le banc attendait 258 fois une durée fixe,
  choisie un jour où la machine allait vite. Trois choses tardent sans
  requête, et ont leur propre attente : l'enregistrement de l'atelier, 800 ms
  après la dernière frappe (`autosaved`) ; une couche qui glisse hors de
  l'écran (`gone`) ; et le temps lui-même — trois secondes qui ne doivent
  rien coûter, un appui long, une couleur qui glisse — qui s'écrit
  `hold(page, ms, raison)`, la raison en toutes lettres. Remplacer un `hold`
  par `settle` rend l'assertion creuse sans qu'elle tombe : c'est arrivé une
  fois pendant la conversion, sur « trois secondes d'attente ne mordent pas
  sur le tour ».

Quatre autres pièges sont venus avec les derniers écrans :

- **Une animation ne se lit pas à l'écran** : elle a fini avant qu'on la
  regarde. `verify_motion` pose dans la page un enregistreur des
  `animationstart`, avec l'endroit où chacune a lieu, et vérifie que ses
  images ne sont pas toutes pareilles — un nom qui démarre ne dit pas que
  quelque chose bouge.
- **Un doigt est un vrai doigt.** Un geste tactile — un appui long qui
  soulève une carte, tirer pour recharger — s'envoie au navigateur par
  `Input.dispatchTouchEvent` (`verify_band`, `verify_pull`) : la souris ne
  produit pas les mêmes événements.
- **Figer l'horloge, et la mener.** `pauseAt` refuse de revenir en arrière :
  sous la charge, l'heure lue est déjà passée quand la pause arrive ; on
  vise cinquante millisecondes plus loin et on recommence si besoin
  (`freeze`). Une page figée ne rend plus ce que la bibliothèque des
  requêtes lui annonce : ses notifications passent par un minuteur, qu'il
  faut avancer à la main.
- **Ce qu'entend un lecteur d'écran se lit aussi.** La consigne d'un
  élément est le texte que désigne `aria-describedby` ; ce que dit un
  glisser, celui de la région vivante que la bibliothèque pose dans le
  document (`verify_moves`).

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
se rejoue pas à chaque changement : les 868 demanderaient douze heures l'un
après l'autre, trois sur quatre copies du dépôt (voir plus haut). Ils se
rejouent tous en une passe, avant une fusion sur `main`.
`sabotage:check`, lui, ne coûte qu'une seconde et se lance avant chaque
commit : un motif qui ne correspond plus se répare tout de suite, tant
qu'on sait encore ce qu'il visait — ou se marque `stale`, avec sa raison,
quand le code a été réécrit et que la réparation demande de repenser le
cas. La passe complète le reprendra.

Un cas marqué `stale` est une dette connue : son motif ne correspond plus,
et on le sait. Les 23 marqués à l'entrée des cas dans le dépôt ont été
réparés lors de la première passe complète (B12) ; il n'en reste aucun.

Cette passe a dit ce qu'une passe dit : sur 245 cas, 231 tombaient comme
prévu. Neuf listes attendues étaient incomplètes — un sabotage cassait
aussi une autre assertion qui lit le même texte, à raison. Trois
assertions étaient creuses : l'une cherchait « Aucun client » quand la
liste vide dit « Invite ton premier client », l'autre lisait un repos
avant que son horloge ait relu l'heure, et aucune ne couvrait la pause
d'un repos. Un cas s'écrivait avec une variable disparue, un autre
importait le son de son ancienne adresse ; un dernier visait un état
que Chromium ne produit pas, et s'éprouve sous Vitest.

La deuxième passe (H1), à la fin de la refonte, a rejoué 868 cas : 856
sont tombés comme prévu. Huit listes attendues étaient incomplètes, pour la
même raison que la première fois — une section venue après le cas lisait le
même texte. Un cas injectait un toast dans un écran qui n'importait plus le
toaster : il cassait la page au lieu de la saboter. Et deux assertions
étaient creuses : l'une lisait le personnage n'importe où dans la page, et la
connexion en a un ; l'autre croyait l'horloge figée par `clock.install()`,
qui la laisse tourner — la frappe qu'elle disait en attente était déjà
partie. Une horloge se fige par `pauseAt`, jamais par la seule installation.
