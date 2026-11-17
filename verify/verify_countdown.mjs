/**
 * L'horloge attend qu'on la lance.
 *
 * Elle démarrait d'elle-même. Sur un tour, cela voulait dire que le décompte
 * tournait déjà avant que le client n'ait saisi sa kettlebell : on ouvre la
 * séance, on arrive au tour 1 d'un EMOM, et l'on est déjà en retard.
 *
 * Démarrer est une décision, et elle appartient à celui qui va faire le
 * travail. L'enchaînement, lui, est le format : redemander une touche à
 * chaque tour détruirait l'EMOM — « every minute on the minute » veut dire
 * que les minutes se suivent, pas qu'on les relance.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  where,
  skipRest,
  advance,
  launchClock,
  passBlock,
  timerLabel,
  settle,
  hold,
  pastInterlude,
} from './common.mjs';

const browser = await launch();

/** Ce que dit l'horloge du tour : son chiffre, son étiquette, et si
 * « Lancer » est encore proposé. */
const clock = async (p) => ({
  time: await p.evaluate(() => {
    const r = document.querySelector('[role="timer"]');
    const t = [...(r?.querySelectorAll('*') ?? [])].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && !e.children.length
    );
    return t?.textContent.trim() ?? null;
  }),
  label: await timerLabel(p),
  launch: await p.getByRole('button', { name: 'Lancer', exact: true }).count(),
});

/** Franchit l'échauffement de la séance 1 pour atteindre l'EMOM. */
const goToEmom = async (p) => {
  await start(p, 'sess1');
  // On s'arrête dès qu'on y est : compter les clics devient faux à partir du
  // moment où un bloc terminé enchaîne tout seul sur le suivant.
  for (let i = 0; i < 6; i++) {
    if (/— EMOM$/.test(await where(p))) return;
    await advance(p);
    await skipRest(p);
  }
};

// ── Elle ne part pas sans nous ──────────────────────────────────────────
{
  console.log("\n── le décompte d'un tour attend une touche");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await goToEmom(p);
  ok("on est bien sur l'EMOM", /— EMOM$/.test(await where(p)), await where(p));

  const before = await clock(p);
  ok("l'horloge montre tout le temps", before.time === '1:00', before.time);
  ok(
    '  → et propose de la lancer',
    before.launch === 1,
    `${before.launch} bouton « Lancer »`
  );
  ok(
    '  → ce que son étiquette dit aussi',
    /^Tour 1 sur 10 — 1:00, pas encore lancé$/.test(before.label ?? ''),
    before.label
  );

  // Le point qui compte : attendre ne coûte aucun temps.
  await hold(p, 3000, "c'est l'attente elle-même qui est éprouvée");
  const after = await clock(p);
  ok(
    "trois secondes d'attente ne mordent pas sur le tour",
    after.time === '1:00',
    after.time
  );

  await launchClock(p);
  await hold(p, 2500, "l'horloge doit avoir battu");
  const started = await clock(p);
  ok(
    'une touche la lance, et elle tourne',
    /^Tour 1 sur 10 — 5[0-9] secondes restantes$/.test(started.label ?? ''),
    started.label
  );
  ok(
    '  → « Lancer » a disparu : plus rien à toucher',
    started.launch === 0,
    `${started.launch} bouton « Lancer »`
  );
  await ctx.close();
}

// ── Une fois lancé, l'EMOM enchaîne ─────────────────────────────────────
//
// C'est le format : les minutes se suivent. Redemander une touche à chaque
// tour reviendrait à ne plus faire d'EMOM du tout.
{
  console.log('\n── une fois lancés, les tours suivants partent seuls');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await goToEmom(p);
  await launchClock(p);
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
  await p.clock.runFor(61_000);
  await settle(p);
  const round2 = await clock(p);
  ok(
    'la minute écoulée, le tour 2 tourne sans rien demander',
    /^Tour 2 sur 10 — 5[0-9] secondes restantes$/.test(round2.label ?? '') &&
      round2.launch === 0,
    round2.label
  );
  ok(
    '  → et la séance le suit',
    /tour 2 sur 10/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Changer de bloc remet l'horloge en attente ──────────────────────────
{
  console.log('\n── un autre bloc, une autre décision');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess4');
  // La séance 4 enchaîne un On-Off de 8 tours puis un bloc « Every ».
  ok('on démarre sur le On-Off', /— On/i.test(await where(p)), await where(p));
  // « C'est parti » et son décompte valent le « Lancer » du premier bloc :
  // un second décompte ne redemanderait que ce qui vient d'être décidé.
  const first = await clock(p);
  ok(
    "  → le décompte de l'ouverture l'a lancé",
    /^Effort, tour 1 sur 8 — \d+ secondes restantes$/.test(first.label ?? '') &&
      first.launch === 0,
    first.label
  );
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
  // Huit tours de 40 s d'effort et 20 s de repos, et un peu de marge.
  await p.clock.runFor(8 * 60_000 + 1_000);
  await settle(p);
  ok(
    'le dernier tour tombé, on atteint le bloc suivant',
    /— Every/i.test(await where(p)),
    await where(p)
  );
  await pastInterlude(p);
  const fresh = await clock(p);
  ok(
    '  → son horloge attend à son tour',
    fresh.launch === 1 && /pas encore lancé$/.test(fresh.label ?? ''),
    fresh.label
  );
  await ctx.close();
}

// ── Le repos, lui, démarre de lui-même ──────────────────────────────────
//
// Il a été déclenché par le geste qui a terminé la série : redemander une
// touche juste après serait un geste de trop.
{
  console.log("\n── le repos entre deux séries n'attend pas");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  // Le Tabata d'abord, passé par la pause : on vient pour la liste.
  await passBlock(p);
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click();
  await hold(p, 2200, 'le repos doit avoir compté deux secondes');
  // Le repos est une carte qui annonce ses secondes, et non plus une
  // horloge à bouton : on lit ce qu'elle annonce.
  const label = await p
    .locator('[data-rest]')
    .getAttribute('aria-label', { timeout: 1000 })
    .catch(() => null);
  const seconds = Number(label?.match(/(\d+) secondes/)?.[1] ?? NaN);
  ok('le décompte du repos est là dès la série cochée', label !== null, label);
  ok(
    '  → et il tourne sans qu’on le lance',
    seconds >= 50 && seconds <= 58,
    `${seconds} s sur 60, deux secondes après`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
