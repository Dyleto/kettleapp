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
| Fondations                | 5      | 2    | 3       | 0       |
| Séance guidée             | 5      | 3    | 2       | 0       |
| Client (hors séance)      | 6      | 2    | 2       | 2       |
| Coach                     | 7      | 0    | 2       | 5       |
| Commun                    | 3      | 0    | 2       | 1       |
| Ce que ça demande à l'API | 6      | 1    | 0       | 5       |

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

Mesures au 16 novembre : 505 tests unitaires, 30 suites de banc et 553
assertions, 4 min 12 s pour le banc complet (14 min 23 s avant qu'il tourne
sur quatre files).

## 2. Le relevé, écran par écran

### Fondations

| Écran                         | État     | Ce qui manque                                                                                                                                                                                                                                                                                    |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Les quatre règles             | **fait** | Appliquées ; elles se revérifient écran par écran (§4).                                                                                                                                                                                                                                          |
| Couleurs, typographie, formes | **fait** | —                                                                                                                                                                                                                                                                                                |
| Composants                    | partiel  | Les pièces existent mais sont dispersées : trois `Chip` différents, la bulle du coach écrite cinq fois, `HomeCard` et `Eyebrow` rangés dans l'accueil, l'ancien `Card` encore lu par quatre écrans. Pas de menu ni de bannière « Annuler » au kit.                                               |
| Mouvement, son, vibration     | partiel  | Son : fait. Mouvement : l'appui, la feuille, les dernières secondes, les confettis et les chiffres de fin sont là ; manquent le saut d'une valeur qui change, l'entrée d'une scène, la coche qui se dessine. Vibration : seize appels directs dans sept fichiers, sans réglage ni motifs nommés. |
| Navigation, largeurs, voix    | partiel  | Onglets du client : faits. Coach : trois entrées, pas de « À lire ». Voix : tenue et vérifiée ; le client lit le prénom de son coach.                                                                                                                                                            |

### Séance guidée

| Écran                                    | État     | Ce qui manque                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture, décompte, enchaînement, pause | partiel  | L'écran « Bloc suivant » (trois secondes, sans geste) n'existe pas. La question « Reprendre où tu en étais ? » survit quand on entre par la fiche ; le bandeau « Reprise au bloc 2 » manque.                                                                                                                                 |
| Séries, repos, exercices à durée         | partiel  | Le repos **entre blocs** passe encore par l'ancien minuteur. Pas de ligne « Ensuite ». Chipper et TimeCap n'ont ni chrono de limite ni feuille « Temps écoulé ». On ne peut pas noter un nombre de répétitions différent du prescrit. Grand écran : une boîte centrée, pas les deux colonnes avec le plan et les raccourcis. |
| Blocs chronométrés                       | **fait** | Sauf la disposition grand écran.                                                                                                                                                                                                                                                                                             |
| Échelle                                  | **fait** | Y compris l'API.                                                                                                                                                                                                                                                                                                             |
| Fin de séance                            | **fait** | Sauf « Dire comment c'était » sur l'accueil après un ressenti quitté sans envoyer.                                                                                                                                                                                                                                           |

### Client

| Écran           | État     | Ce qui manque                                                                                                                                                                  |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accueil         | **fait** | Tous les cadres sauf « Réponse du coach non lue », qui attend l'API. Restent aussi « Ensuite dans ton programme » sur grand écran et tirer pour recharger.                     |
| Programme       | à faire  | L'ancien écran : pas de durée, pas de barre de composition, pas d'état « En cours » ni « Modifiée depuis ta dernière fois » en pastille.                                       |
| Fiche de séance | **fait** | Reste la reprise sans question (C1) : la fiche dit « Reprendre », la séance guidée demande encore.                                                                             |
| Progrès         | à faire  | L'ancien historique sous un nouveau nom : pas de records, des suites « 20 → 24 → 26 kg » au lieu de courbes, pas de feuille par mouvement, calendrier sans pastilles d'effort. |
| Mon compte      | partiel  | L'écran actuel, avec le réglage du son. Manquent les vibrations, la déconnexion sur l'écran, et le passage aux composants du kit.                                              |
| Premiers pas    | partiel  | La question des données de santé existe. Les trois cartes de bienvenue et le détail dépliable manquent.                                                                        |

### Coach

