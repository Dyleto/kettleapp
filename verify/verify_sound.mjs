/**
 * Le son de la séance guidée.
 *
 * Il n'y en avait pas. La fin d'un tour ne s'annonçait que par une
 * vibration, que Safari sur iPhone ne fournit pas : sur un iPhone, un EMOM
 * changeait de tour en silence.
 *
 * Un son ne se lit pas à l'écran, et un navigateur sans tête n'a pas de
 * haut-parleur. On écoute donc à la source : chaque note est un oscillateur
 * que la page démarre, et la suite relève ces départs — leur hauteur, leur
 * durée — avant que la page ne charge quoi que ce soit. Ce n'est pas un
 * raccourci posé dans l'application : c'est le navigateur qu'on instrumente,
 * et l'application ne sait pas qu'on l'écoute.
 *
 * Le temps est mené à la main. Attendre une vraie minute par tour rendrait
 * la suite inutilisable, et surtout elle ne dirait pas à quelle seconde un
 * bip est parti.
 *
 * 1. valider une série ne sonne pas — c'est un geste, pas une annonce ;
 * 2. quitter un bloc joue deux notes montantes ;
 * 3. un tour se déroule en silence, puis trois bips courts sur ses trois
 *    dernières secondes, puis un bip long, plus aigu, quand il change ;
 * 4. le son se coupe depuis la séance, et le réglage reste sur l'appareil ;
 * 5. finir la séance joue trois notes montantes.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  start,
  where,
  skipRest,
  MOBILE,
} from './common.mjs';

const TICK = 880;
const GO = 1320;

/**
 * Relève chaque note que la page joue, à la source.
 *
 * `start` reçoit l'instant du départ, et le premier `stop` celui de la fin :
 * l'application programme l'arrêt en même temps que le départ. Les `stop`
 * suivants coupent une note déjà relevée et ne changent rien à sa durée
 * prévue.
 */
const listen = (ctx) =>
  ctx.addInitScript(() => {
    window.__notes = [];
    const { start: play, stop: end } = OscillatorNode.prototype;
    OscillatorNode.prototype.start = function (when) {
      this.__note = { frequency: this.frequency.value, start: when };
      window.__notes.push(this.__note);
      return play.call(this, when);
    };
    OscillatorNode.prototype.stop = function (when) {
      if (this.__note && this.__note.stop === undefined && when !== undefined)
        this.__note.stop = when;
      return end.call(this, when);
    };
  });

/** Les notes jouées depuis `from`, avec leur durée en millisecondes. */
const heard = (p, from = 0) =>
  p.evaluate(
    (index) =>
      window.__notes.slice(index).map((note) => ({
        frequency: note.frequency,
        duration: Math.round(((note.stop ?? note.start) - note.start) * 1000),
      })),
    from
  );

const pitches = (notes) => notes.map((n) => n.frequency).join(' ');

/** Laisse à l'écran le temps de se redessiner : l'horloge de la page est
 * menée à la main, mais React rend sur son propre rythme. */
const settle = (p) => p.waitForTimeout(250);

const browser = await launch();

