/**
 * Rouvrir un exercice déjà fait.
 *
 * Une ligne cochée était morte : on ne pouvait ni la relire, ni corriger la
 * charge qu'on venait d'y taper de travers, ni la refaire. Pourtant, les
 * trois choses qu'on veut d'un exercice passé n'ont rien à voir avec le
 * curseur — elles se font donc sur place, sans déplacer où l'on en est.
 *
 * Corriger et refaire sont deux gestes distincts : celui qui répare une faute
 * de frappe ne veut pas retrouver la série devant lui.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  guidedScreen,
  skipRest,
} from './common.mjs';

const browser = await launch();

// L'enregistrement local de la séance : c'est lui qui dit ce qui a été
// retenu, indépendamment de ce que l'écran montre.
const record = (p) =>
  p.evaluate(() =>
    JSON.parse(localStorage.getItem('kettle-seance-sess2') || 'null')
  );

/** Coche les deux premières séries du bloc classique, à 24 puis 25 kg. */
const tickTwoSets = async (p) => {
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  for (let i = 0; i < 2; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(24 + i));
      await p.waitForTimeout(250);
    }
    await p.getByRole('button', { name: /^Fait$/ }).click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
};

// ── Une ligne cochée s'ouvre ────────────────────────────────────────────
{
  console.log('\n── un exercice déjà fait se rouvre');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);

  const reopenable = await p.getByRole('button', { name: /^Rouvrir/ }).count();
  ok(
    'les exercices déjà faits sont touchables',
    reopenable === 2,
    `${reopenable} rouvrable(s)`
  );

  // Ce qui n'est pas fait ne se rouvre pas : la série en cours porte déjà son
  // champ, et celles qui viennent n'ont rien à rouvrir.
  const current = await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 3/ })
    .count();
  ok("  → ce qui n'est pas encore fait ne l'est pas", current === 0);

  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);

  const field = p.locator('input[aria-label^="Corriger le poids"]');
  const howMany = await field.count();
  const read = howMany > 0 ? await field.first().inputValue() : null;
  ok(
    "la ligne s'ouvre sur la charge qu'on y avait mise",
    howMany === 1 && read === '24',
    read === null ? '(aucun champ)' : read
  );
  const screen = await guidedScreen(p);
  ok('  → avec de quoi la refaire', /Refaire/.test(screen));
  ok('  → de quoi revoir le mouvement', /Revoir le mouvement/.test(screen));
  ok('  → et de quoi la refermer', /Fermer/.test(screen));

  // Une à la fois : deux charges éditables à l'écran ramèneraient le
  // formulaire sur chaque ligne, ce que la réécriture de la liste avait
  // retiré.
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 2/ })
    .click();
  await p.waitForTimeout(400);
  ok(
    '  → une seule ligne ouverte à la fois',
    (await p.locator('input[aria-label^="Corriger le poids"]').count()) === 1
  );
  await ctx.close();
}

// ── Corriger n'est pas décocher ─────────────────────────────────────────
{
  console.log('\n── corriger une charge ne défait rien');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.locator('input[aria-label^="Corriger le poids"]').first().fill('30');
  await p.waitForTimeout(400);

  const g = await record(p);
  ok(
    'la correction atterrit au bon endroit',
    g.performed['2:1'].sets[0].weight === 30,
    JSON.stringify(g.performed['2:1'].sets)
  );
  ok(
    '  → sans toucher à la série suivante',
    g.performed['2:1'].sets[1].weight === 25
  );
  ok(
    '  → et la série reste cochée',
    g.done.length === 2,
    JSON.stringify(g.done)
  );
  ok(
    '  → le bloc le dit toujours',
    /2 sur 7 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );

  await p.getByRole('button', { name: /^Fermer$/ }).click();
  await p.waitForTimeout(300);
  ok(
    '  → la refermer ne défait rien non plus',
    (await record(p)).done.length === 2 &&
      (await p.locator('input[aria-label^="Corriger le poids"]').count()) === 0
  );
  await ctx.close();
}

// ── Refaire remet la série devant soi ───────────────────────────────────
{
  console.log('\n── « Refaire » rend la série à faire');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Refaire$/ }).click();
  await p.waitForTimeout(500);

  const g = await record(p);
  ok(
    'la série est décochée',
    !g.done.includes('2:1:1'),
    JSON.stringify(g.done)
  );
  ok(
    '  → le bloc en tient compte',
    /1 sur 7 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );

  // Le curseur suit tout seul : c'est le premier exercice non fait.
  const currentLabel = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .getAttribute('aria-label');
  ok(
    "  → et elle redevient l'exercice en cours",
    /série 1 \/ 4/.test(currentLabel ?? ''),
    currentLabel ?? '(aucun)'
  );

  // Refaire n'est pas oublier ce qu'on a soulevé.
  ok(
    '  → la charge notée reste',
    g.performed?.['2:1']?.sets?.[0]?.weight === 24,
    JSON.stringify(g.performed?.['2:1']?.sets?.[0] ?? null)
  );
  await ctx.close();
}

// ── Revoir le mouvement ─────────────────────────────────────────────────
{
  console.log('\n── revoir un mouvement déjà fait');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Revoir le mouvement$/ }).click();
  await p.waitForTimeout(500);
  const screen = await guidedScreen(p);
  ok(
    "la consigne du mouvement s'ouvre",
    /Kettlebell contre la poitrine/.test(screen),
    screen.split('\n').filter(Boolean).slice(0, 3).join(' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
