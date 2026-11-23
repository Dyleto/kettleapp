/**
 * Lance chaque suite avec un serveur d'essai neuf, plusieurs à la fois.
 *
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait en silence à s'y attacher, et chaque suite tournerait contre un
 * état déjà modifié. C'est exactement le faux échec qu'on cherche à éviter.
 *
 * Les suites passaient l'une après l'autre : trente suites, 14 min 23 s
 * mesurées, sans qu'aucune ne soit anormalement longue — la pire faisait
 * 82 s. Le temps était dans la file, pas dans une suite. Elles tournent
 * maintenant côte à côte, chacune avec son propre serveur d'essai sur son
 * propre port : c'est ce serveur qui porte l'état, et deux suites qui le
 * partageraient se marcheraient dessus.
 */
import { execSync, spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { availableParallelism } from 'node:os';
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
const args = process.argv.slice(2);
const jobsFlag = args.findIndex((a) => a === '--jobs');
const jobsAsked =
  jobsFlag >= 0 ? Number(args[jobsFlag + 1]) : Number(process.env.KETTLE_JOBS);
const asked = args.filter(
  (a, i) => a !== '--jobs' && (jobsFlag < 0 || i !== jobsFlag + 1)
);
const suites = asked.includes('--all')
  ? readdirSync(import.meta.dirname)
      .filter((f) => /^verify_.+\.mjs$/.test(f))
      .sort()
  : asked;
const results = [];

/**
 * Combien de suites à la fois.
 *
 * Autant que la machine a de cœurs, quatre au plus. Les suites attendent
 * plus qu'elles ne calculent : sur quatre cœurs, quatre files passent en
 * 4 min 12 s contre 5 min 5 s pour trois, et la durée de chaque suite ne
 * bouge pas. Au-delà, une machine saturée ferait tomber les assertions qui
 * attendent une durée. `--jobs 1` (ou
 * `KETTLE_JOBS=1`) revient à la file d'avant — pour lire une sortie dans
 * l'ordre, ou écarter le parallélisme quand une suite tombe.
 */
const jobs = Math.max(
  1,
  Math.min(
    suites.length,
    Number.isFinite(jobsAsked) && jobsAsked > 0
      ? jobsAsked
      : Math.min(4, availableParallelism())
  )
);
/**
 * Un port par file. Seule, une suite garde 3001 — celui que le front vise :
 * rien n'est détourné, et un script de capture lancé à la main trouve le
 * serveur où il l'attend.
 */
const ports = Array.from({ length: jobs }, (_, i) =>
  jobs === 1 ? 3001 : 3101 + i
);

/** Le serveur d'essai répond-il ? Un statut, quel qu'il soit, suffit : on
 * demande s'il y a quelqu'un, pas s'il est content. */
const ping = async (port) => {
  try {
    const r = await fetch(`http://localhost:${port}/api/auth/me`, {
      redirect: 'manual',
    });
    return r.status > 0;
  } catch {
    return false;
  }
};

/**
 * Libère les ports du banc, en tuant s'il le faut ce qui les occupe.
 *
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait en silence à s'y attacher, et chaque suite tournerait contre un
 * état déjà modifié. C'est le faux échec qu'on cherche à éviter.
 *
 * On y met fin plutôt que d'abandonner : c'est notre propre serveur, il
 * n'appartient à personne d'autre, et échouer dessus ne faisait que redemander
 * la même commande une seconde fois.
 *
 * Une seule fois, avant la première suite. Pendant le banc, chaque file tue
 * le serveur qu'elle a lancé, par sa poignée : le motif ci-dessous ne
 * distingue pas un port d'un autre, et s'en servir en cours de route tuerait
 * les serveurs des files voisines.
 */
const ensureFree = async () => {
  const busy = async () =>
    (await Promise.all(ports.map(ping))).some((answered) => answered);
  if (!(await busy())) return;
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
    if (!(await busy())) return;
  }
  throw new Error(
    `un port du banc (${ports.join(', ')}) reste occupé et refuse de céder`
  );
};

/** Démarre le serveur d'essai et attend qu'il réponde : le lancer sans
 * attendre ferait échouer la première requête de la suite. */
const startMock = async (port) => {
  const p = spawn('node', ['mock-server.mjs'], {
    cwd: import.meta.dirname,
    stdio: 'ignore',
    env: { ...process.env, KETTLE_MOCK_PORT: String(port) },
  });
  for (let i = 0; i < 40; i++) {
    await wait(150);
    if (await ping(port)) return p;
  }
  p.kill('SIGKILL');
  throw new Error(`le serveur d'essai ne répond pas sur le port ${port}`);
};

