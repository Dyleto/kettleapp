# Le banc d'essai

Il mène l'application dans un vrai navigateur — cliquer, taper, terminer une
séance — et lit ce qu'elle affiche. Aucune base de données : `mock-server.mjs`
sert une API Kettle en mémoire, avec un jeu de données qui couvre les formats
qui cassent (EMOM, Tabata, AMRAP, chipper, pyramide, un bloc « Every »
d'avant la fusion) et un historique qui donne de quoi comparer.

## Le lancer

```sh
npm install                       # depuis verif/
cd .. && npm install && npx vite  # le front, sur le port 5173
```

Le front doit trouver l'API d'essai : `VITE_API_URL=http://localhost:3001`
dans un `.env` à la racine.

```sh
node runner.mjs verify_recap.mjs verify_paysage.mjs
node runner.mjs --all             # ce que lance `npm run verify`
```

Le lanceur redémarre un serveur neuf avant chaque suite : une suite qui
tournerait sur l'état laissé par la précédente ne prouverait rien.

Nommez les suites explicitement, ou passez `--all`. Sans argument, le lanceur
ne lance rien du tout, et le dit plutôt que d'annoncer un vert qui ne couvre
aucune assertion.

## Écrire une suite

`common.mjs` porte ce qu'elles refont toutes : se connecter, lancer une séance
guidée, lire l'écran. Deux pièges méritent d'être connus :

- **Ne jamais naviguer au texte de l'écran.** Le dernier tour d'un bloc
  annonce déjà le bloc suivant — « dernier tour — ensuite : AMRAP » — et un
  motif sur « AMRAP » s'arrête une étape trop tôt. `where(page)` lit
  `aria-valuetext` sur la barre de progression : c'est le seul repère fiable.
- **Normaliser les espaces.** L'interface écrit « Tour 1 / 10 » avec des
  espaces insécables ; `clean()` les ramène à des espaces ordinaires.

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
