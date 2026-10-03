/**
 * La règle de langue, vérifiée plutôt que surveillée.
 *
 * Elle est simple à énoncer — tout commentaire en français — et je l'ai
 * annoncée tenue trois fois sans qu'elle le soit. À chaque fois le détecteur
 * que j'improvisais avait un angle mort :
 *
 *   1. « on » compte comme un mot français : tout bloc anglais contenant
 *      « on the screen » passait pour traduit. 571 blocs, pas 352.
 *   2. Le seuil de trois mots anglais laissait passer les commentaires d'une
 *      ligne : « Checks an invitation token. » n'en a qu'un. 83 blocs.
 *   3. Un commentaire anglais qui cite un libellé français — « 7 séances sur
 *      2 déjà faites » — porte un accent, et l'accent concluait au français.
 *
 * D'où ce script, et sa place dans la CI : une règle qu'on vérifie à la main
 * est une règle qu'on croit tenue.
 *
 * Ce qu'il fait, dans l'ordre : retirer du bloc ce qui est cité — entre
 * guillemets de toutes sortes, et le code entre accents graves — puis
 * chercher dans ce qui reste un mot anglais et aucune marque de français.
 * Ce qui est cité n'est pas de la prose : un commentaire français cite des
 * libellés français, un commentaire anglais cite les mêmes.
 *
 *   node scripts/audit-langue.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

// Le contrat est engendré par l'autre dépôt : ses commentaires lui
// appartiennent, et les réécrire ici les ferait disparaître à la prochaine
// génération.
const EXCLUS = [
  'node_modules',
  'dist',
  'src/shared/types/contract.ts',
  'verif/node_modules',
];

const BLOC = /\/\*\*?[\s\S]*?\*\/|(?:^[ \t]*\/\/[^\n]*\n)+/gm;

/**
 * Des mots qui n'existent qu'en anglais.
 *
 * Les verbes courts sont là pour les commentaires d'une ligne, qui sont
 * presque toujours de la forme « Checks … », « Returns … », « Opens … » : ce
 * sont eux qui avaient échappé au seuil.
 */
const ANGLAIS =
  /\b(the|and|that|with|which|this|from|when|what|would|never|only|because|instead|its|it's|are|was|were|does|not|but|for|has|have|here|there|they|them|their|your|each|every|same|then|than|into|about|before|after|while|whether|checks?|returns?|uses?|used|needs?|gets?|sets?|makes?|builds?|sends?|reads?|writes?|keeps?|shows?|opens?|closes?|adds?|removes?|fetch(es)?|wraps?|handles?|counts?|counting|carries|carry|says?|saying|value|values|one|two|all|any|also|still|just|per|via|nobody|something|anything|without)\b/i;

/**
 * Ce qui ne s'écrit qu'en français.
 *
 * Un accent, un guillemet français, une élision. Pas « on », pas « plus »,
 * pas « son » : ils s'écrivent aussi en anglais, et c'est le premier angle
 * mort qui m'a coûté deux cents blocs.
 */
const FRANCAIS =
  /[àâäçéèêëîïôöûùüœÀÂÇÉÈÊËÎÏÔÛÙ]|[«»]|\b(le|les|une|des|du|aux|cette|qui|que|pas|pour|dans|avec|sans|donc|mais|toute|elle|leur|ne|est|ces|deux|rien|quand|parce|son|sa|ses|au|ce|il|et|ou|un|la|se)\b|\b[ldqsjnmct]'/;

/**
 * La seconde règle, et la plus solide : de la prose sans aucune marque de
 * français.
 *
 * `ANGLAIS` est une liste, donc incomplète par construction — quatrième angle
 * mort, trouvé en relisant `ClientsList.tsx`. Le commentaire
 * « "il y a 3 semaines", in a single grammar. » ne contient, citation retirée,
 * aucun mot de la liste : ni « in », ni « a », ni « single », ni « grammar ».
 * Il passait, et le script annonçait la règle tenue.
 *
 * La règle du projet n'est pas « pas d'anglais », c'est « en français ». On
 * vérifie donc le français, qui est ce qu'on exige — et un bloc de prose
 * française porte toujours quelque chose : un accent, un guillemet, une
 * élision, un mot courant.
 *
 * Le seuil de six mots épargne ce qui n'est pas de la prose : une directive,
 * une adresse, un nom de fichier, une commande à copier.
 */
const PROSE_MINIMALE = 6;

/** Ce qui n'est pas de la prose et n'a pas à l'être. */
const TECHNIQUE =
  /eslint|ts-(expect|ignore|nocheck)|prettier-ignore|https?:\/\/|^\s*[\w./@-]+\s*$/;

const motsDeProse = (nu) =>
  (
    nu
      .replace(/^[ \t]*(?:\/\*+|\*+\/?|\/\/)/gm, ' ')
      .match(/[A-Za-zÀ-ÿ]{2,}/g) ?? []
  ).length;

/** Ce qui est cité n'est pas de la prose : on le retire avant de juger. */
const sansCitations = (bloc) =>
  bloc
    .replace(/«[^»]*»/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/'[^'\n]{2,}'/g, ' ');

const fichiers = [];
const parcourir = (chemin) => {
  for (const entree of readdirSync(chemin)) {
    const complet = join(chemin, entree);
    const relatif = relative(RACINE, complet);
    if (EXCLUS.some((e) => relatif === e || relatif.startsWith(e + '/')))
      continue;
    if (statSync(complet).isDirectory()) parcourir(complet);
    else if (/\.(ts|tsx|mjs)$/.test(entree)) fichiers.push(complet);
  }
};
for (const racine of ['src', 'verif', 'scripts'])
  parcourir(join(RACINE, racine));

const trouves = [];
for (const fichier of fichiers) {
  const contenu = readFileSync(fichier, 'utf8');
  for (const trouve of contenu.matchAll(BLOC)) {
    const nu = sansCitations(trouve[0]);
    const suspect =
      (ANGLAIS.test(nu) || motsDeProse(nu) >= PROSE_MINIMALE) &&
      !TECHNIQUE.test(nu);
    if (suspect && !FRANCAIS.test(nu)) {
      trouves.push({
        fichier: relative(RACINE, fichier),
        ligne: contenu.slice(0, trouve.index).split('\n').length,
        extrait: trouve[0].trim().split('\n')[0].slice(0, 80),
      });
    }
  }
}

if (trouves.length === 0) {
  console.log(`${fichiers.length} fichiers : aucun commentaire anglais.`);
  process.exit(0);
}

for (const { fichier, ligne, extrait } of trouves) {
  console.error(`${fichier}:${ligne}  ${extrait}`);
}
console.error(
  `\n${trouves.length} commentaire(s) anglais. La règle du projet les veut en français.`
);
process.exit(1);
