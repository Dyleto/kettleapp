/**
 * Le contrat vendu ici est-il celui que l'API publie ?
 *
 * Le fichier `src/shared/types/contract.ts` est engendré par l'autre dépôt.
 * Il est versionné ici — c'est une dépendance de données, et elle doit se
 * relire dans une revue — mais rien n'empêche l'API d'avancer sans lui.
 *
 * La comparaison se fait à l'octet, et c'est voulu : les deux copies sortent
 * du même générateur, aucun formateur n'y touche, donc toute différence est
 * une différence de contrat.
 *
 * Elle n'a lieu que si le dépôt de l'API est à côté. La CI n'a pas les deux,
 * et aller chercher le fichier sur GitHub ferait échouer ce dépôt pour un
 * décalage de l'autre pendant un déploiement — l'API partant toujours la
 * première. Faute du voisin, on dit l'empreinte et l'on se taît : annoncer un
 * vert qu'on n'a pas vérifié serait pire que de ne rien annoncer.
 *
 *   node scripts/contract-check.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const VENDORED = join(here, '..', 'src', 'shared', 'types', 'contract.ts');
const UPSTREAM = join(
  here,
  '..',
  '..',
  'kettleapp-api',
  'contract',
  'kettle-contract.ts'
);

const fingerprint = (source) =>
  source.match(/Empreinte : ([0-9a-f]{12})/)?.[1] ?? '(absente)';

const vendored = readFileSync(VENDORED, 'utf8');

if (!existsSync(UPSTREAM)) {
  console.log(
    `contrat vendu : empreinte ${fingerprint(vendored)}\n` +
      "kettleapp-api n'est pas à côté : rien à comparer."
  );
  process.exit(0);
}

const upstream = readFileSync(UPSTREAM, 'utf8');

if (vendored === upstream) {
  console.log(`contrat à jour (empreinte ${fingerprint(vendored)})`);
  process.exit(0);
}

console.error(
  `contrat périmé : ici ${fingerprint(vendored)}, API ${fingerprint(upstream)}.\n` +
    'Relancer `npm run contract:build` côté API, puis recopier\n' +
    'contract/kettle-contract.ts dans src/shared/types/contract.ts.'
);
process.exit(1);
