/**
 * Lance chaque suite avec un serveur d'essai neuf.
 *
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait en silence à s'y attacher, et chaque suite tournerait contre un
 * état déjà modifié. C'est exactement le faux échec qu'on cherche à éviter.
 */
import { execSync, spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';

/**
 * `--all` lance toutes les suites du dossier.
 *
 * Les nommer explicitement est juste quand on travaille sur l'une d'elles, et
 * faux pour la CI : une suite ajoutée puis oubliée dans une liste écrite à la
 * main est une suite qui ne tourne plus jamais, et rien ne le dit. Lire le
 * dossier fait qu'un nouveau fichier `verify_*.mjs` est couvert dès qu'il
 * existe.
 */
const asked = process.argv.slice(2);
const suites = asked.includes('--all')
  ? readdirSync(import.meta.dirname)
      .filter((f) => /^verify_.+\.mjs$/.test(f))
      .sort()
  : asked;
const results = [];

/** Le serveur d'essai répond-il ? Un statut, quel qu'il soit, suffit : on
 * demande s'il y a quelqu'un, pas s'il est content. */
const ping = async () => {
  try {
    const r = await fetch('http://localhost:3001/api/auth/me', {
      redirect: 'manual',
    });
    return r.status > 0;
  } catch {
    return false;
  }
};

/**
 * Libère le port 3001, en tuant s'il le faut ce qui l'occupe.
 *
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait en silence à s'y attacher, et chaque suite tournerait contre un
 * état déjà modifié. C'est le faux échec qu'on cherche à éviter.
 *
 * On y met fin plutôt que d'abandonner : c'est notre propre serveur, il
 * n'appartient à personne d'autre, et échouer dessus ne faisait que redemander
 * la même commande une seconde fois.
 */
const ensureFree = async () => {
  if (!(await ping())) return;
  // Le motif est ancré sur toute la ligne de commande : un motif relâché se
  // reconnaît dans le shell qui l'invoque, et tue son propre appelant.
  try {
    const pids = execSync('pgrep -f "^node mock-server\\.mjs$" || true', {
      encoding: 'utf8',
    })
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\d+$/.test(l) && Number(l) !== process.pid);
    pids.forEach((pid) => {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        // Déjà parti entre le relevé et le signal.
      }
    });
  } catch {
    // Pas de pgrep : on se rabat sur l'attente.
  }
  for (let i = 0; i < 20; i++) {
    await wait(300);
    if (!(await ping())) return;
  }
  throw new Error('le port 3001 reste occupé et refuse de céder');
};

/** Démarre le serveur d'essai et attend qu'il réponde : le lancer sans
 * attendre ferait échouer la première requête de la suite. */
const startMock = async () => {
  await ensureFree();
  const p = spawn('node', ['mock-server.mjs'], {
    cwd: import.meta.dirname,
    stdio: 'ignore',
  });
  for (let i = 0; i < 40; i++) {
    await wait(150);
    if (await ping()) return p;
  }
  throw new Error("le serveur d'essai ne répond pas");
};

/**
 * Le front doit tourner, et le dire une fois vaut mieux qu'échouer dix fois.
 *
 * Sans cela, chaque suite meurt dans `signIn` sur un délai de navigation
 * dépassé, et la sortie est faite de dix traces d'appels qui nomment
 * Playwright plutôt que le serveur absent. La cause tient en une ligne ; elle
 * doit se lire en une ligne.
 */
const FRONT = process.env.KETTLE_BASE ?? 'http://localhost:5173';
try {
  const r = await fetch(FRONT, { redirect: 'manual' });
  if (!(r.status > 0)) throw new Error('pas de réponse');
} catch {
  console.log(
    `\nLe front ne répond pas sur ${FRONT}.\n` +
      "Lance-le d'abord (npx vite), ou définis KETTLE_BASE."
  );
  process.exit(2);
}

for (const suite of suites) {
  const mock = await startMock();
  const out = await new Promise((resolve) => {
    let buf = '';
    const c = spawn('node', [suite], { cwd: import.meta.dirname });
    c.stdout.on('data', (d) => (buf += d));
    c.stderr.on('data', (d) => (buf += d));
    c.on('close', (code) => resolve({ buf, code }));
  });
  mock.kill('SIGKILL');
  await wait(300);

  const okCount = (out.buf.match(/^OK/gm) ?? []).length;
  const failLines = out.buf.match(/^FAIL.*$/gm) ?? [];
  const summary = `${okCount} OK · ${failLines.length} FAIL`;
  results.push({ suite, summary, failLines, code: out.code });
  console.log(
    `${failLines.length === 0 && out.code === 0 ? '✓' : '✗'} ${suite.padEnd(22)} ${summary}`
  );
  failLines.forEach((l) => console.log('    ' + l));
  // Un code non nul sans une seule ligne FAIL est un plantage : la suite
  // s'est arrêtée en chemin et le résumé ne dit pas pourquoi. On le montre.
  if (out.code !== 0 && failLines.length === 0) {
    const lines = out.buf.trimEnd().split('\n');
    console.log(`    ─ planté (code ${out.code}), fin de la sortie :`);
    lines.slice(-12).forEach((l) => console.log('    │ ' + l));
  }
}

// Lancer le lanceur sans nommer de suite ne lance rien du tout, et annoncer
// « tout est vert » pour zéro suite est le seul résultat auquel il ne faut
// jamais se fier.
if (suites.length === 0) {
  console.log(
    '\nAucune suite nommée. Usage : node runner.mjs --all | verify_recap.mjs [...]'
  );
  process.exit(2);
}

const bad = results.filter((r) => r.failLines.length > 0 || r.code !== 0);
console.log(
  bad.length === 0
    ? `\nLes ${results.length} suite(s) sont vertes.`
    : `\n${bad.length} suite(s) en échec.`
);
process.exit(bad.length ? 1 : 0);
