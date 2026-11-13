/**
 * Les polices du produit sont-elles dans le cache du service worker ?
 *
 * La séance guidée doit fonctionner sans réseau, et c'est la raison pour
 * laquelle les polices sont servies par l'application. Mais les servir ne
 * suffit pas : Workbox ne précache par défaut que js, css et html, et le
 * premier paquet construit avec ces polices n'en retenait aucune. Hors
 * connexion, l'application retombait sur la police du système sans que rien
 * ne le signale — ni le typage, ni le banc, qui tourne en ligne.
 *
 * On lit donc le service worker construit, et l'on exige deux choses :
 *
 * - les deux sous-ensembles « latin » y sont, puisqu'ils couvrent tout le
 *   français ;
 * - eux seuls y sont. Les sous-ensembles étendu et vietnamien ne servent
 *   qu'à des caractères que l'interface n'écrit pas : les précacher ferait
 *   payer leur poids à chaque installation, pour rien.
 *
 * À lancer après `npm run build`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const SERVICE_WORKER = 'dist/sw.js';
const ASSETS = 'dist/assets';

if (!existsSync(SERVICE_WORKER)) {
  console.log(
    `${SERVICE_WORKER} est absent : lancer « npm run build » d'abord.`
  );
  process.exit(2);
}

/** Les deux fichiers attendus, reconnus à leur nom sans leur empreinte. */
const REQUIRED = [
  { label: 'la police de texte', pattern: /^figtree-latin-wght-normal-/ },
  {
    label: 'la police de titre',
    pattern: /^bricolage-grotesque-latin-wdth-normal-/,
  },
];

const serviceWorker = readFileSync(SERVICE_WORKER, 'utf8');
const fonts = readdirSync(ASSETS).filter((file) => file.endsWith('.woff2'));
const precached = fonts.filter((file) =>
  serviceWorker.includes(`assets/${file}`)
);

const problems = [];

for (const { label, pattern } of REQUIRED) {
  const file = fonts.find((name) => pattern.test(name));
  if (!file) {
    problems.push(`${label} n'est pas dans le paquet construit`);
  } else if (!precached.includes(file)) {
    problems.push(`${label} n'est pas précachée (${file})`);
  }
}

const extras = precached.filter(
  (file) => !REQUIRED.some(({ pattern }) => pattern.test(file))
);
if (extras.length > 0) {
  problems.push(
    `des polices inutiles au français sont précachées : ${extras.join(', ')}`
  );
}

if (problems.length > 0) {
  console.log('Le cache hors connexion ne tient pas sa promesse :');
  problems.forEach((problem) => console.log(`  - ${problem}`));
  process.exit(1);
}

console.log(
  `Les ${precached.length} polices du produit sont précachées, et elles seules.`
);
