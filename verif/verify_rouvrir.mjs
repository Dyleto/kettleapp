/**
 * Rouvrir un exercice déjà fait.
 *
 * Une ligne cochée était morte : on ne pouvait ni la relire, ni corriger la
 * charge qu'on venait d'y taper de travers, ni la refaire. Or les trois
 * choses qu'on veut d'un exercice passé n'ont rien à voir avec le curseur —
 * elles se font donc sur place, sans déplacer où l'on en est.
 *
 * Corriger et refaire sont deux gestes distincts : qui répare une faute de
 * frappe ne veut pas retrouver la série devant lui.
 */
import {
  lancer,
  MOBILE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  ecranGuide,
  passerRepos,
} from './commun.mjs';

const browser = await lancer();

const garde = (p) =>
  p.evaluate(() =>
    JSON.parse(localStorage.getItem('kettle-seance-sess2') || 'null')
  );

/** Coche les deux premières séries du bloc classique, à 24 puis 25 kg. */
const cocherDeuxSeries = async (p) => {
  await demarrer(p, 'sess2');
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
    await passerRepos(p);
  }
};

// ── Une ligne cochée s'ouvre ────────────────────────────────────────────
{
  console.log('\n── un exercice fait se rouvre');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherDeuxSeries(p);

  const rouvrables = await p.getByRole('button', { name: /^Rouvrir/ }).count();
  ok(
    'les exercices faits sont touchables',
    rouvrables === 2,
    `${rouvrables} rouvrable(s)`
  );

  // Ce qui n'est pas fait ne se rouvre pas : la série en cours porte déjà son
  // champ, et celles à venir n'ont rien à rouvrir.
  const enCours = await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 3/ })
    .count();
  ok('  → ce qui n’est pas encore fait ne l’est pas', enCours === 0);

  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);

  const champ = p.locator('input[aria-label^="Corriger le poids"]');
  const combien = await champ.count();
  const lu = combien > 0 ? await champ.first().inputValue() : null;
  ok(
    'la ligne s’ouvre sur la charge qu’on y avait mise',
    combien === 1 && lu === '24',
    lu === null ? '(aucun champ)' : lu
  );
  const ecran = await ecranGuide(p);
  ok('  → avec de quoi la refaire', /Refaire/.test(ecran));
  ok('  → de quoi revoir le mouvement', /Revoir le mouvement/.test(ecran));
  ok('  → et de quoi refermer', /Fermer/.test(ecran));

  // Une seule à la fois : deux charges modifiables à l'écran ramèneraient le
  // formulaire à chaque ligne que la liste a été réécrite pour enlever.
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

// ── Corriger n'est pas décocher ────────────────────────────────────────
{
  console.log('\n── corriger une charge ne défait rien');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherDeuxSeries(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.locator('input[aria-label^="Corriger le poids"]').first().fill('30');
  await p.waitForTimeout(400);

  const g = await garde(p);
  ok(
    'la correction part au bon endroit',
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
    /2 sur 7 faits/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );

  await p.getByRole('button', { name: /^Fermer$/ }).click();
  await p.waitForTimeout(300);
  ok(
    '  → refermer ne défait rien non plus',
    (await garde(p)).done.length === 2 &&
      (await p.locator('input[aria-label^="Corriger le poids"]').count()) === 0
  );
  await ctx.close();
}

// ── Refaire remet la série devant soi ──────────────────────────────────
{
  console.log('\n── « Refaire » rend la série à faire');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherDeuxSeries(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Refaire$/ }).click();
  await p.waitForTimeout(500);

  const g = await garde(p);
  ok(
    'la série est décochée',
    !g.done.includes('2:1:1'),
    JSON.stringify(g.done)
  );
  ok(
    '  → le bloc le compte',
    /1 sur 7 faits/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );

  // Le curseur suit tout seul : il est le premier exercice non fait.
  const courant = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .getAttribute('aria-label');
  ok(
    '  → et elle redevient l’exercice en cours',
    /série 1 \/ 4/.test(courant ?? ''),
    courant ?? '(aucun)'
  );

  // Refaire n'est pas oublier ce qu'on a soulevé.
  ok(
    '  → la charge notée reste',
    g.performed?.['2:1']?.sets?.[0]?.weight === 24,
    JSON.stringify(g.performed?.['2:1']?.sets?.[0] ?? null)
  );
  await ctx.close();
}

// ── Revoir le mouvement ────────────────────────────────────────────────
{
  console.log('\n── revoir un mouvement déjà fait');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherDeuxSeries(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Revoir le mouvement$/ }).click();
  await p.waitForTimeout(500);
  const ecran = await ecranGuide(p);
  ok(
    'la consigne du mouvement s’ouvre',
    /Kettlebell contre la poitrine/.test(ecran),
    ecran.split('\n').filter(Boolean).slice(0, 3).join(' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
