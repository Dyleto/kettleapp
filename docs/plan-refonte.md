# Refonte Kettle — où on en est, et ce qu'il reste

Relevé du 15 novembre 2026, sur `develop` (front `6cb04f8`, API `cfee928`),
confronté à la maquette « Nouveau design Kettle » écran par écran.

Ce fichier est la liste de travail : **une ligne cochée = un commit poussé**,
banc complet vert. La ligne se coche dans le commit qui la réalise.

Les sabotages s'écrivent avec chaque mécanisme, dans le même commit, mais ne
se rejouent plus à chaque ligne : ils se rejouent tous en une passe, après
le rangement (B12) et avant `main` (H1).

## 1. En bref

| Chapitre de la maquette   | Écrans | Fait | Partiel | À faire |
| ------------------------- | ------ | ---- | ------- | ------- |
| Fondations                | 5      | 3    | 2       | 0       |
| Séance guidée             | 5      | 3    | 2       | 0       |
| Client (hors séance)      | 6      | 4    | 2       | 0       |
| Coach                     | 7      | 5    | 1       | 1       |
| Commun                    | 3      | 0    | 2       | 1       |
| Ce que ça demande à l'API | 6      | 6    | 0       | 0       |

- **Le cœur est là** : la séance guidée (ouverture, décompte, séries, repos,
  EMOM, Tabata, AMRAP, échelle, pause), toute la fin de séance (fête, charges,
  ressenti, semaine) et l'accueil du client suivent la maquette.
- **Le coach n'a pas bougé** depuis le lot 0 : il a la police, la voix et les
  écrans de panne, mais aucun de ses sept écrans n'est celui de la maquette.
  « À lire » et la réponse du coach n'existent pas, ni dans le front ni dans
  l'API.
- **Le code a pris de la dette en route** : un composant de 1 510 lignes, des
  pièces du kit recopiées dans trois dossiers, et les sabotages qui prouvent
  le banc vivent hors du dépôt. C'est le moment de ranger, avant d'attaquer le
  coach qui doublerait la mise.