{
  console.log("\n── un bloc, puis un tour d'EMOM");
  const ctx = await browser.newContext(MOBILE);
  await listen(ctx);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess1');

  // L'échauffement, série par série, jusqu'à l'EMOM. On relève ce qui a
  // sonné tant qu'on y est encore, puis ce que le changement de bloc ajoute.
  let duringWarmup = [];
  for (let i = 0; i < 6; i++) {
    if (/— EMOM$/.test(await where(p))) break;
    duringWarmup = await heard(p);
    const next = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (!(await next.count())) break;
    await next.first().click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  ok("on est bien sur l'EMOM", /— EMOM$/.test(await where(p)), await where(p));
  ok(
    "valider les séries de l'échauffement n'a rien fait sonner",
    duringWarmup.length === 0,
    pitches(duringWarmup)
  );
  const blockEnd = await heard(p);
  ok(
    'quitter le bloc joue deux notes montantes',
    blockEnd.length === 2 && blockEnd[1].frequency > blockEnd[0].frequency,
    pitches(blockEnd)
  );

  // Le temps ne s'écoule plus que sur ordre.
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 1000);
  let mark = blockEnd.length;

  const startedAt = await where(p);
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await settle(p);
  await p.clock.runFor(56_000);
  await settle(p);
  const quiet = await heard(p, mark);
  ok(
    'le tour se déroule en silence pendant 56 secondes',
    quiet.length === 0,
    pitches(quiet)
  );

  for (let second = 0; second < 3; second++) {
    await p.clock.runFor(1000);
    await settle(p);
  }
  const lastSeconds = await heard(p, mark);
  ok(
    'ses trois dernières secondes donnent trois bips courts',
    pitches(lastSeconds) === `${TICK} ${TICK} ${TICK}`,
    pitches(lastSeconds)
  );
  mark += lastSeconds.length;

  await p.clock.runFor(1000);
  await settle(p);
  const turn = await heard(p, mark);
  ok(
    'le changement de tour donne un bip, plus aigu',
    turn.length === 1 && turn[0].frequency === GO && GO > TICK,
    pitches(turn)
  );
  ok(
    '  → et plus long que les trois qui le précèdent',
    turn.length === 1 && turn[0].duration > lastSeconds[0]?.duration * 3,
    `${turn[0]?.duration} ms contre ${lastSeconds[0]?.duration} ms`
  );
  ok(
    '  → au moment où le tour change vraiment',
    (await where(p)) !== startedAt,
    await where(p)
  );
  mark += turn.length;

  // ── Couper le son, depuis la séance ─────────────────────────────────────
  console.log('\n── le son se coupe là où il s’entend');
  const mute = p.getByRole('button', { name: 'Couper le son' });
  ok('la séance porte de quoi couper le son', (await mute.count()) === 1);
  if (await mute.count()) await mute.first().click();
  await settle(p);
  const unmute = p.getByRole('button', { name: 'Remettre le son' });
  ok(
    'le bouton dit alors qu’il le remettra',
    (await unmute.count()) === 1 &&
      (await unmute.first().getAttribute('aria-pressed')) === 'true'
  );

  // Le tour suivant est déjà parti : on le mène jusqu'au bout.
  await p.clock.runFor(60_000);
  await settle(p);
  const muted = await heard(p, mark);
  ok(
    'un tour entier se passe alors sans un bip',
    muted.length === 0,
    pitches(muted)
  );
  ok(
    '  → et le tour a bien changé quand même',
    /Étape 4 /.test(await where(p)),
    await where(p)
  );

  ok(
    "le réglage est retenu sur l'appareil",
    (await p.evaluate(() => localStorage.getItem('kettle-sound'))) === 'off'
  );

  // ── Le même réglage, dans « Mon compte » ────────────────────────────────
  await p.clock.resume();
  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  const setting = p.getByRole('switch', {
    name: 'Les bips de la séance guidée',
  });
  await setting.waitFor({ timeout: 6000 }).catch(() => {});
  const shownMuted =
    (await setting.getAttribute('aria-checked').catch(() => null)) === 'false';
  ok('« Mon compte » le montre coupé', shownMuted);
  if (await setting.count()) await setting.click();
  await settle(p);
  // « Le remet » suppose qu'il était coupé : un réglage resté actif d'un
  // bout à l'autre donnerait le même état final sans que rien n'ait été
  // remis.
  ok(
    '  → et le remet',
    shownMuted &&
      (await setting.getAttribute('aria-checked').catch(() => null)) ===
        'true' &&
      (await p.evaluate(() => localStorage.getItem('kettle-sound'))) === null
  );

  await ctx.close();
}

{
  console.log('\n── la fin de la séance');
  const ctx = await browser.newContext(MOBILE);
  await listen(ctx);
  const p = await signIn(ctx);
  // La séance 5 est une échelle : un seul bloc, sept paliers.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const done = p.getByRole('button', { name: /^Fait$/ });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  const rungs = await heard(p);
  ok(
    'valider sept paliers ne fait rien sonner',
    rungs.length === 0,
    pitches(rungs)
  );

  const finish = p.getByRole('button', { name: 'Terminer', exact: true });
  if (await finish.count()) await finish.click();
  await p.waitForTimeout(600);
  const ending = await heard(p);
  ok(
    'terminer joue trois notes montantes',
    ending.length === 3 &&
      ending[1].frequency > ending[0].frequency &&
      ending[2].frequency > ending[1].frequency,
    pitches(ending)
  );
  ok(
    '  → dont la dernière est le bip du départ, entendu toute la séance',
    ending[2]?.frequency === GO,
    String(ending[2]?.frequency)
  );

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
