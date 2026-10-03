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
  guidedScreen,
  where,
  skipRest,
} from './common.mjs';

const browser = await launch();

/** Ce que dit l'horloge du tour : son temps, et ce que son bouton
 * propose. */
const clock = (p) =>
  p.evaluate(() => {
    const r = document.querySelector('[aria-label="Séance guidée"]');
    const t = [...r.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && !e.children.length
    );
    const btn = [...r.querySelectorAll('button')].find((e) =>
      /décompte|pause/i.test(e.getAttribute('aria-label') || '')
    );
    // Le `clean` de common.mjs tourne ici, dans la page : il ne peut pas
    // être importé, il est donc réécrit. Les espaces sont échappées —
    // écrites telles quelles, elles sont invisibles à la relecture.
    const clean = (x) => (x ?? '').replace(/[\u00A0\u202F\u2009]/g, ' ');
    return {
      time: clean(t?.textContent.trim()) || null,
      name: clean(btn?.getAttribute('aria-label')) || null,
    };
  });

/** Franchit l'échauffement de la séance 1 pour atteindre l'EMOM. */
const goToEmom = async (p) => {
  await start(p, 'sess1');
  // On s'arrête dès qu'on y est : compter les clics devient faux à partir du
  // moment où un bloc terminé enchaîne tout seul sur le suivant.
  for (let i = 0; i < 6; i++) {
    if (/— EMOM$/.test(await where(p))) return;
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (!(await btn.count())) return;
    await btn.first().click();
    await p.waitForTimeout(300);
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
    '  → et propose de la lancer, pas de la mettre en pause',
    /^Lancer le décompte/.test(before.name ?? ''),
    before.name
  );
  ok(
    "  → l'écran le dit aussi",
    /Toucher pour lancer/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(rien)'
  );

  // Le point qui compte : attendre ne coûte aucun temps.
  await p.waitForTimeout(3000);
  const after = await clock(p);
  ok(
    "trois secondes d'attente ne mordent pas sur le tour",
    after.time === '1:00',
    after.time
  );

  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(2500);
  const started = await clock(p);
  ok(
    'une touche la lance',
    /^Mettre en pause/.test(started.name ?? ''),
    started.name
  );
  ok(
    '  → et elle tourne',
    /5[0-9] s restant/.test(started.name ?? ''),
    started.name
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
  await goToEmom(p);
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(800);

  await p.getByRole('button', { name: /^Suivant$/ }).click();
  await p.waitForTimeout(1200);
  const round2 = await clock(p);
  ok(
    'le tour suivant du même bloc ne demande rien',
    /^Mettre en pause/.test(round2.name ?? ''),
    round2.name
  );
  ok(
    '  → et on est bien au tour 2',
    /Tour 2/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/Tour \d+[^\n]*/)?.[0] ?? '(rien)'
  );
  await ctx.close();
}

// ── Changer de bloc remet l'horloge en attente ──────────────────────────
{
  console.log('\n── un autre bloc, une autre décision');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess4');
  // La séance 4 enchaîne un On-Off de 8 tours puis un bloc « Every ».
  ok('on démarre sur le On-Off', /— On/i.test(await where(p)), await where(p));
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(600);
  for (let i = 0; i < 8; i++) {
    const b = p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ });
    if (!(await b.count())) break;
    await b.click();
    await p.waitForTimeout(220);
    if (/— Every/i.test(await where(p))) break;
  }
  ok(
    'on atteint le bloc suivant',
    /— Every/i.test(await where(p)),
    await where(p)
  );
  const fresh = await clock(p);
  ok(
    '  → son horloge attend à son tour',
    /^Lancer le décompte/.test(fresh.name ?? ''),
    fresh.name
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
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(2200);
  const r = await clock(p);
  ok(
    "le décompte du repos tourne dès qu'il apparaît",
    /^Mettre en pause/.test(r.name ?? ''),
    r.name
  );
  ok('  → et il a bien démarré', /5[0-9] s restant/.test(r.name ?? ''), r.name);
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