Mesures au 23 novembre : 938 tests unitaires, 59 suites de banc et 1 045
assertions, 7 min 20 s pour le banc complet sur une machine plus lente
que les mesures précédentes (14 min 23 s avant qu'il
tourne sur quatre files, 4 min 23 s avant qu'il attende des états).

## 2. Le relevé, écran par écran

### Fondations

| Écran                         | État     | Ce qui manque                                                                                                                                                                                                                                                     |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Les quatre règles             | **fait** | Appliquées ; elles se revérifient écran par écran (§4).                                                                                                                                                                                                           |
| Couleurs, typographie, formes | **fait** | —                                                                                                                                                                                                                                                                 |
| Composants                    | partiel  | Les pièces existent mais sont dispersées : trois `Chip` différents, la bulle du coach écrite cinq fois, `HomeCard` et `Eyebrow` rangés dans l'accueil, l'ancien `Card` encore lu par quatre écrans. Pas de menu ni de bannière « Annuler » au kit.                |
| Mouvement, son, vibration     | partiel  | Son : fait. Mouvement : l'appui, la feuille, les dernières secondes, les confettis et les chiffres de fin sont là ; manquent le saut d'une valeur qui change, l'entrée d'une scène, la coche qui se dessine. Vibration : quatre motifs nommés et un réglage (B8). |
| Navigation, largeurs, voix    | **fait** | Quatre onglets pour le coach, « À lire » d'abord avec son compteur ; rail de 76 puis 232 px, replié dans l'atelier. Voix : tenue et vérifiée ; le client lit le prénom de son coach.                                                                              |

### Séance guidée

| Écran                                    | État     | Ce qui manque                                                                                                                                          |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ouverture, décompte, enchaînement, pause | **fait** | « Bloc suivant » trois secondes entre deux blocs (C2). La reprise se fait sans question, avec son bandeau (C1).                                        |
| Séries, repos, exercices à durée         | **fait** | Le chipper borné a son chrono et sa feuille « Temps écoulé » (C3) ; les répétitions se notent (C4) ; deux colonnes et le clavier sur grand écran (C6). |
| Blocs chronométrés                       | **fait** | Grand écran compris (C6).                                                                                                                              |
| Échelle                                  | **fait** | Y compris l'API.                                                                                                                                       |
| Fin de séance                            | **fait** | Sauf « Dire comment c'était » sur l'accueil après un ressenti quitté sans envoyer.                                                                     |

### Client

| Écran           | État     | Ce qui manque                                                                                                                                                |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accueil         | **fait** | Tous les cadres, réponse du coach comprise. Restent « Ensuite dans ton programme » sur grand écran et tirer pour recharger.                                  |
| Programme       | **fait** | Là : la durée, la barre de composition, les jours en pastilles, l'état en pastille dont « En cours » et « Modifiée depuis ta dernière fois », le chargement. |
| Fiche de séance | **fait** | « Reprendre » mène droit à la série (C1).                                                                                                                    |
| Progrès         | **fait** | Là : les records, les mouvements en courbes, la feuille d'un mouvement, le calendrier à pastilles, la liste et ses mentions, le détail et « Corriger ».      |
| Mon compte      | partiel  | L'écran actuel, avec le réglage du son. Manquent les vibrations, la déconnexion sur l'écran, et le passage aux composants du kit.                            |
| Premiers pas    | partiel  | La question des données de santé existe. Les trois cartes de bienvenue et le détail dépliable manquent.                                                      |

### Coach

| Écran                 | État     | Ce qui manque                                                                                                                                                                                                                                                                                                                     |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| À lire                | **fait** | Le fil, son ordre, les séances repliées, « Tout est lu », « Déjà lues », réagir, répondre, glisser pour lire avec « Annuler », « Ajuster », panneau de droite. Écarts : voir §6.                                                                                                                                                  |
| Clients               | **fait** | Là : les tuiles qui filtrent, l'anneau et les points par ligne, la ligne d'état, la recherche, le tri, l'état vide, le panneau, les étiquettes, l'invitation, le menu et « Retirer ».                                                                                                                                             |
| Atelier d'un client   | **fait** | Là : la ligne qui se lit puis s'ouvre, les réglages en pastilles, la palette dessinée, le rail, l'en-tête de séance et son menu, la bande de séances et la feuille de la séance sur téléphone, le pouls, le ressenti sous chaque exercice, le score sous un bloc, l'aperçu « vu par le client », l'import d'un modèle, les bords. |
| Les formats de bloc   | **fait** | Les dix formats et la limite de l'échelle ; la palette dessine chacun, et les paliers se tapent librement (E6a).                                                                                                                                                                                                                  |
| Ressentis d'un client | **fait** | Là : le résumé, le calendrier à pastilles, la liste lue séance par séance, la bascule « Programme / Ressentis », le détail avec « prévu / fait » et la réponse.                                                                                                                                                                   |
| Modèles               | à faire  | Des cartes qui montrent le contenu, l'usage, « Utiliser pour un client », dupliquer.                                                                                                                                                                                                                                              |
| Exercices             | partiel  | Création à la frappe et usage : là. Manquent les vignettes, le panneau, le tri « les plus utilisés » en menu.                                                                                                                                                                                                                     |

### Commun

| Écran                   | État    | Ce qui manque                                                                                                                                                                                                                    |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connexion et invitation | partiel | Les trois volets et le tutoiement sont là. Manquent le grand écran en deux volets, « Rejoindre Julie avec ce compte ? » et « Tu es déjà avec Julie ».                                                                            |
| États du système        | partiel | Panne, page introuvable, erreur, mise à jour : faits. Le bilan part au retour du réseau (C5). Manquent le bandeau hors connexion, « C'est plus long que d'habitude », la règle d'un seul message à la fois (29 appels à relire). |
| Administration          | à faire | Inchangé dans son contenu : seulement à remettre aux composants du kit.                                                                                                                                                          |

### API

| Nouveauté                                                  | État                 |
| ---------------------------------------------------------- | -------------------- |
| Chrono et palier de l'échelle                              | **fait** (`cfee928`) |
| Mouvements faits et temps du chipper borné                 | **fait** (`01b53b6`) |
| Réponse du coach (réaction, texte, « lue par le client »)  | **fait** (`fa19c04`) |
| Fil « À lire », et marquer lue une séance à la fois        | **fait** (`e15ef30`) |
| Étiquettes de clients                                      | **fait** (`a69e976`) |
| Régularité dans la liste des clients                       | **fait** (`ee60e69`) |
| Modèles : usage, duplication, « Enregistrer comme modèle » | **fait** (`620f552`) |

## 3. Ce que le code doit ranger

Constaté, avec sa mesure.

1. **`GuidedSession.tsx` fait 1 510 lignes** et porte cinq scènes, l'état de
   la séance, la pause, la reprise et une consigne en plein écran.
   `SessionScreen.tsx` (590 lignes) mêle la fiche et tout l'enchaînement de
   fin.
2. **`features/client` a 21 modules et 20 tests à plat**, deux dossiers
   `guided` (la logique pure, et les restes de l'ancien mode) et cinq
   sous-dossiers de composants. On ne sait plus où chercher — réglé en B5 :
   un dossier par écran.
3. **Le kit n'a pas d'adresse.** Pastilles, bulles, cartes et titres vivent
   dans les écrans qui les ont eus en premier. Le coach les réécrirait.
4. **Les frontières fuient** : `shared` importe trois fois une fonctionnalité,
   `account` et `client` s'importent l'un l'autre, le coach importe six fois
   l'intérieur du client. Ce que les deux espaces partagent (nommer une séance,
   l'estimer, lire une dose, un record, un ressenti) n'a pas de lieu neutre —
   réglé : `domain/` (B4), les tranches (B5), `shared/feedback` (B8), et ESLint
   tient les frontières (B9).
5. **Deux façons de nommer une séance** : « Séance 2 — Haut du corps » et
   « Haut du corps », selon l'écran — réglé en B4 : le nom seul, comme la
   maquette.
6. **Les sabotages étaient hors du dépôt** — réglé : les cas et leur lanceur
   sont dans `verify/sabotage/`. Vingt-trois ne correspondaient déjà plus au
   code qu'ils devaient casser ; réparés, et les 244 rejoués en B12.
7. **Le banc attend à l'aveugle** : 258 attentes à durée fixe, et son décor
   (821 lignes) n'est pas tenu par le contrat de l'API. Sa lenteur est
   réglée : les suites tournent sur quatre files.
8. **Restes de l'ancien mode guidé** : `Timer`, `BlockList`, la question de
   reprise, `PerformedFields`, `SuggestedDays` — `Timer` et `BlockList`
   partis en B6, la question en C1.
9. **API** : cinq scripts `verify:*` gardent chacun leur `ok()` (85
   assertions à passer sous Vitest) ; `roster.controller.ts` porte des
   agrégations qui appartiennent à un service ; `CLAUDE.md` cite un
   `verify:rounds` qui n'existe plus.

### La structure visée

```
src/
  app/        routes, fournisseurs, les trois dispositions
  kit/        les composants de la maquette, et rien d'autre
  domain/     logique pure lue par le client ET le coach
              session/ (titre, durée, formats, doses, dessin)
              history/ (dernière fois, records, ressenti)
              week/    (anneau, suite de semaines)
  shared/     api, auth, contrat, réglages, son et vibration, utilitaires
  features/
    client/   home/ program/ sheet/ guided/ end/ progress/ onboarding/
    coach/    inbox/ clients/ client-file/
    workshop/ l'éditeur, commun aux programmes et aux modèles
    templates/ exercises/ account/ auth/ admin/ legal/
```

Trois règles, tenues par ESLint et non par la mémoire : `kit` et `domain`
n'importent aucune fonctionnalité ; une fonctionnalité n'entre dans une autre
que par son `index.ts` ; chaque tranche garde ses tests à côté d'elle.

## 4. Quand un écran est « fait »

1. Tous les cadres de la maquette s'atteignent, téléphone (390 px) et grand
   écran (1 280 px), et la capture a été comparée au dessin.
2. Il n'est fait que de composants du kit.
3. Chargement, vide et panne sont trois écrans différents.
4. La voix : tutoiement, pas d'accord deviné, une panne dit ce qui est sauf.
5. Clavier, cibles de 44 px, libellés pour le lecteur d'écran, « moins
   d'animations » respecté.
6. Ce que l'écran décide est une fonction pure, testée sous Vitest.
7. Une suite du banc lit l'écran, et chaque mécanisme a son cas de sabotage
   écrit.

## 5. Le plan

Ordre retenu : finir ce qui est ouvert, **ranger avant de construire le
coach**, puis l'API du coach, le coach, le reste, et enfin les états du
système et le mouvement. Le rangement ne change aucun comportement : c'est le
banc actuel, inchangé, qui le prouve.

### A. Fermer ce qui est ouvert

- [x] **A1** Fiche de séance : en-tête, cartes de bloc, consigne en feuille,
      « Démarrer » / « Reprendre » collé en bas, « Je l'ai déjà faite ».

### B. Ranger

- [x] **B1** Les sabotages dans le dépôt : `verify/sabotage/`, un fichier de
      cas par suite, `npm run sabotage -- <suite>`, et `sabotage:check` qui
      vérifie les motifs sans navigateur.
- [x] **B2** `kit/` : `ActionButton`, `LinkButton`, `Chip`, `Bubble`, `Card`,
      `HeroCard`, `Eyebrow`, `Ring`, `Dots`, `Segments`, `Sheet`, `Mascot`,
      les états, les champs. Les copies disparaissent. L'ancienne carte
      devient `LegacyCard` et part avec les quatre écrans qui la lisent
      encore (F1, F3, F4). Le pas de charge reste à la séance guidée (B6).
- [x] **B3** Une planche du kit (`/kit`, en développement seulement, sans
      compte) que le banc ouvre : chaque pièce, chaque état ; rien ne
      déborde, le focus est ambre, « moins d'animations » est respecté.
- [x] **B4** `domain/` : titre, durée, formats, doses, dessin, dernière fois,
      records, ressenti, semaine. Un seul nom pour une séance — celui que le
      coach a donné, sinon « Séance 3 » ; le rang se pose à côté, jamais
      devant. Le dessin d'un bloc devient une règle pure (`blockDrawing`),
      que la palette de l'atelier reprendra.
- [x] **B5** `features/client` en tranches (`home`, `program`, `sheet`,
      `guided`, `end`, `progress`), tests à côté. Autour : `shell` (la
      disposition, la porte du programme), `common` (données, voix du
      coach), `sound` (que B8 sortira). Son `index.ts` passe de 35 noms à 4,
      et ne réexporte plus rien de `domain/`.
- [x] **B6** `GuidedSession` découpé : l'état de la séance dans un réducteur
      pur testé, une coquille (haut, segments, pause, écran allumé), une
      scène par forme. `Timer`, `BlockList` et la consigne plein écran
      partent. 1 523 lignes → 363 ; `session.ts` et ses 38 tests ; la liste
      devient `BlockSets`, la consigne la feuille de la fiche, et le repos
      entre deux blocs la carte du repos des séries (part de C2).
- [x] **B7** `SessionScreen` découpé : la fiche d'un côté, l'enchaînement de
      fin de l'autre, en réducteur pur. `SessionSheet`, `EndFlow` et
      `flow.ts` ; les envois et la semaine d'après dans `sending.ts`. 24
      tests ; une date « Ce n'était pas aujourd'hui » abandonnée ne date
      plus la séance guidée qui suit.
- [x] **B8** Vibrations et sons sous une seule adresse, motifs nommés,
      réglage « Vibrations » masqué là où le téléphone n'en a pas.
      `shared/feedback` : `sound`, `haptics` (`tap`, `undo`, `tick`, `go`),
      leurs réglages ; « Mon compte » porte les deux interrupteurs.
- [x] **B9** Les frontières dans ESLint ; `shared` ne lit plus aucune
      fonctionnalité. Le bouton Google et le fournisseur de session passent
      dans `auth` ; quinze imports profonds passent par les `index.ts` ;
      chaque règle a été éprouvée par une violation posée exprès.
- [x] **B10** Banc : attendre un état plutôt qu'une durée (les 258), décor
      typé par le contrat. (Les files parallèles sont faites.) `settle`
      attend le réseau puis les mouvements courts ; restent quatre `hold`
      nommés, là où c'est le temps qui est éprouvé, et l'enregistrement
      différé de l'atelier (`autosaved`). 4 min 23 s → 2 min 50 s,
      trois passages verts de suite. Le décor typé a trouvé deux écarts au
      contrat.
- [x] **B11** `features/program` devient `features/workshop`, sans rien
      changer d'autre : le lot D le réécrit.
- [x] **B12** Passe complète des sabotages : réparer les cas marqués, les
      rejouer tous, corriger les assertions creuses qu'ils montrent. 23 cas
      réparés, 244 rejoués, chacun fait tomber ce qu'il vise et cela seul.
      Trois assertions creuses corrigées, une ajoutée (la pause d'un repos).

### C. Finir la séance guidée

- [x] **C1** Reprise sans question : la fiche et l'accueil mènent droit à la
      série, bandeau « Reprise au bloc 2 » trois secondes. Recommencer se
      décide sur l'accueil, qui le demande d'abord.
- [x] **C2** « Bloc suivant », trois secondes sans geste ; ~~le repos entre
      blocs sur la scène de repos~~ (fait en B6) ; la ligne « Ensuite ».
      L'écran dit ce qui finit (« Bloc 1 terminé · 8 tours », jamais le nom
      du bloc devant « terminé », qu'on n'accorde pas) et ce qui vient ; un
      toucher n'importe où enchaîne, la pause le fige, à plat il passe sur
      deux colonnes. Pas après le repos qui termine un bloc : il annonce
      déjà la suite, et nomme maintenant le bloc. Le dernier geste d'un bloc
      dit « Ensuite · bloc suivant : EMOM ».
- [x] **C3** Chipper et TimeCap : chrono de limite, feuille « Temps écoulé ».
      Une limite fixée par le coach donne à la liste un chrono : « Lancer »
      (sauf au premier bloc, que « C'est parti » arme), la puce qui descend,
      trois bips, puis la feuille qui propose le mouvement en cours, à
      confirmer. La liste écoulée avant la limite arrête le chrono à la
      dernière série. Mouvements faits et temps partent avec le bilan
      (`chipperDone`, API `01b53b6` — à déployer avant le front). Sans
      limite, rien ne change.
- [x] **C4** Noter des répétitions différentes du prescrit. Le grand
      nombre se touche (un crayon le dit) et ouvre le même sélecteur que la
      charge, légendé contre le prescrit : « 2 de moins que prescrit ». Les
      répétitions s'écrivent pour cette série seule, la ligne faite les dit
      (« 8 reps · 26 kg »), et elles partent avec le bilan comme les
      charges.
- [x] **C5** « Dire comment c'était » : un ressenti quitté sans envoyer se
      retrouve sur l'accueil, et part quand le réseau revient. Finie, la
      séance est « à valider » — l'accueil et la fiche disaient « Reprendre »
      — et « Dire comment c'était » rouvre le ressenti seul. Sans réseau,
      l'envoi ne se met plus en pause en mémoire : le ressenti est gardé,
      daté, échappe à la péremption, et part seul au retour du réseau ou à
      l'ouverture, avec « Séance envoyée ». Un serveur qui répond 500 a
      répondu : l'écran le dit et l'on réessaie, comme avant.
- [x] **C6** Grand écran : deux colonnes, le plan de la séance, les
      raccourcis clavier. Au-delà de 1 024 × 600, la séance quitte sa boîte
      de 560 px pour toute la place : la série à gauche, le bloc et le plan
      à droite ; l'anneau d'un EMOM à gauche, ses doses à droite ; « Bloc
      suivant » sur deux colonnes. Espace valide, P met en pause, ← et →
      reculent et avancent — en touchant la commande que la scène a
      marquée, jamais en refaisant son geste. Le bloc chronométré perd son
      propre écouteur de flèches, qui faisait avancer de deux tours.

### D. L'API du coach (avant le front qui s'en sert)

- [x] **D1** Les cinq `verify:*` sous Vitest ; les agrégations de
      `roster.controller` dans un service ; `CLAUDE.md` à jour (`ac4df0b`).
      En chemin : un ressenti absent faisait répondre 500 à toute la liste.
- [x] **D2** Réponse du coach : réaction, texte, date, « lue par le client ».
      Une route pour écrire, une pour marquer lue (`fa19c04`). Une liste de
      réponses : modifiable tant que non lue, puis une nouvelle.
- [x] **D3** Fil « À lire » : les séances non lues de tous les clients, avec
      ce qui a été fait et le passage d'avant ; lue à l'unité (`e15ef30`).
      Lue ou non lue, une ou plusieurs à la fois : « Annuler » défait une
      lecture envoyée. Depuis E11b, le front lit séance par séance : la
      route qui marque tout l'historique d'un client part de l'API une fois
      ce front en production (H4), pas avant — l'ancien front l'appelle.
- [x] **D4** Le prénom du coach dans le programme du client.
- [x] **D5** Étiquettes de clients : créer, renommer, supprimer, rattacher
      (`a69e976`). Posées sur le lien coach–client : chacun les siennes.
- [x] **D6** Liste des clients : séances de la semaine et cinq derniers
      ressentis par client (`ee60e69`). La semaine commence au minuit du
      coach : l'écran envoie `?weekStart=` avec son décalage.
- [x] **D7** Modèles : compteur d'imports, dupliquer, « Enregistrer comme
      modèle » (`620f552`). Le compteur retient des clients, pas des imports.
- [x] **D8** Un bilan reçu deux fois ne compte qu'une : une clé d'envoi,
      posée par le front, reconnue par l'API (`94648e3`). Depuis C5, un envoi
      dont la réponse s'est perdue en route est gardé puis renvoyé ; le front
      empêche deux envois croisés, il ne peut pas savoir qu'un envoi coupé
      était arrivé. La clé est gardée avant le premier envoi, renvoyée à
      chaque essai ; le banc perd une réponse et compte les bilans reçus.

### E. Le coach

- [x] **E1** Navigation : quatre onglets, « À lire » en premier avec son
      compteur, rail de 76 puis 232 px, replié dans l'atelier. Un seul rail
      dans le kit, pour le client comme pour le coach ; la liste des clients
      passe sur `/coach/clients`.
- [x] **E2** « À lire » : le fil et son ordre, les cartes repliées, « Tout
      est lu », « Déjà lues ». L'ordre et ce que dit une carte sont des
      fonctions pures (`domain/inbox`) ; réagir, répondre et lire en
      glissant sont E3.
- [x] **E3** « À lire » : réagir, répondre, marquer lue en glissant avec
      « Annuler », « Ajuster », panneau de droite. Le compte du coach porte
      son identifiant (API `9ace797`) : c'est ce qui reconnaît ses réponses.
- [x] **E4** La réponse chez le client : bulle sur l'accueil et dans Progrès,
      « Nouveau », « Julie ne l'a pas encore lue », « Envoyer à Julie ». La
      voir, c'est l'avoir lue ; « Nouveau » tient le temps de la visite.
- [x] **E5** Atelier, lire : une ligne se lit puis s'ouvre, réglages dessous
      ou en feuille, en-tête de bloc en pastilles, menu d'un bloc. En
      trois temps. La ligne (E5a) : nom et dose, « à régler » en gris ; −/+
      dont le pas grandit avec la valeur (`domain/session/doseEdit`) ;
      changer d'unité prévient après coup, avec « Annuler ». Le bloc (E5b) :
      une carte, ses réglages en pastilles qui s'ouvrent sur place, le nom
      en pastille, la consigne en bulle, un « ⋯ » qui nomme, change de
      format (`domain/session/format`), duplique et supprime ; sur
      téléphone, l'en-tête ouvre une feuille. « Ajuster » (E5c) ouvre
      l'exercice que le client cite, sinon celui dont la charge a baissé
      (`domain/inbox/concerned`). La durée d'un échauffement, qui ne sert
      qu'à l'estimation, attend la durée estimée (E7).
- [x] **E6** Atelier, ajouter : palette de formats dessinée, « + exercice »
      qui cherche puis crée, fiche d'exercice à la place de l'aperçu, saisie
      libre des paliers. La palette (E6a) : neuf formats, chacun dessiné
      (`formatSketch`), en carte sur grand écran, en feuille sur téléphone ;
      choisir un format ouvre le « + exercice » du bloc créé ; les paliers
      se lisent par `parseRungs`. Le sélecteur (E6b) range ce programme,
      puis la bibliothèque, puis « Créer « … » et ouvrir sa fiche »
      (`domain/exercise/choices`), chaque ligne avec son usage et sa vidéo.
      La fiche prend la colonne de droite à partir de 1 280 px, et dit
      « chez 4 clients » (API `7c29fa3`).
- [x] **E7** Atelier, les séances : rail (durée, jours, composition, cinq
      ressentis), glisser, menu, bande sur téléphone. En deux temps. Le
      rail et l'en-tête (E7a) : chaque séance dit « ≈ 30 min · lun, jeu »
      ou « jamais faite », sa composition en segments et ses cinq derniers
      ressentis (`domain/session/rail`) ; l'en-tête porte le nom, la durée,
      une pastille des jours et un « ⋯ » — renommer, le mot d'avant séance,
      dupliquer, copier vers un client, enregistrer comme modèle,
      supprimer —, le même menu qu'au clic droit sur le rail. « + Séance »
      ouvre la séance neuve sur son nom. La bande sur téléphone (E7b) : des
      cartes — nom, durée, « jamais faite », composition, ressentis — qu'un
      appui long soulève et qu'un glissement bref fait défiler ; la séance
      ouverte s'y montre. Sous `md`, l'en-tête s'efface derrière un « ⋯ »
      dans la barre du haut, qui ouvre la feuille de la séance : nom, jours,
      mot d'avant séance, et le reste du menu. « + » y ouvre la séance
      neuve, nom prêt à la frappe. La page d'un modèle, sans barre du haut,
      garde son en-tête.
- [x] **E8** Atelier, ce que le client en a fait : pouls, ressenti sous
      chaque exercice, score sous un bloc (« palier 5 sur 7 en 12:00 »). En
      trois temps. Le pouls (E8a) : une carte sous l'en-tête — les passages,
      cinq points, « Devient trop dure depuis deux passages », le dernier mot
      du client, ses étiquettes en noms (« Douleur · épaule »,
      « Fatigue × 2 ») et ce qui reste à lire (`domain/history/pulse`) ; sur
      téléphone, une phrase et cinq points. Sous 1 280 px, il ouvre les
      passages en feuille ; au-delà, la colonne de droite les tient, sans
      plus répéter la dérive. Le bandeau et son axe gradué sont partis. La
      trace (E8b) : sous chaque exercice, les charges des trois derniers
      passages — « 20 → 24 → 26 kg » et ses barres, « Fait à 20 kg, trois
      fois de suite » —, le mot du client quand il le cite, en corail s'il
      a fait mal ; ouverte, la ligne ajoute « Elle monte seule : + 6 kg en
      trois passages » (`domain/history/exerciseTrace`). Une ligne retrouve
      son mouvement par son identifiant, et par son rang d'apparition quand
      il revient. Le score (E8c) : sous un bloc qui se compte, « Tours
      bouclés : 4, 5, 5 », « Palier 5 sur 7 en 12:00. Avant : 4 sur 7 »,
      « Fini en 9:40 », un point sarcelle quand il monte, corail quand il
      baisse (`domain/history/blockScore`). Un bloc se retrouve par son
      format et son rang parmi ceux de ce format ; la pastille de « À
      lire » lit la même source.
- [x] **E9** Atelier, l'aperçu « vu par le client » : les scènes de la
      séance guidée, à l'échelle. En deux temps. La scène (E9a) : le choix
      de la scène quitte `GuidedSession` pour `GuidedScene`, que l'atelier
      montera aussi — deux copies de ce choix finiraient par montrer au
      coach un écran que son client ne voit pas —, et `previewState` ouvre
      la séance au début d'un bloc, horloge à l'arrêt. L'aperçu (E9b) : une
      iframe de 390 × 844 à l'échelle, parce que les scènes lisent la
      taille de la fenêtre (59 fois) et qu'un cadre réduit de l'écran du
      coach les rendrait en mise en page large. L'atelier lui envoie la
      séance à chaque frappe ; elle ne charge rien, n'écoute que sa propre
      origine, et reste inerte. Elle suit le bloc que le coach touche. À
      partir de 1 280 px, chez un client, la colonne bascule entre
      « Aperçu » et « Ressentis » — deux vues qui portent le nom de leur
      bascule ; dans un modèle, l'aperçu seul, « vu par le client ».
- [x] **E10** Atelier, les bords : importer un modèle et son avertissement,
      programme vide, séance introuvable, états d'enregistrement,
      suppression et « Annuler » partout. En deux temps. L'import (E10a) :
      il n'avait jamais eu d'écran — le crochet existait, rien ne
      l'appelait. « Importer un modèle… » au pied du rail, « Partir d'un
      modèle » dans un programme vide ; un programme qui a des séances
      demande d'abord, en disant ce qui part, ce qui vient et ce qui reste.
      L'éditeur adopte ce que le serveur rend, et refuse l'import pendant un
      enregistrement en vol : sans cela, une frappe pas encore partie
      renvoyait l'ancien programme par-dessus l'import. Les bords (E10b) :
      l'état de l'enregistrement passe dans l'en-tête de la séance —
      « Enregistrement… », « Enregistré » trois secondes, « Non enregistré ·
      Réessayer » qui reste jusqu'à réussite —, la ligne du bas ne servant
      plus que sur téléphone et sans séance ouverte ; aucune suite ne lisait
      l'échec. Le programme vide accueille par le personnage, « Le
      programme de Sarah est vide », et ses deux voies. La séance
      introuvable existait. Les suppressions avaient déjà toutes leur
      « Annuler », chacune sur le banc : séance, bloc, exercice, format,
      unité.
- [x] **E11** Ressentis d'un client : résumé, calendrier, « prévu / fait »,
      réponse, lue à l'ouverture de la séance. En trois temps.
  - [x] **E11a** La fiche d'un client dit s'il partage ses données de santé
        (`1c1bee3`, l'API) : sans cela, un client dont le serveur ne garde
        ni étiquette ni mot passait pour un client qui n'écrit rien.
  - [x] **E11b** Le résumé — cinq points, « Les deux dernières : dures »,
        le rythme sur quatre semaines, les étiquettes qui filtrent la
        liste —, un calendrier dont la pastille pleine ouvre sa séance, la
        bascule « Programme / Ressentis ». Une séance devient lue quand on
        l'ouvre : l'écran ne lit plus tout l'historique à son ouverture, ce
        qui effaçait les séances arrivées depuis la dernière visite. La
        ligne ne dit plus « Aucun commentaire » ; elle n'a pas de durée,
        qu'aucun bilan n'enregistre. En chemin : « rien ne déborde à
        390 px » de la planche du kit était creux — un téléphone élargit
        sa fenêtre à ce qui déborde, et la page grandissait avec elle. Les
        deux suites mesurent désormais contre la largeur de l'appareil, et
        un sabotage le prouve.
  - [x] **E11c** Le détail d'une séance, en panneau à droite à partir de
        1 280 px et en feuille en dessous : « Son mot » et non plus « Ton
        commentaire », la réponse avec la pièce de « À lire » (sortie en
        `ReplyThread`), le prévu en face du fait avec une flèche sarcelle
        quand la charge passe celle d'avant, le score d'un bloc qui se
        compte, « Le programme a changé depuis », les cinq axes d'un ancien
        bilan, « Ajuster la séance » — ou « Cette séance n'est plus au
        programme ». Une réponse partie entre aussitôt dans l'historique
        affiché ; elle n'apparaissait qu'au rechargement. Le coach n'ouvre
        plus le tiroir du client que dans l'aperçu de la liste des clients :
        la garde qui l'empêche de lire à la place du client s'y éprouve
        désormais, faute de quoi plus rien ne la couvrait. Deux attentes du
        banc étaient creuses sous charge — un texte que le champ de réponse
        portait déjà, une liste comptée avant d'être là — : elles attendent
        l'état, et quatre copies de la suite tournent vertes en parallèle.

### F. Le reste

- [x] **F1** Programme du client : cartes, durée, barre de composition,
      états. Chaque carte dit « ≈ 45 min · 3 blocs · 7 exercices » — les
      mouvements distincts, l'ancien compte additionnait les lignes —, sa
      composition (la barre du rail, passée au kit), ses jours en pastilles,
      et son état : « En cours », « À faire aujourd'hui », « Faite
      dimanche », « Modifiée depuis ta dernière fois », « Jamais faite ».
      Une séance laissée sur le téléphone parle comme sur l'accueil (« À
      valider », « En attente de réseau »). Six cartes fantômes au
      chargement : l'écran annonçait « Ton programme arrive » le temps de
      la requête, à qui en avait un. La tranche « prochaine séance » part :
      « À faire aujourd'hui » dit la même chose, et seulement quand c'est
      vrai.
- [x] **F2** Progrès : records, « Tes mouvements » en courbes, feuille d'un
      mouvement. En tête, deux records au plus, les plus récents — une
      charge, ou des tours d'AMRAP —, datés au passage qui les a établis :
      refaire 20 kg ne rend pas un record plus neuf. Puis une ligne par
      mouvement chargé : sa dernière charge, une courbe au kit, l'écart
      depuis le premier passage, en sarcelle ou en bleu (un ton ajouté au
      kit, la baisse « sans jugement »). Sa feuille : la courbe en grand,
      chaque passage avec le format de son bloc, « Record » sur celui qui
      l'a établi. Seules les charges ont une courbe : l'ancienne colonne
      mêlait kilos, répétitions totales et secondes ; elle part, avec sa
      logique. Le calendrier et la liste attendent F3.
- [x] **F3** Progrès : calendrier à pastilles d'effort, liste et ses
      mentions, détail, « Corriger », ancien bilan à cinq axes. En deux
      temps.
  - [x] **F3a** Le calendrier du kit, toujours là — plus de « Filtrer par
        date » —, qui ouvre sur le mois de la dernière séance et s'arrête au
        mois en cours ; une pastille ouvre sa séance, un jour à deux
        séances la liste des deux. Les marques du calendrier passent au
        domaine, partagées avec le journal du coach. « Tes séances » : une
        ligne par séance, son nom du jour, sa date et ce qu'il y a à savoir
        — « Julie a répondu », « ancien bilan », « modifiée depuis »,
        « corrigée le 2 sept. » —, son ressenti en pastille (au kit, celle
        du journal). Les cartes qui écrivaient les formats et cachaient la
        réponse du coach derrière « Voir le détail » partent de Progrès. Un
        sabotage a montré que le calendrier du kit gardait le mois de son
        premier rendu : monté avant l'historique, il restait sur un mois
        vide. Il suit désormais un nouveau mois de départ.
  - [x] **F3b** Le détail : panneau sur grand écran, feuille sur
        téléphone ; « Corriger » qui rouvre les charges puis le ressenti,
        date comprise ; l'ancien bilan à cinq axes. Le détail dit le
        ressenti par son visage, « Ton mot » et la réponse du coach en
        bulles, puis une ligne par mouvement — son format, sa dose, le fait
        en face, la flèche d'une charge qui monte, et le record en ambre sur
        la seule séance qui l'a établi. « Corriger » rouvre « Mes charges »
        puis le ressenti, sur les valeurs enregistrées, et n'envoie que ce
        qui a changé ; un ancien bilan s'enregistre dès ses charges, sans
        ressenti à inventer. Le tiroir du bilan part, avec ses champs de
        série et les cartes de bloc qu'il était seul à lire. L'accueil
        ouvre le même détail en feuille — le jour fait comme « Voir ta
        dernière séance » —, et l'aperçu d'un client chez le coach aussi,
        au « Son mot », sans « Corriger ».
- [x] **F4** Clients : tuiles, lignes, recherche, tri, panneau, état vide.
      En deux temps.
  - [x] **F4a** La liste : trois tuiles en tête — « à lire », « à
        relancer », « mal réglées » — qui filtrent ce qu'elles comptent et
        se touchent de nouveau pour le retirer ; une ligne par client, son
        anneau de semaine (un tiret sans jour conseillé), ses derniers
        ressentis en points, sa ligne d'état en couleur (en pastille sur
        grand écran) ; l'ordre de ce qui demande de l'attention ; la
        recherche toujours là, sans accent ni casse ; « Activité » et
        « A → Z » dans un menu de tri ; l'état vide qui propose le lien.
        La logique sort du composant (`domain/clients/roster`) : les tuiles
        et les lignes comptent avec la même règle. La pastille gagne un ton
        vert, celui de « Juste ».
  - [x] **F4b** Le panneau d'aperçu, sur grand écran : le nom et
        l'ancienneté du suivi (« avec toi depuis le 1er juin »), « Ouvrir
        son programme », les derniers ressentis en points sous la phrase de
        la ligne — sa tendance, sinon la série du journal —, la semaine et
        le total, les trois dernières séances, mot du client compris, qui
        s'ouvrent au « Son mot », et « Tous ses ressentis ». Sans choix, il
        montre le premier de la liste : le prochain à traiter. La carte de
        séance que l'aperçu était seul à lire part, avec le calcul des
        formats d'un bilan. Une première version tirait la phrase de
        l'historique et les points de la ligne : elle disait « dures » sous
        cinq points verts ; les deux viennent désormais de la ligne.
- [x] **F5** Clients : étiquettes, feuille d'invitation, « Retirer ». En
      trois temps.
  - [x] **F5a** La feuille d'invitation : le lien déjà prêt et sous les
        yeux, sa validité, « Copier le lien » qui dit « Lien copié » deux
        secondes, « Partager… » là où le téléphone partage. Un lien expiré
        est remplacé à l'ouverture ; une copie refusée sélectionne le lien
        et le dit. L'état vide copie d'une touche, comme le veut la
        maquette. « Inviter » faisait sortir le lien sans le montrer —
        partage, sinon presse-papiers, sinon une boîte de repli — : la
        boîte de repli et ce chemin partent.
  - [x] **F5b** Les étiquettes : trois au plus sur une ligne, puis « + 1 »,
        à la teinte tirée de leur nom ; la barre « Tous », chaque étiquette,
        « + étiquette », où plusieurs choisies montrent les clients qui en
        portent au moins une ; la feuille d'un client, ouverte par
        « modifier » dans le panneau, qui filtre au début des mots, propose
        « Créer » pour un nom neuf seulement et coche à la touche ; la
        gestion, qui dit combien de clients porte chaque étiquette, renomme
        sur place et demande avant de supprimer. Chercher au milieu des mots
        faisait remonter « Prise de masse » pour « se » : un test l'a dit
        avant l'écran. Le serveur d'essai sert les étiquettes avec les
        règles de l'API. Supprimer une étiquette ne réécrit plus la liste
        des clients : une ligne ne montre que les étiquettes connues, et un
        sabotage a montré que cette réécriture ne changeait rien à
        l'écran. Le menu d'une ligne, qui les ouvrira aussi sur
        téléphone, vient avec « Retirer » (F5c).
  - [x] **F5c** « Retirer de mes clients » et le menu d'une ligne. L'API
        gagne `DELETE /coach/clients/:id` (`8070f94`), qui défait le lien de
        ce coach et lui seul : le compte, le programme et l'historique
        restent au client, les étiquettes partent avec le lien ; un client
        qui n'est pas le sien répond 404. Le menu — étiquettes, ouvrir le
        programme, voir ses ressentis, retirer — s'ouvre au clic droit et à
        l'appui long, avec le composant du rail de l'atelier. La
        confirmation dit ce qui reste au client ; un retrait raté laisse la
        feuille ouverte et le dit.
- [x] **F6** Modèles : cartes, usage, « Utiliser pour un client »,
      dupliquer. En deux temps.
  - [x] **F6a** Les cartes. L'API envoie l'aperçu des quatre premières
        séances, rang, nom et formats (`f70a7e2`) : chaque carte les montre
        avec leur barre de composition, puis « + 2 séances » s'il en reste,
        et dit sous son nom « 2 séances · utilisé chez 3 clients » ou
        « vide · jamais utilisé ». Une, deux ou trois colonnes selon la
        largeur ; le menu de la carte — renommer, dupliquer, supprimer —
        reprend celui d'une séance de l'atelier ; « Renommer » part du nom
        actuel, « Dupliquer » fait entrer la copie en tête. « Nouveau »
        demande un nom dans une feuille puis ouvre l'atelier sur le modèle
        créé ; l'état vide propose de créer, ou d'enregistrer depuis le
        programme d'un client. Le rejeu a trouvé une suite qui s'arrêtait
        au lieu de tomber, sur une copie absente. Et la CI était rouge
        depuis F5b sur deux libellés d'assertion sans sabotage, que le lint
        voyait inutilisés : ils ont désormais leur cas.
  - [x] **F6b** « Utiliser pour un client », sur la carte et dans
        l'en-tête de l'atelier d'un modèle, éteint pour un modèle vide. La
        feuille liste les clients avec leur programme en une ligne :
        « programme vide » s'importe d'une touche, « a déjà 6 séances »
        passe par « Remplacer… » et la boîte de l'atelier, désormais
        partagée. Un import réussi ouvre l'atelier du client sur
        « Programme importé depuis “X” » ; raté, la feuille reste et dit que
        le programme du client n'a pas bougé. Depuis l'atelier d'un modèle,
        l'import attend que ce qu'on vient d'y écrire soit enregistré : le
        serveur importerait la version d'avant. Aucune API nouvelle, la
        liste des clients portait déjà le nombre de séances. Le banc a
        appris deux choses : une mutation est reprise deux fois, donc une
        panne s'éprouve sur toutes les tentatives ; et un message de
        réussite ne reste que deux secondes, il se lit dès le geste.
- [x] **F7** Exercices : vignettes, panneau, tri. En deux temps.
  - [x] **F7a** La liste. Une vignette par ligne — noire avec la lecture
        quand l'exercice a une vidéo, grise sinon —, le nom, la consigne sur
        une ligne, l'usage. Par nom, ou « Les plus utilisés » dans un menu ;
        les ex æquo par nom. Un seul champ en tête, qui cherche sans accent
        ni casse et propose « Créer “…” » pour un nom neuf : Entrée crée et
        ouvre la fiche. La fiche s'ouvre dans un panneau à partir de
        1 024 px — sans choix, il montre le premier de la liste —, dans une
        feuille basse en dessous. Le champ et le menu de tri passent au kit,
        partagés avec les clients. L'index alphabétique part : il
        n'apparaissait qu'à vingt-cinq exercices, ne suivait pas l'autre
        tri, et le champ fait mieux dès la première lettre. « Nouvel
        exercice » part aussi, le champ dit qu'il crée.
  - [x] **F7b** La fiche. La vidéo en tête : YouTube se joue dans la
        fiche, toute autre adresse s'ouvre ailleurs par « Ouvrir la vidéo »
        — chez le client aussi, le lecteur est le même —, un lien illisible
        est refusé à la saisie (« Ce lien ne ressemble pas à une adresse »).
        Une seule lecture du lien sert encore la saisie et l'affichage
        (`domain/exercise/video`). Les champs ont la forme de ceux de la
        maquette ; un nom vidé reprend l'ancien sans rien envoyer. Le pied
        dit la portée — « Ce que tu changes ici change partout » — et
        « Supprimer » : inactif et expliqué pour un exercice utilisé,
        immédiat pour un autre, avec « Annuler », qui le recrée avec sa
        consigne et sa vidéo. La boîte de confirmation part. « Exercice
        modifié » ne sort plus à chaque champ quitté ; un échec, lui, dit
        ce qui reste. Le serveur d'essai supprime comme l'API, et sa remise
        à zéro rend les exercices modifiés. Le rejeu a trouvé un compte
        d'envois partagé entre deux refus : le nom parti par erreur faisait
        tomber le lien.
- [x] **F8** Premiers pas : trois cartes, la question en une phrase. En
      deux temps.
  - [x] **F8a** La question du partage, en une phrase qui nomme celui qui
        lira — « acceptes-tu que Julie les lise ? », « ton coach » quand il
        y en a plusieurs. Le détail de ce qu'un refus change se déplie, avec
        la politique de confidentialité ; son contenu n'a pas bougé.
        « J'accepte » et « Je refuse » ont la même taille et aucun n'a le
        focus ; refuser demande d'abord s'il y a des ressentis à effacer,
        et tient en un geste sinon. L'ancienne phrase accordait le coach au
        masculin (« c'est avec elles qu'il adapte la suite ») : partie. Le
        consentement n'avait aucune suite de banc ; il a la sienne. Le nom
        du coach n'est lu que lorsque la question se pose : lu partout, il
        faisait demander le programme à « Mon compte », que `verify_states`
        veut joignable pendant une panne. Le rejeu a trouvé un focus lu
        après un geste qui l'avait pris.
  - [x] **F8b** Les trois cartes de bienvenue, avant la question : ce que
        prépare le coach, ce que fait la séance guidée, ce qu'on demande à
        la fin. « Suivant » ou glisser, dans les deux sens ; « Passer » et
        « Commencer » mènent à la question, et les cartes ne reviennent plus
        sur l'appareil. Sur grand écran, la même carte dans 480 px. Elles ne
        se montrent qu'à un client qui a un coach et n'a encore fait aucune
        séance, et seulement sur « Aujourd'hui » : la marque est locale, et
        un client de longue date les aurait vues sur chaque nouveau
        téléphone ; « Mon compte » reste joignable sans le programme.
        « dans l'ordre qu'elle a choisi » accordait le coach : « dans
        l'ordre choisi pour toi ». Le banc se connecte avec les cartes déjà
        vues (`signIn`, `markWelcomed`), et seule `verify_firststeps` les
        rouvre : le client sans séance de `verify_home` les avait trouvées
        devant son accueil. Le rejeu a trouvé une mesure qui attendait une
        carte absente au lieu de rendre rien.
- [x] **F9** Connexion et invitation : grand écran, compte déjà connecté,
      déjà client. En deux temps.
  - [x] **F9a** La connexion. La mascotte, le nom du produit, et une phrase
        à la place des trois puces ; « Continuer avec Google », puis les
        deux chemins de qui n'a pas de compte, chacun dans sa feuille :
        « J'ai reçu une invitation » dit d'ouvrir le lien et accepte qu'on
        le colle — « Continuer » s'active quand le texte en a l'air
        (`domain/invitation/link`) et mène à l'invitation de son jeton ;
        « Je suis coach » donne l'adresse, qui se copie d'une touche, et
        « J'ai déjà un compte coach » part chez Google. Sur grand écran,
        deux volets : la promesse à gauche, l'action dans 480 px à droite.
        L'écran n'avait aucune suite de banc ; il a la sienne.
  - [x] **F9b** L'invitation ouverte sur un compte déjà connecté. Un
        client qui suit déjà ce coach va droit à son accueil, avec « Tu es
        déjà avec Julie » ; tout autre compte se voit demander « Rejoindre
        Julie avec ce compte ? », avec l'adresse du compte ouvert, avant
        d'être rattaché — un lien ouvert par erreur, dans la session d'un
        autre, n'est plus un rattachement. « Utiliser un autre compte »
        ferme la session et revient au même lien. Avant, le lien renvoyait
        chez Google pour la même adresse. L'API (`7279e19`) ajoute
        `POST /auth/join`, qui rattache le compte de la session et lui seul,
        et `alreadyLinked` sur la vérification du lien. Sans prénom, le
        titre dit « Ton coach t'invite sur Kettle » au lieu de commencer
        par une espace. Le type de la vérification, écrit à la main, vient
        du contrat.
- [x] **F10** Mon compte et Administration aux composants du kit ;
      déconnexion sur l'écran. En deux temps.
  - [x] **F10a** Mon compte, en une colonne de 640 px : l'identité (« compte
        Google »), puis le bloc de l'espace où l'on est — son coach, depuis
        quand et combien de séances, et les données de santé côté client ;
        l'activité côté coach. Un compte à deux rôles lisait les deux blocs
        l'un sous l'autre. « Pendant la séance » : « Sons du chronomètre »
        et « Vibrations », sur une ligne à interrupteur que le kit gagne
        (`ToggleRow`). Les lignes légales, et « Recevoir une copie de mes
        données », qui donne l'adresse à copier et le délai d'un mois — le
        champ à copier passe au kit (`CopyField`), partagé avec la
        connexion. « Se déconnecter » est sur l'écran. « Supprimer mon
        compte » dit ce qui disparaît, puis attend le mot « SUPPRIMER »
        avant d'armer le bouton rouge. Sans coach : « Aucun coach pour
        l'instant », et la feuille qui accepte un lien collé. Les phrases
        qui se comptent sortent du composant (`domain/account/summary`) ;
        « 1 juin » devient « 1er juin ». L'écran n'avait aucune suite ; il a
        la sienne.
  - [x] **F10b** Administration : le rail et la barre du haut des autres
        espaces au lieu de sa propre coque, quatre tuiles qui s'accordent
        au nombre (« 1 coach »), et la liste des coachs — en lignes de
        cinq colonnes sur grand écran, en cartes sur téléphone, les tuiles
        sur deux colonnes. Un coach sans nom affiche son adresse.
        « Nouveau coach » : prénom, nom, adresse ; « Créer le compte »
        s'active quand l'adresse en est une. Une adresse déjà connue ne
        reçoit plus le rôle en silence : l'API répond par le nom du compte
        (`status: 'exists'`), la boîte demande « Ce compte existe déjà »,
        et seul « Donner le rôle de coach » renvoie avec `promote`. L'API
        n'exige plus que l'adresse, comme son commentaire le disait déjà,
        et l'ouverture ne se rejoue plus après une panne : une réponse
        perdue aurait fait répondre « déjà coach » à qui venait de
        l'ouvrir. Les types écrits à la main viennent du contrat.

### G. États du système et mouvement

- [x] **G1** Hors connexion : le bandeau, l'atelier qui réessaie seul.
      « Hors connexion » en tête de l'espace tant que le réseau manque,
      avec ce qui est sauf — la séance pour le client, ce qu'il écrit pour
      le coach —, et il part au retour. Le bandeau est une pièce du kit
      (`Banner`), que le bandeau de nouvelle version reprendra (G4).
      L'atelier disait « Enregistrement… » sans fin : sans réseau, TanStack
      Query met l'envoi en pause au lieu de le faire échouer. Il dit
      « Non enregistré · envoi au retour du réseau », sans « Réessayer »
      inutile, et l'envoi repart seul. Un envoi qui avait échoué avant la
      coupure attendait un geste : il repart lui aussi au retour du réseau.
      La séance guidée, calque plein écran, garde tout son écran.
- [ ] **G2** Chargement de plus de dix secondes ; panne par zone.
- [ ] **G3** Un seul message à la fois, jamais pour un enregistrement
      automatique ; bannière « Annuler » unique, huit secondes.
- [ ] **G4** Menu du compte, bandeau de nouvelle version, au kit.
- [ ] **G5** Mouvement : la valeur qui saute, l'entrée d'une scène, la coche
      qui se dessine, l'anneau de l'accueil quand il a changé.
- [ ] **G6** Tirer pour recharger, sur les quatre écrans qui le prévoient.
- [ ] **G7** Déplacer sans glisser, et le dire en français. Les trois
      `DndContext` (rail, bande, blocs) annoncent en anglais aux lecteurs
      d'écran, et leur consigne promet Espace et les flèches à un clavier
      qu'aucun capteur n'écoute — relevé en E7b. Des annonces et une
      consigne françaises, vraies, et « Monter / Descendre » dans le menu
      d'une séance et d'un bloc.

### H. Avant `main`

- [ ] **H1** Passe complète des sabotages, sur l'application finie.
- [ ] **H1b** Relecture d'accessibilité de chaque écran.
- [ ] **H2** Une planche de captures de tous les cadres, à poser à côté de
      la maquette.
- [ ] **H3** `CLAUDE.md` des deux dépôts et `verify/README.md` à jour.
- [ ] **H4** Mise en production, dans l'ordre : `npm run verify:copy` depuis
      une machine en réseau, `npm run migrate:ladder` sur la base, l'API
      (jusqu'à `887e193` : l'invitation d'un compte connecté et la
      question avant de donner le rôle de coach s'en servent), puis le
      front. Ensuite seulement, retirer de l'API
      `PATCH /coach/clients/:id/history/mark-viewed`, que le front n'appelle
      plus depuis E11b.

## 6. Écarts avec la maquette

Aucun n'est un choix : celui qui reste attend sa ligne du plan.

- **« À lire » ne se recharge pas en tirant vers le bas** : le geste est
  à faire pour tout l'espace, avec les autres états (G).
- **Changer d'unité prévient après coup**, par la bannière « Annuler », et
  non avant comme le dit la maquette (« après avoir prévenu si elle était
  remplie ») : c'est la règle du reste de l'atelier, jamais de question
  avant (E5a). Celui-ci est un choix, à confirmer.
- **Une carte de la bande dit « jamais faite »** sous sa durée, quand la
  maquette n'y met que la durée : sur téléphone, rien d'autre ne le dit, et
  les pastilles « S1 … » qu'elle remplace le disaient en s'estompant (E7b).
  Un choix aussi, à confirmer.

- **Une série du détail s'écrit comme partout** — « 12 reps · 26 kg » —
  et non « 12 × 26 kg » comme dans la maquette des ressentis : c'est
  l'écriture de `formatPerformed`, issue d'un retour du terrain, et deux
  écritures de la même série finiraient par se contredire (E11c).
- **Un client qui arrive est un « nouveau suivi »**, et non « nouvelle »
  comme dans la maquette : on ne connaît pas son genre, et un prénom ne le
  dit pas. De même « aucune séance depuis 3 semaines » pour qui n'a jamais
  commencé, et non « jamais démarré » (F4a).
- **La tuile « à relancer » dit sa règle** — « 14 jours sans séance » — et
  non « rien depuis 3 sem. », qui ne vaut que pour un client du décor
  (F4a).
- **Arrêter le partage des données de santé efface ce qui a été envoyé**,
  et ne propose pas de le garder visible du coach comme la maquette
  (« Arrêter le partage » ou « Arrêter et effacer ») : Kettle a choisi
  d'effacer, sans quoi la donnée resterait en base sans plus rien pour la
  justifier, et l'API ne sait pas faire autrement. Une décision juridique,
  à confirmer avant de changer quoi que ce soit (F10a).
- **« La connexion se fera avec le compte Google de cette adresse »**,
  et non « Il se connectera… » comme dans la maquette : on ne connaît pas
  le genre du futur coach (F10b).
- **La promesse de la connexion finit par « Ton ressenti règle la
  suite »**, et non « Il ajuste » : un accord sur un coach dont on ne
  connaît pas le genre, que Kettle n'écrit plus nulle part (F8a, F9a). Un
  choix, à confirmer.
- **La carte d'un modèle ne dit pas sa durée** (« ~3 h 10 au total »
  dans la maquette) : la liste resterait légère si elle ne relit pas toutes
  les séances de chaque modèle, et la durée d'une séance se calcule depuis
  ses blocs complets. L'aperçu n'envoie que les formats (F6a). Un choix, à
  confirmer.
- **Une ligne des ressentis n'a pas de durée** (« dim. 30 août · 41 min »
  dans la maquette) : aucun bilan ne l'enregistre. Elle demanderait un
  champ côté API.

Tranché le 16 novembre : la série en cours garde le bloc entier sous elle.
Ce n'est plus un écart, c'est la maquette qui a changé — son chapitre
« Séries, repos, exercices à durée » montre désormais la liste du bloc.
