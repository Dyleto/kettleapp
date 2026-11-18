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
| Client (hors séance)      | 6      | 2    | 2       | 2       |
| Coach                     | 7      | 1    | 2       | 4       |
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

Mesures au 18 novembre : 768 tests unitaires, 44 suites de banc et 779
assertions, 4 min 0 s pour le banc complet (14 min 23 s avant qu'il
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

| Écran           | État     | Ce qui manque                                                                                                                                                                  |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accueil         | **fait** | Tous les cadres, réponse du coach comprise. Restent « Ensuite dans ton programme » sur grand écran et tirer pour recharger.                                                    |
| Programme       | à faire  | L'ancien écran : pas de durée, pas de barre de composition, pas d'état « En cours » ni « Modifiée depuis ta dernière fois » en pastille.                                       |
| Fiche de séance | **fait** | « Reprendre » mène droit à la série (C1).                                                                                                                                      |
| Progrès         | à faire  | L'ancien historique sous un nouveau nom : pas de records, des suites « 20 → 24 → 26 kg » au lieu de courbes, pas de feuille par mouvement, calendrier sans pastilles d'effort. |
| Mon compte      | partiel  | L'écran actuel, avec le réglage du son. Manquent les vibrations, la déconnexion sur l'écran, et le passage aux composants du kit.                                              |
| Premiers pas    | partiel  | La question des données de santé existe. Les trois cartes de bienvenue et le détail dépliable manquent.                                                                        |

### Coach

| Écran                 | État     | Ce qui manque                                                                                                                                                                                                                                                                                            |
| --------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| À lire                | **fait** | Le fil, son ordre, les séances repliées, « Tout est lu », « Déjà lues », réagir, répondre, glisser pour lire avec « Annuler », « Ajuster », panneau de droite. Écarts : voir §6.                                                                                                                         |
| Clients               | à faire  | Tuiles de tête, anneau et points d'effort par ligne, ligne d'état, étiquettes, panneau d'aperçu, feuille d'invitation.                                                                                                                                                                                   |
| Atelier d'un client   | partiel  | Là : la ligne qui se lit puis s'ouvre, les réglages en pastilles, la palette dessinée, le rail, l'en-tête de séance et son menu, la bande de séances et la feuille de la séance sur téléphone. Manquent le pouls, le ressenti sous chaque exercice, l'aperçu « vu par le client », l'import d'un modèle. |
| Les formats de bloc   | **fait** | Les dix formats et la limite de l'échelle ; la palette dessine chacun, et les paliers se tapent librement (E6a).                                                                                                                                                                                         |
| Ressentis d'un client | à faire  | L'ancien journal sous son nouveau nom : pas de résumé, pas de « prévu / fait », pas de réponse, et tout l'historique devient lu d'un coup.                                                                                                                                                               |
| Modèles               | à faire  | Des cartes qui montrent le contenu, l'usage, « Utiliser pour un client », dupliquer.                                                                                                                                                                                                                     |
| Exercices             | partiel  | Création à la frappe et usage : là. Manquent les vignettes, le panneau, le tri « les plus utilisés » en menu.                                                                                                                                                                                            |

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
      lecture envoyée. Quand E11 lira séance par séance, la route qui marque
      tout l'historique d'un client pourra partir.
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
- [ ] **E8** Atelier, ce que le client en a fait : pouls, ressenti sous
      chaque exercice, score sous un bloc (« palier 5 sur 7 en 12:00 »).
- [ ] **E9** Atelier, l'aperçu « vu par le client » : les scènes de la
      séance guidée, à l'échelle.
- [ ] **E10** Atelier, les bords : importer un modèle et son avertissement,
      programme vide, séance introuvable, états d'enregistrement,
      suppression et « Annuler » partout.
- [ ] **E11** Ressentis d'un client : résumé, calendrier, « prévu / fait »,
      réponse, lue à l'ouverture de la séance.

### F. Le reste

- [ ] **F1** Programme du client : cartes, durée, barre de composition,
      états.
- [ ] **F2** Progrès : records, « Tes mouvements » en courbes, feuille d'un
      mouvement.
- [ ] **F3** Progrès : calendrier à pastilles d'effort, liste et ses
      mentions, détail, « Corriger », ancien bilan à cinq axes.
- [ ] **F4** Clients : tuiles, lignes, recherche, tri, panneau, état vide.
- [ ] **F5** Clients : étiquettes, feuille d'invitation, « Retirer ».
- [ ] **F6** Modèles : cartes, usage, « Utiliser pour un client »,
      dupliquer.
- [ ] **F7** Exercices : vignettes, panneau, tri.
- [ ] **F8** Premiers pas : trois cartes, la question en une phrase.
- [ ] **F9** Connexion et invitation : grand écran, compte déjà connecté,
      déjà client.
- [ ] **F10** Mon compte et Administration aux composants du kit ;
      déconnexion sur l'écran.

### G. États du système et mouvement

- [ ] **G1** Hors connexion : le bandeau, l'atelier qui réessaie seul.
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
      une machine en réseau, `npm run migrate:ladder` sur la base, l'API,
      puis le front.

## 6. Écarts avec la maquette

Aucun n'est un choix : celui qui reste attend sa ligne du plan.

- **Le jour fait s'ouvre sur place**, dans un tiroir — tant que Progrès n'a
  pas son détail (F3).
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

Tranché le 16 novembre : la série en cours garde le bloc entier sous elle.
Ce n'est plus un écart, c'est la maquette qui a changé — son chapitre
« Séries, repos, exercices à durée » montre désormais la liste du bloc.
