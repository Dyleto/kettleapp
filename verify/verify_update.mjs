/**
 * La nouvelle version (G4a) : sans rien à perdre, la page se recharge seule ;
 * avec une frappe en attente, le bandeau attend, et « Maintenant »
 * l'enregistre puis recharge ; pendant une séance, rien ne la coupe.
 *
 * En développement, aucun service worker ne se met à jour : l'application
 * offre `window.__kettleNewVersion()`, qui fait comme si une version
 * attendait. Un rechargement se lit à une marque posée sur `window`, que le
 * rechargement efface.
 */
import {
  API,
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  hold,
  start,
  leaveSession,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverName = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions[0]?.name;
};
const banner = (p) => p.locator('[data-update-banner]');
const mark = (p) => p.evaluate(() => (window.__kettleMark = true));
/** La page a-t-elle été rechargée depuis la marque ? Attendu jusqu'à
 * `timeout` : un rechargement prend son temps. */
const reloaded = async (p, timeout = 5000) => {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const marked = await p
      .evaluate(() => window.__kettleMark === true)
      .catch(() => null);
    if (marked === false) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};
const newVersion = (p) =>
  p.evaluate(() => window.__kettleNewVersion?.()).catch(() => {});

const browser = await launch();

{
  console.log('\n── rien à perdre');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await mark(p);
  await newVersion(p);
  ok(
    'une version qui arrive sans rien à perdre recharge la page, sans rien demander',
    await reloaded(p)
  );
  await ctx.close();
}

{
  console.log('\n── une frappe en attente');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  // L'horloge figée : l'envoi programmé à 800 ms ne part jamais de
  // lui-même. Seul « Maintenant » peut le faire partir.
  // Cinquante millisecondes d'avance, et on recommence si la page les a
  // déjà dépassées : sous la charge, `pauseAt` refusait de revenir en
  // arrière.
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = await p.evaluate(() => Date.now());
    const paused = await p.clock
      .pauseAt(now + 50)
      .then(() => true)
      .catch(() => false);
    if (paused) break;
  }
  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type('Brouillon');
  await p.keyboard.press('Enter');
  await settle(p);
  await mark(p);
  await newVersion(p);
  await banner(p)
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  const said = clean(
    await banner(p)
      .innerText({ timeout: 2000 })
      .catch(() => '')
  ).replace(/\s+/g, ' ');
  const stillHere = !(await reloaded(p, 500));
  ok(
    'une frappe attend : le bandeau le dit, et la page ne se recharge pas',
    said.startsWith(
      'Nouvelle version prête Elle s’installera dès que ce programme sera enregistré.'
    ) &&
      stillHere &&
      (await serverName()) !== 'Brouillon',
    said
  );
  await banner(p)
    .getByRole('button', { name: 'Maintenant' })
    .click({ timeout: 2000 })
    .catch(() => {});
  // L'horloge avance d'une milliseconde à la fois, soixante au plus : de
  // quoi laisser passer le tour qui précède le rechargement, jamais les
  // 800 ms de l'envoi programmé — sans quoi un « Maintenant » qui
  // n'enverrait rien passerait pour efficace.
  let went = false;
  for (let i = 0; i < 60 && !went; i++) {
    await p.clock.runFor(1).catch(() => {});
    went = await reloaded(p, 100);
  }
  ok(
    '  → « Maintenant » enregistre la frappe, puis recharge',
    went && (await serverName()) === 'Brouillon',
    `${went ? 'rechargée' : 'pas rechargée'} · ${await serverName()}`
  );
  await ctx.close();
}

{
  console.log('\n── une séance en cours');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  await mark(p);
  await newVersion(p);
  await hold(p, 1500, 'une seconde et demie sans rechargement ni bandeau');
  ok(
    'une séance en cours n’est ni rechargée ni interrompue par un bandeau',
    !(await reloaded(p, 100)) && (await banner(p).count()) === 0
  );
  await leaveSession(p).catch(() => {});
  ok('  → la séance fermée, la version s’installe', await reloaded(p));
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
