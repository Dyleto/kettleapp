/**
 * Cocher le dernier exercice d'un bloc, c'est passer au suivant.
 *
 * Le bloc restait là, toutes ses lignes cochées, à attendre un toucher sur
 * « Bloc suivant » qui ne disait rien que l'écran ne disait déjà. Un cul-de-sac
 * entre deux blocs, et un geste de plus au milieu d'une séance.
 *
 * Seulement quand il y a où aller. Sur le dernier bloc, « Terminer » reste un
 * acte délibéré : finir une séance est une décision, pas l'effet de bord d'une
 * case à cocher.
 */
import {
  lancer,
  MOBILE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  ou,
  ecranGuide,
  passerRepos,
} from './commun.mjs';

const browser = await lancer();

const garde = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

// ── Un bloc-liste fini passe la main ────────────────────────────────────
{
  console.log('\n── cocher le dernier exercice enchaîne sur le bloc suivant');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  ok(
    'on démarre sur l’échauffement',
    /— Échauffement$/.test(await ou(p)),
    await ou(p)
  );

  // L'échauffement porte deux mouvements.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(450);
  await passerRepos(p);
  ok(
    '  → après le premier, on y est toujours',
    /— Échauffement$/.test(await ou(p)),
    await ou(p)
  );

  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok(
    '  → après le dernier, on est sur le bloc suivant',
    /— EMOM$/.test(await ou(p)),
    await ou(p)
  );

  // Aucun écran mort : on n'a jamais eu « Bloc suivant » à toucher.
  ok(
    '  → sans avoir eu à toucher « Bloc suivant »',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 0
  );

  // Le bloc d'arrivée est bien neuf.
  ok(
    '  → et le bloc d’arrivée attend son départ',
    /Toucher pour lancer/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(rien)'
  );

  // Rien n'est perdu au passage : les deux mouvements restent cochés.
  const g = await garde(p, 'sess1');
  ok(
    '  → les deux exercices cochés sont enregistrés',
    g.done.length === 2,
    JSON.stringify(g.done)
  );
  ok('  → et l’étape aussi', g.step === 1, String(g.step));
  await ctx.close();
}

// ── Le dernier bloc ne se termine pas tout seul ────────────────────────
{
  console.log('\n── finir la séance reste une décision');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  // La séance 5 est une pyramide : un seul bloc, sept paliers.
  await demarrer(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', { name: /^Fait$/ });
    if (!(await f.count())) break;
    await f.click();
    await p.waitForTimeout(350);
    await passerRepos(p);
  }
  const ecran = await ecranGuide(p);
  ok(
    'les sept paliers sont cochés',
    /7 sur 7 faits/.test(ecran),
    (ecran.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → on est toujours dans la séance',
    /— Pyramide$/i.test(await ou(p)),
    await ou(p)
  );
  ok(
    '  → et c’est « Terminer » qui attend, pas un bilan déjà ouvert',
    (await p.getByRole('button', { name: 'Terminer', exact: true }).count()) ===
      1 &&
      (await p.locator('[role="dialog"] >> text=/Cette séance/').count()) === 0
  );
  await ctx.close();
}

// ── Une boucle ne passe jamais toute seule ─────────────────────────────
{
  console.log('\n── un AMRAP ne s’enchaîne pas : c’est le client qui arrête');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(200);
    await passerRepos(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  ok('on atteint la boucle', /— AMRAP$/.test(await ou(p)), await ou(p));
  const avant = await ou(p);
  for (let i = 0; i < 4; i++) {
    await p.getByRole('button', { name: /^\+1 tour$/ }).click();
    await p.waitForTimeout(150);
  }
  ok(
    '  → compter des tours ne fait pas avancer d’un pouce',
    (await ou(p)) === avant,
    `${avant} → ${await ou(p)}`
  );
  await ctx.close();
}

// ── Revenir sur un bloc fini reste possible ────────────────────────────
{
  console.log('\n── on peut revenir sur un bloc qu’on a fini');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  await passerRepos(p);
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok('on est passé à l’EMOM', /— EMOM$/.test(await ou(p)), await ou(p));

  await p.getByRole('button', { name: /^Précédent$/ }).click();
  await p.waitForTimeout(500);
  ok(
    '  → « Précédent » ramène à l’échauffement',
    /— Échauffement$/.test(await ou(p)),
    await ou(p)
  );
  ok(
    '  → il est toujours coché',
    /2 sur 2 faits/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );
  ok(
    '  → et « Bloc suivant » est là pour en ressortir',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 1
  );
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
