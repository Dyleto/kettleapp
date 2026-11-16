/**
 * Le lanceur de sabotages : il casse un mécanisme à la fois, et relève ce
 * qui tombe dans la suite du banc qui le couvre.
 *
 * « Un vert ne vaut que si on l'a cassé. » Une assertion qui reste verte
 * quand son mécanisme est saboté ne vérifie pas ce qu'elle prétend ; une
 * assertion qui tombe à côté dit que deux choses se tiennent sans qu'on
 * l'ait voulu. Chaque cas nomme donc ce qu'il casse, comment, et ce qui
 * doit tomber — exactement cela, et rien d'autre.
 *
 * Ce lanceur et ses cas vivaient hors du dépôt, dans le dossier temporaire
 * d'une session : la règle ne se vérifiait que par qui avait ce dossier, et
 * se perdait avec lui.
 *
 * Usage :
 *   node verify/sabotage/run.mjs <suite> [rangs…]   rejoue les cas d'une suite
 *   node verify/sabotage/run.mjs --check            vérifie tous les motifs
 *
 * `--check` n'ouvre aucun navigateur : il s'assure que chaque motif désigne
 * encore un endroit du code, et un seul, et que chaque libellé attendu
 * existe dans sa suite. Un motif qui ne correspond plus — le formateur est
 * passé, le fichier a bougé — laisserait croire qu'une assertion est creuse
 * alors que rien n'a été cassé.
 *
 * Un cas marqué `stale` est une dette connue : son motif ne correspondait
 * déjà plus le jour où les cas sont entrés dans le dépôt. Il ne se rejoue
 * pas et `--check` le compte à part, jusqu'à ce qu'on le répare — on retire
 * alors la marque.
 *
 * Les cas ne se rejouent plus à chaque changement : rejouer les 226 prend
 * plusieurs heures. Ils s'écrivent avec le mécanisme qu'ils couvrent, et se
 * rejouent tous en une passe avant une fusion sur `main`.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const HERE = import.meta.dirname;
const ROOT = join(HERE, '..', '..');
const VERIFY = join(HERE, '..');

const load = async (name) => {
  const file = name.replace(/^verify_/, '').replace(/\.mjs$/, '');
  return (await import(join(HERE, 'cases', `${file}.mjs`))).default;
};

const count = (text, pattern) => text.split(pattern).length - 1;

/** Les défauts d'un fichier de cas, sans rien lancer. */
const defects = (set) => {
  const found = [];
  const suite = readFileSync(join(VERIFY, set.suite), 'utf8');
  set.cases.forEach((c, rank) => {
    if (c.stale) return;
    c.edits.forEach(({ file, from, to }) => {
      let source;
      try {
        source = readFileSync(join(ROOT, file), 'utf8');
      } catch {
        found.push(`[${rank}] ${c.name} : ${file} n'existe plus`);
        return;
      }
      const hits = count(source, from);
      if (hits !== 1)
        found.push(
          `[${rank}] ${c.name} : le motif correspond ${hits} fois dans ${file} — ${JSON.stringify(from.slice(0, 60))}`
        );
      if (from === to)
        found.push(`[${rank}] ${c.name} : le sabotage ne change rien`);
    });
    // Un libellé entier, entre ses guillemets, et non un morceau de
    // libellé : le lanceur compare ce qui tombe au mot près, et un libellé
    // allongé depuis (« … ouvre la séance, sous son prénom ») passait ce
    // contrôle tout en ne pouvant plus jamais tomber comme attendu.
    c.falls.forEach((label) => {
      // Le lanceur lit les échecs sans leurs espaces de tête : un libellé
      // attendu qui les garde (« ··→ et l'autre aussi ») ne tombe jamais
      // comme attendu, et le cas passerait pour faux alors qu'il est juste.
      if (label !== label.trim())
        found.push(
          `[${rank}] ${c.name} : « ${label} » garde des espaces autour, que le lanceur ne voit pas`
        );
      const quoted = new RegExp(
        `(['"\`])\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`
      );
      if (!quoted.test(suite))
        found.push(
          `[${rank}] ${c.name} : « ${label} » n'est pas un libellé entier de ${set.suite}`
        );
    });
  });
  return found;
};

