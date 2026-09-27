/**
 * Runs each suite with a fresh test server.
 *
 * A server left behind by an earlier run would hold the port, ours would
 * silently fail to bind to it, and every suite would run against state that
 * has already been mutated. That is exactly the false failure we want to
 * avoid.
 */
import { execSync, spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';

/**
 * `--all` runs every suite in the directory.
 *
 * Naming them explicitly is right when you are working on one, and wrong for
 * CI: a suite added and forgotten in a hand-written list is a suite that
 * never runs again, and nothing says so. Reading the directory means a new
 * `verify_*.mjs` file is covered the moment it exists.
 */
const asked = process.argv.slice(2);
const suites = asked.includes('--all')
  ? readdirSync(import.meta.dirname)
      .filter((f) => /^verify_.+\.mjs$/.test(f))
      .sort()
  : asked;
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
 * A server left behind by an earlier run would hold the port, ours would
 * silently fail to bind to it, and every suite would run against state that
 * has already been mutated. That is the false failure we want to avoid.
 *
 * We end it rather than give up: it is our own server, it belongs to nobody
 * else, and failing on it only meant asking for the same command a second
 * time.
 */
const ensureFree = async () => {
  if (!(await ping())) return;
  // The pattern is anchored on the whole command line: a loose pattern
  // recognises itself in the shell that invokes it, and kills its own caller.
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
        // Already gone between the listing and the signal.
      }
    });
  } catch {
    // No pgrep: we fall back on waiting.
  }
  for (let i = 0; i < 20; i++) {
    await wait(300);
    if (!(await ping())) return;
  }
  throw new Error('port 3001 stays busy and refuses to give way');
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
  throw new Error('the mock does not answer');
};

/**
 * The front end has to be up, and saying so once beats failing ten times.
 *
 * Without it every suite dies in `signIn` on a navigation timeout, and the
 * output is ten stack traces that name Playwright rather than the missing
 * server. The cause is one line long; it should read as one line.
 */
const FRONT = process.env.KETTLE_BASE ?? 'http://localhost:5173';
try {
  const r = await fetch(FRONT, { redirect: 'manual' });
  if (!(r.status > 0)) throw new Error('no answer');
} catch {
  console.log(
    `\nThe front end does not answer on ${FRONT}.\n` +
      'Start it first (npx vite), or set KETTLE_BASE.'
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
  // A non-zero code with not a single FAIL line is a crash: the suite stopped
  // on the way and the summary does not say why. We show it.
  if (out.code !== 0 && failLines.length === 0) {
    const lines = out.buf.trimEnd().split('\n');
    console.log(`    ─ crashed (code ${out.code}), end of output:`);
    lines.slice(-12).forEach((l) => console.log('    │ ' + l));
  }
}

// Running the runner with no suite names runs nothing at all, and printing
// "all green" for zero suites is the one result that must never be trusted.
if (suites.length === 0) {
  console.log(
    '\nNo suite named. Usage: node runner.mjs --all | verify_recap.mjs [...]'
  );
  process.exit(2);
}

const bad = results.filter((r) => r.failLines.length > 0 || r.code !== 0);
console.log(
  bad.length === 0
    ? `\nAll ${results.length} suite(s) green.`
    : `\n${bad.length} suite(s) failing.`
);
process.exit(bad.length ? 1 : 0);