| Écran                 | État    | Ce qui manque                                                                                                                                                                                                                    |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| À lire                | à faire | Tout : le fil, les réactions, la réponse, « Ajuster », « Déjà lues ».                                                                                                                                                            |
| Clients               | à faire | Tuiles de tête, anneau et points d'effort par ligne, ligne d'état, étiquettes, panneau d'aperçu, feuille d'invitation.                                                                                                           |
| Atelier d'un client   | à faire | La ligne qui se lit puis s'ouvre, les réglages en pastilles, la palette de formats dessinée, le pouls, le ressenti sous chaque exercice, l'aperçu « vu par le client », l'import d'un modèle, la bande de séances sur téléphone. |
| Les formats de bloc   | partiel | Les dix formats et la limite de l'échelle existent. Manquent les dessins dans la palette et la saisie libre des paliers.                                                                                                         |
| Ressentis d'un client | à faire | L'ancien journal sous son nouveau nom : pas de résumé, pas de « prévu / fait », pas de réponse, et tout l'historique devient lu d'un coup.                                                                                       |
| Modèles               | à faire | Des cartes qui montrent le contenu, l'usage, « Utiliser pour un client », dupliquer.                                                                                                                                             |
| Exercices             | partiel | Création à la frappe et usage : là. Manquent les vignettes, le panneau, le tri « les plus utilisés » en menu.                                                                                                                    |

### Commun

| Écran                   | État    | Ce qui manque                                                                                                                                                                                                                   |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connexion et invitation | partiel | Les trois volets et le tutoiement sont là. Manquent le grand écran en deux volets, « Rejoindre Julie avec ce compte ? » et « Tu es déjà avec Julie ».                                                                           |
| États du système        | partiel | Panne, page introuvable, erreur, mise à jour : faits. Manquent le bandeau hors connexion, le bilan qui part au retour du réseau, « C'est plus long que d'habitude », la règle d'un seul message à la fois (29 appels à relire). |
| Administration          | à faire | Inchangé dans son contenu : seulement à remettre aux composants du kit.                                                                                                                                                         |

### API

| Nouveauté                                                  | État                 |
| ---------------------------------------------------------- | -------------------- |
| Chrono et palier de l'échelle                              | **fait** (`cfee928`) |
| Réponse du coach (réaction, texte, « lue par le client »)  | à faire              |
| Fil « À lire », et marquer lue une séance à la fois        | à faire              |
| Étiquettes de clients                                      | à faire              |
| Régularité dans la liste des clients                       | à faire              |
| Modèles : usage, duplication, « Enregistrer comme modèle » | à faire              |

## 3. Ce que le code doit ranger

Constaté, avec sa mesure.

1. **`GuidedSession.tsx` fait 1 510 lignes** et porte cinq scènes, l'état de
   la séance, la pause, la reprise et une consigne en plein écran.
   `SessionScreen.tsx` (590 lignes) mêle la fiche et tout l'enchaînement de
   fin.
