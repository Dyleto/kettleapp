# Kettle — conventions du projet

## La règle de langue

Elle est fixe et ne se discute pas au cas par cas.

| Ce dont il s'agit | Langue |
|---|---|
| Tout ce qui est technique — identifiants, types, noms de fichiers, de dossiers, de branches, de scripts npm | **anglais** |
| **Tous** les commentaires, y compris les blocs de documentation en tête de fichier | **français** |
| Tout texte affiché au client ou au coach — libellés, `aria-label`, messages d'erreur, titres de page | **français** |

Pourquoi cette répartition : le code s'écrit dans la langue de son écosystème,
les commentaires dans celle de l'équipe qui les lit, et l'interface dans celle
des personnes qui s'en servent. Kettle s'adresse à des francophones.

Un commentaire peut donc citer un libellé français sans que cela pose de
question, et un identifiant ne porte jamais d'accent.

`npm run lint:langue` vérifie la règle plutôt que de la surveiller, et la CI
l'appelle. Elle a été annoncée tenue trois fois sans l'être, à cause de trois
angles morts du détecteur : « on » qui compte comme un mot français, un seuil
de trois mots anglais qui laissait passer les commentaires d'une ligne, et un
commentaire anglais citant un libellé français — dont l'accent concluait au
français. Le script retire ce qui est cité avant de juger.

## Les commentaires

Chaque fonction, méthode, composant et hook exporté porte un commentaire qui
dit **pourquoi**, pas ce que le code fait déjà lire. Un nom bien choisi dit le
quoi ; le commentaire sert à ce que le code ne peut pas dire : la contrainte
qui a imposé cette forme, le défaut que cela répare, le piège qui attend celui
qui voudra simplifier.

Ce qui vaut d'être écrit :

- ce qu'on a essayé avant et pourquoi ça ne marchait pas ;
- une mesure (« mesuré : 5,4 Ko pour cinq séances ») plutôt qu'une impression ;
- un retour du terrain, cité tel quel ;
- la raison d'un choix qui paraîtra arbitraire dans six mois.

Ce qui ne vaut pas la peine : paraphraser la ligne suivante.

## Les types viennent de l'API

`src/shared/types/contract.ts` est engendré par kettleapp-api depuis les
schémas Zod qu'il applique à ses réponses. Ne pas le modifier à la main : cela
ne changerait rien à ce que l'API envoie, cela ferait seulement mentir les
types.

Pour le mettre à jour : `npm run contract:build` côté API, puis recopier
`contract/kettle-contract.ts` ici. `npm run contract:check` compare les deux
copies à l'octet quand le dépôt de l'API est à côté ; aucun formateur ne doit
toucher au fichier, c'est cette identité qui rend la comparaison possible.

`src/shared/types/index.ts` ne décrit plus rien : il nomme. Chaque type du
produit — `Session`, `Client`, `CompletedSession` — est un alias d'un type du
contrat. Un type écrit à la main ici serait une seconde description de la même
chose, et les deux divergeraient : c'est déjà arrivé, sur un `endDate` que
l'API n'a jamais envoyé et sur des `Date` qui sont des chaînes.

## La discipline de vérification

Un vert ne vaut que si on l'a cassé. Pour chaque mécanisme vérifié, on le
sabote dans le code et on s'assure que l'assertion qui le couvre tombe — et
elle seule. Une assertion qui reste verte quand le mécanisme est cassé ne
vérifie pas ce qu'elle prétend.

Un script de sabotage doit vérifier qu'il a bien saboté quelque chose. Un
motif qui ne correspond plus — parce que le formateur est passé, par exemple —
laisse croire que l'assertion est creuse alors que rien n'a été cassé.

## Les deux niveaux de vérification

`npm test` (Vitest) éprouve la logique pure, sans navigateur : quelques
secondes. `npm run verify` mène l'application dans un vrai navigateur :
quelques minutes.

Ils ne se remplacent pas. Le banc attrape ce que l'écran fait — un bouton
sorti de l'écran, un repos qui cache un bloc, une séance qui cesse
d'enregistrer. Vitest attrape ce que les fonctions décident, sur des cas qui
ne se construisent pas par l'écran : une séance sans bloc, deux bilans à la
seconde près, une renumérotation de rangs.

Aucun test unitaire ne monte de composant : ce serait reconstituer un
navigateur en moins fidèle, et le banc est là pour cela.

Les décors de test (`fixtures.ts`) sont déterminés : deux décors par défaut
sont identiques. Un identifiant engendré par un compteur avait rendu vaines
des assertions entières — elles constataient un écart d'identifiant, pas
celui qu'elles visaient, et un sabotage ne les faisait pas tomber.

## Le banc d'essai

`verif/` mène l'application dans un vrai navigateur et lit ce qu'elle affiche.
`npm run verify` lance toutes les suites ; il faut que le front tourne
(`npx vite`). Voir `verif/README.md`.

## Ce qui garde le projet

La CI (`.github/workflows/ci.yml`) lance à chaque poussée : `typecheck`,
`lint` (strict, zéro avertissement), `format:check`, `build`, et le banc au
complet. Rien ne doit être fusionné sur une CI rouge.