/** Tue un serveur d'essai et attend que son port soit rendu : la suite
 * suivante de la file le reprend aussitôt. */
const stopMock = async (mock, port) => {
  mock.kill('SIGKILL');
  for (let i = 0; i < 20; i++) {
    await wait(100);
    if (!(await ping(port))) return;
  }
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

/** Le plafond d'une suite : trois fois la plus longue sur la CI. */
const SUITE_CAP = 6 * 60_000;

/** Lance une suite contre son serveur d'essai, et rend ce qu'elle a dit. */
const runSuite = async (suite, port) => {
  const suiteStart = Date.now();
  const mock = await startMock(port);
  const out = await new Promise((resolve) => {
    let buf = '';
    const c = spawn('node', [suite], {
      cwd: import.meta.dirname,
      env: { ...process.env, KETTLE_MOCK_PORT: String(port) },
    });
    c.stdout.on('data', (d) => (buf += d));
    c.stderr.on('data', (d) => (buf += d));
    // Une suite qui ne rend plus la main est arrêtée : la plus longue prend
    // une minute et demie ici, deux sur la CI. Sans plafond, un `newPage`
    // qui ne revenait pas a tenu le banc vingt minutes.
    const cap = setTimeout(() => {
      buf += `\nArrêtée au bout de ${SUITE_CAP / 60_000} min sans rendre la main.\n`;
      c.kill('SIGKILL');
    }, SUITE_CAP);
    c.on('close', (code) => {
      clearTimeout(cap);
      resolve({ buf, code });
    });
  });
  await stopMock(mock, port);

  const okCount = (out.buf.match(/^OK/gm) ?? []).length;
  const failLines = out.buf.match(/^FAIL.*$/gm) ?? [];
  const summary = `${okCount} OK · ${failLines.length} FAIL`;
  // La durée de chaque suite, parce qu'un banc qui s'allonge ne dit pas où
  // le temps passe : c'est la première chose à savoir pour le raccourcir,
  // et la seule façon de voir une suite qui s'alourdit.
  const seconds = Math.round((Date.now() - suiteStart) / 1000);
  // Toute la sortie d'une suite d'un seul bloc : avec plusieurs files, des
  // lignes écrites une à une s'entremêleraient avec celles des voisines.
  const lines = [
    `${failLines.length === 0 && out.code === 0 ? '✓' : '✗'} ${suite.padEnd(22)} ${summary.padEnd(18)} ${String(seconds).padStart(4)} s`,
    ...failLines.map((l) => '    ' + l),
  ];
  // Un code non nul sans une seule ligne FAIL est un plantage : la suite
  // s'est arrêtée en chemin et le résumé ne dit pas pourquoi. On le montre.
  if (out.code !== 0 && failLines.length === 0) {
    lines.push(`    ─ planté (code ${out.code}), fin de la sortie :`);
    out.buf
      .trimEnd()
      .split('\n')
      .slice(-12)
      .forEach((l) => lines.push('    │ ' + l));
  }
  console.log(lines.join('\n'));
  return { suite, summary, failLines, code: out.code, seconds };
};

const benchStart = Date.now();
if (suites.length > 0) await ensureFree();
// Une file par port : chacune prend la suite suivante dès qu'elle a fini la
// sienne. Les plus longues d'abord quand on les connaît ne changerait rien
// d'utile ici — trente suites de durées voisines se répartissent seules.
const queue = [...suites];
await Promise.all(
  ports.map(async (port) => {
    for (let suite = queue.shift(); suite; suite = queue.shift()) {
      results.push(await runSuite(suite, port));
    }
  })
);

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
// Le pluriel s'accorde : « Les 10 suites sont vertes » et « La suite est
// verte » se lisent, « Les 1 suite(s) sont vertes » non.
const green =
  results.length === 1
    ? 'La suite est verte.'
    : `Les ${results.length} suites sont vertes.`;
const red =
  bad.length === 1
    ? 'Une suite est en échec.'
    : `${bad.length} suites sont en échec.`;
const total = Math.round((Date.now() - benchStart) / 1000);
console.log(
  '\n' +
    (bad.length === 0 ? green : red) +
    ` ${Math.floor(total / 60)} min ${total % 60} s.`
);
process.exit(bad.length ? 1 : 0);
