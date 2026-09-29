/**
 * Comment une série notée se relit.
 *
 * Le travail d'abord, la charge ensuite — « 12 reps · 26 kg », l'ordre dans
 * lequel on le dit à voix haute. La charge menait autrefois, ce qui se lisait
 * « 26 kg × 12 » : le nombre qu'on a réellement fait arrivait en dernier,
 * derrière le nombre qu'on a choisi.
 *
 * Quatre formes, et une traîne de cas où l'une des deux valeurs manque. C'est
 * du formatage de chaîne pur, vérifié ici plutôt qu'à travers un navigateur :
 * une suite qui mènerait l'application pour relire une ligne coûterait trente
 * secondes à prouver ce qu'un appel de fonction prouve en une milliseconde.
 *
 * Ce qui justifie une suite à part entière : ces formes cassent en silence.
 * Rien ne plante quand « 3 × 26 kg » se met à vouloir dire trois répétitions
 * au lieu de trois séries — cela dit simplement quelque chose de faux, sans
 * bruit.
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ok, failureCount } from './common.mjs';

// Le formateur est en TypeScript, et ce banc est du Node nu : on empaquette
// le seul module plutôt que de traîner tout un lanceur de tests pour lui.
const dir = mkdtempSync(join(tmpdir(), 'kettle-format-'));
const out = join(dir, 'performedFormat.mjs');
await build({
  entryPoints: ['../src/features/client/performedFormat.ts'],
  bundle: true,
  format: 'esm',
  outfile: out,
  logLevel: 'silent',
});
const { formatPerformedSets: format } = await import(out);

// Compare ce que le formateur écrit à ce qu'on attend, et montre les deux :
// une assertion qui tombe sans dire ce qu'elle a lu oblige à relancer.
const reads = (label, sets, expected) =>
  ok(
    label,
    format(sets) === expected,
    JSON.stringify(format(sets)) + ' vs ' + JSON.stringify(expected)
  );

// ── Les quatre formes ───────────────────────────────────────────────────
console.log('\n── le travail mène, la charge suit');
reads('une série', [{ weight: 26, reps: 12 }], '12 reps · 26 kg');
reads(
  '  → plusieurs séries identiques : le compte mène le travail',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
  ],
  '3 × 12 reps · 26 kg'
);
reads(
  '  → même charge, moins de reps à chaque fois',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 10 },
    { weight: 26, reps: 8 },
  ],
  '12 + 10 + 8 reps · 26 kg'
);
reads(
  '  → tout le reste, série par série',
  [
    { weight: 26, reps: 12 },
    { weight: 24, reps: 10 },
  ],
  '12 × 26 kg · 10 × 24 kg'
);

// ── Le compte et les reps ne doivent jamais se confondre ────────────────
//
// C'est ce que paie le mot « reps ». Avec le travail devant la charge, un
// nombre nu avant une charge veut dire des répétitions — un compte de séries
// à cette place doit donc nommer sa propre unité, sans quoi « 3 × 26 kg »
// annonce trois répétitions à 26 kg quand trois séries ont été faites.
console.log('\n── un nombre avant une charge veut toujours dire des reps');
reads('une charge tenue, une série', [{ weight: 26 }], '26 kg');
reads(
  '  → la même charge sur trois séries dit « séries »',
  [{ weight: 26 }, { weight: 26 }, { weight: 26 }],
  '3 séries · 26 kg'
);
reads(
  '  → et trois séries de douze reste un compte de séries',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
  ],
  '3 × 12 reps · 26 kg'
);

// ── L'une des deux manque ───────────────────────────────────────────────
console.log("\n── ce qui n'a pas été noté ne s'invente pas");
reads('des reps sans charge', [{ reps: 12 }], '12 reps');
reads(
  '  → sur trois séries',
  [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
  '3 × 12 reps'
);
reads('un exercice chronométré', [{ duration: 45, weight: 16 }], '45s · 16 kg');
reads(
  '  → chronométré, sans charge',
  [{ duration: 45 }, { duration: 45 }, { duration: 45 }],
  '3 × 45s'
);
reads('rien du tout', [], null);
reads('  → une série vide ne dit rien non plus', [{}], null);

// ── Une série vide tronque ──────────────────────────────────────────────
console.log("\n── une série vide arrête là l'exercice");
reads(
  "ce qui suit une série vide n'a pas eu lieu",
  [{ weight: 26, reps: 12 }, {}, { weight: 99, reps: 99 }],
  '12 reps · 26 kg'
);
reads(
  '  → un nombre de reps manquant dans une série reste ouvert',
  [{ weight: 26, reps: 12 }, { weight: 26 }],
  '12 + — reps · 26 kg'
);

process.exit(failureCount() ? 1 : 0);