2. **`features/client` a 21 modules et 20 tests à plat**, deux dossiers
   `guided` (la logique pure, et les restes de l'ancien mode) et cinq
   sous-dossiers de composants. On ne sait plus où chercher.
3. **Le kit n'a pas d'adresse.** Pastilles, bulles, cartes et titres vivent
   dans les écrans qui les ont eus en premier. Le coach les réécrirait.
4. **Les frontières fuient** : `shared` importe trois fois une fonctionnalité,
   `account` et `client` s'importent l'un l'autre, le coach importe six fois
   l'intérieur du client. Ce que les deux espaces partagent (nommer une séance,
   l'estimer, lire une dose, un record, un ressenti) n'a pas de lieu neutre.
5. **Deux façons de nommer une séance** : « Séance 2 — Haut du corps » et
   « Haut du corps », selon l'écran.
6. **Les sabotages étaient hors du dépôt** — réglé : 229 cas et leur lanceur
   sont dans `verify/sabotage/`. Vingt-trois ne correspondaient déjà plus au
   code qu'ils devaient casser ; ils sont marqués, à réparer dans la passe
   complète.
7. **Le banc attend à l'aveugle** : 258 attentes à durée fixe, et son décor
   (821 lignes) n'est pas tenu par le contrat de l'API. Sa lenteur est
   réglée : les suites tournent sur quatre files.
8. **Restes de l'ancien mode guidé** : `Timer`, `BlockList`, la question de
   reprise, `PerformedFields`, `SuggestedDays`.
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
- [ ] **B2** `kit/` : `Chip`, `Bubble`, `Card`, `HeroCard`, `Eyebrow`, `Ring`,
      `Dots`, `Segments`, `Stepper`, `Sheet`, `ActionButton`, `LinkButton`,
      `Mascot`, états. Les copies disparaissent, l'ancien `Card` aussi.
- [ ] **B3** Une planche du kit (`/kit`, hors production) que le banc ouvre :
      chaque composant, chaque état.
- [ ] **B4** `domain/` : titre, durée, formats, doses, dessin, dernière fois,
      records, ressenti, semaine. Un seul nom pour une séance.
- [ ] **B5** `features/client` en tranches (`home`, `program`, `sheet`,
      `guided`, `end`, `progress`), tests à côté.
- [ ] **B6** `GuidedSession` découpé : l'état de la séance dans un réducteur
      pur testé, une coquille (haut, segments, pause, écran allumé), une
      scène par forme. `Timer`, `BlockList` et la consigne plein écran
      partent.
- [ ] **B7** `SessionScreen` découpé : la fiche d'un côté, l'enchaînement de
      fin de l'autre, en réducteur pur.
- [ ] **B8** Vibrations et sons sous une seule adresse, motifs nommés,
      réglage « Vibrations » masqué là où le téléphone n'en a pas.
- [ ] **B9** Les frontières dans ESLint ; `shared` ne lit plus aucune
      fonctionnalité.
- [ ] **B10** Banc : attendre un état plutôt qu'une durée (les 258), décor
      typé par le contrat. (Les files parallèles sont faites.)
- [ ] **B11** `features/program` devient `features/workshop`, sans rien
      changer d'autre : le lot D le réécrit.
- [ ] **B12** Passe complète des sabotages : réparer les cas marqués, les
      rejouer tous, corriger les assertions creuses qu'ils montrent.

### C. Finir la séance guidée

- [ ] **C1** Reprise sans question : la fiche et l'accueil mènent droit à la
      série, bandeau « Reprise au bloc 2 » trois secondes.
- [ ] **C2** « Bloc suivant », trois secondes sans geste ; le repos entre
      blocs sur la scène de repos ; la ligne « Ensuite ».
- [ ] **C3** Chipper et TimeCap : chrono de limite, feuille « Temps écoulé ».
- [ ] **C4** Noter des répétitions différentes du prescrit.
- [ ] **C5** « Dire comment c'était » : un ressenti quitté sans envoyer se
      retrouve sur l'accueil, et part quand le réseau revient.
- [ ] **C6** Grand écran : deux colonnes, le plan de la séance, les
      raccourcis clavier.

### D. L'API du coach (avant le front qui s'en sert)

- [ ] **D1** Les cinq `verify:*` sous Vitest ; les agrégations de
      `roster.controller` dans un service ; `CLAUDE.md` à jour.
- [ ] **D2** Réponse du coach : réaction, texte, date, « lue par le client ».
      Une route pour écrire, une pour marquer lue.
- [ ] **D3** Fil « À lire » : les séances non lues de tous les clients, avec
      ce qui a été fait et le passage d'avant ; lue à l'unité.
- [x] **D4** Le prénom du coach dans le programme du client.
- [ ] **D5** Étiquettes de clients : créer, renommer, supprimer, rattacher.
- [ ] **D6** Liste des clients : séances de la semaine et cinq derniers
      ressentis par client.
- [ ] **D7** Modèles : compteur d'imports, dupliquer, « Enregistrer comme
      modèle ».

### E. Le coach

- [ ] **E1** Navigation : quatre onglets, « À lire » en premier avec son
      compteur, rail de 76 puis 232 px, replié dans l'atelier.
- [ ] **E2** « À lire » : le fil et son ordre, les cartes repliées, « Tout
      est lu », « Déjà lues ».
- [ ] **E3** « À lire » : réagir, répondre, marquer lue en glissant avec
      « Annuler », « Ajuster », panneau de droite.
- [ ] **E4** La réponse chez le client : bulle sur l'accueil et dans Progrès,
      « Nouveau », « Julie ne l'a pas encore lue », « Envoyer à Julie ».
- [ ] **E5** Atelier, lire : une ligne se lit puis s'ouvre, réglages dessous
      ou en feuille, en-tête de bloc en pastilles, menu d'un bloc.
- [ ] **E6** Atelier, ajouter : palette de formats dessinée, « + exercice »
      qui cherche puis crée, fiche d'exercice à la place de l'aperçu, saisie
      libre des paliers.
- [ ] **E7** Atelier, les séances : rail (durée, jours, composition, cinq
      ressentis), glisser, menu, bande sur téléphone.
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

Aucun n'est un choix : les deux qui restent attendent leur ligne du plan.

- **Le jour fait s'ouvre sur place**, dans un tiroir — tant que Progrès n'a
  pas son détail (F3).
- **La fiche dit « Reprendre », et la séance guidée demande encore** —
  jusqu'à C1.

Tranché le 16 novembre : la série en cours garde le bloc entier sous elle.
Ce n'est plus un écart, c'est la maquette qui a changé — son chapitre
« Séries, repos, exercices à durée » montre désormais la liste du bloc.