/** Lance la suite et rend ce qui est tombé. */
const run = (suite) => {
  const r = spawnSync('node', ['runner.mjs', suite], {
    cwd: VERIFY,
    encoding: 'utf8',
    timeout: 900_000,
  });
  const out = r.stdout ?? '';
  const tally = out.match(/(\d+) OK · (\d+) FAIL/);
  // Une suite qui n'a pas tourné ne prouve rien : ni qu'une assertion est
  // tombée, ni qu'elle a tenu.
  if (!tally) throw new Error(`la suite n'a pas tourné :\n${out.slice(-800)}`);
  return {
    passed: Number(tally[1]),
    crashed: out.includes('planté'),
    fallen: out
      .split('\n')
      .filter((line) => line.trim().startsWith('FAIL'))
      .map((line) =>
        line
          .replace(/^\s*FAIL\s+/, '')
          .split(' — ')[0]
          .trim()
      ),
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sameSet = (a, b) =>
  a.length === b.length &&
  [...a].sort().join('\n') === [...b].sort().join('\n');

if (process.argv[2] === '--check') {
  const files = readdirSync(join(HERE, 'cases')).filter((f) =>
    f.endsWith('.mjs')
  );
  let total = 0;
  let bad = 0;
  let stale = 0;
  for (const file of files) {
    const set = (await import(join(HERE, 'cases', file))).default;
    total += set.cases.length;
    stale += set.cases.filter((c) => c.stale).length;
    const found = defects(set);
    bad += found.length;
    found.forEach((line) => console.log(`${file} ${line}`));
  }
  console.log(
    bad
      ? `${bad} défaut(s) dans ${total} sabotages.`
      : `${total} sabotages dans ${files.length} fichiers : chaque motif désigne un endroit du code, et un seul` +
          (stale ? ` — sauf ${stale} périmés, à réparer.` : '.')
  );
  process.exit(bad ? 1 : 0);
}

const [name, ...ranks] = process.argv.slice(2);
if (!name) {
  console.log(
    'Usage : node verify/sabotage/run.mjs <suite> [rangs…] | --check'
  );
  process.exit(2);
}
const set = await load(name);
const stale = defects(set).filter(
  (line) => !ranks.length || ranks.some((r) => line.startsWith(`[${r}]`))
);
if (stale.length) {
  stale.forEach((line) => console.log(line));
  process.exit(1);
}

let unexpected = 0;
for (const [rank, c] of set.cases.entries()) {
  if (ranks.length && !ranks.includes(String(rank))) continue;
  if (c.stale) {
    console.log(`[${rank}] ${c.name} → périmé, non rejoué : ${c.stale}`);
    continue;
  }
  const originals = new Map();
  let result;
  try {
    for (const { file, from, to } of c.edits) {
      const path = join(ROOT, file);
      const source = readFileSync(path, 'utf8');
      if (!originals.has(path)) originals.set(path, source);
      writeFileSync(
        path,
        source.replace(from, () => to)
      );
    }
    // Le serveur de développement doit avoir vu le changement.
    await sleep(2500);
    result = run(set.suite);
  } finally {
    for (const [path, source] of originals) writeFileSync(path, source);
    await sleep(1500);
  }
  const asExpected = sameSet(result.fallen, c.falls) && !result.crashed;
  if (!asExpected) unexpected += 1;
  console.log(
    `[${rank}] ${c.name} → ${result.passed} OK, ${result.fallen.length} FAIL${result.crashed ? ' (PLANTÉ)' : ''} (${asExpected ? 'attendu' : 'INATTENDU'})`
  );
  result.fallen.forEach((label) =>
    console.log(
      c.falls.includes(label)
        ? `      · ${label}`
        : `      ✗ en trop : ${label}`
    )
  );
  c.falls
    .filter((label) => !result.fallen.includes(label))
    .forEach((label) => console.log(`      ✗ manque : ${label}`));
}

// Tout est restauré : la suite doit être revenue au vert, sans quoi c'est
// le lanceur lui-même qui a laissé quelque chose de cassé.
const after = run(set.suite);
console.log(`restauré → ${after.passed} OK, ${after.fallen.length} FAIL`);
process.exit(unexpected || after.fallen.length || after.crashed ? 1 : 0);
