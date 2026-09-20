# Le banc d'essai

Il mène l'application dans un vrai navigateur — cliquer, saisir, terminer une
séance — et lit ce qu'elle affiche. Aucune base de données : `mock-server.mjs`
sert une API Kettle en mémoire, avec un jeu d'essai qui couvre les formats qui
cassent (EMOM, Tabata, AMRAP, chipper, pyramide, bloc « Every » d'avant la
fusion) et un historique qui donne de quoi comparer.

## Lancer

```sh
npm install                       # dans verif/
cd .. && npm install && npx vite  # le front, sur le port 5173
```

Le front doit trouver l'API d'essai : `VITE_API_URL=http://localhost:3001`
dans un `.env` à la racine.

```sh
node runner.mjs verify_recap.mjs verify_paysage.mjs
```

Le lanceur redémarre un serveur neuf avant chaque suite : une suite qui
tournerait sur l'état laissé par la précédente ne prouverait rien.

## Écrire une suite

`commun.mjs` porte ce que toutes refont : se connecter, démarrer une séance
guidée, lire l'écran. Deux pièges méritent d'être connus :

- **Ne jamais naviguer au texte de l'écran.** Le dernier tour d'un bloc
  annonce déjà le bloc suivant — « dernier tour — ensuite : AMRAP » — et une
  expression sur « AMRAP » s'arrête une étape trop tôt. `ou(page)` lit
  `aria-valuetext` sur la barre d'avancement : c'est le seul repère fiable.
- **Normaliser les espaces.** L'interface écrit « Tour 1 / 10 » avec des
  espaces insécables ; `net()` les ramène à des espaces ordinaires.

## La discipline

Un vert ne vaut que si on l'a cassé. Pour chaque mécanisme vérifié, on le
sabote dans le code et on s'assure que l'assertion qui le couvre tombe — et
elle seule. Une assertion qui reste verte quand le mécanisme est cassé ne
vérifie pas ce qu'elle prétend ; c'est arrivé, et ça ne se voit pas
autrement.
