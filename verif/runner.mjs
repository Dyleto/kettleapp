/**
 * Lance chaque suite avec un serveur d'essai neuf.
 *
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait silencieusement à s'y lier, et toutes les suites tourneraient
 * sur un état déjà muté. C'est exactement le faux échec qu'on veut éviter.
 */
import { execSync, spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const suites = process.argv.slice(2);
const results = [];

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
 * Un serveur laissé par une exécution précédente garderait le port, le nôtre
 * échouerait silencieusement à s'y lier, et toutes les suites tourneraient
 * sur un état déjà muté. C'est le faux échec qu'on veut éviter.
 *
 * On le termine plutôt que d'abandonner : c'est notre propre serveur, il
 * n'appartient à personne d'autre, et échouer là-dessus ne faisait que
 * demander la même commande une seconde fois.
 */
const ensureFree = async () => {
  if (!(await ping())) return;
  // Le motif est ancré sur la ligne de commande entière : un motif libre
  // se reconnaît dans le shell qui l'invoque, et tue son propre appelant.
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
    // Pas de pgrep : on retombe sur l'attente.
  }
  for (let i = 0; i < 20; i++) {
    await wait(300);
    if (!(await ping())) return;
  }
  throw new Error('le port 3001 reste occupé et refuse de céder');
};

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
  throw new Error('le mock ne répond pas');
};

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
  // Un code non nul sans une seule ligne FAIL, c'est un plantage : la suite
  // s'est arrêtée en route et le résumé ne dit pas pourquoi. On la montre.
  if (out.code !== 0 && failLines.length === 0) {
    const lignes = out.buf.trimEnd().split('\n');
    console.log(`    ─ planté (code ${out.code}), fin de sortie :`);
    lignes.slice(-12).forEach((l) => console.log('    │ ' + l));
  }
}

const bad = results.filter((r) => r.failLines.length > 0 || r.code !== 0);
console.log(
  bad.length === 0
    ? '\nToutes les suites sont vertes.'
    : `\n${bad.length} suite(s) en échec.`
);
process.exit(bad.length ? 1 : 0);
