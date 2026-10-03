/**
 * Cocher le dernier exercice d'un bloc, c'est passer au suivant.
 *
 * Le bloc restait là, toutes ses lignes cochées, à attendre une touche sur
 * « Bloc suivant » qui ne disait rien que l'écran ne disait déjà. Un cul-de-sac
 * entre deux blocs, et un geste de plus au milieu d'une séance.
 *
 * Seulement quand il y a où aller. Au dernier bloc, « Terminer » reste un acte
 * délibéré : finir une séance est une décision, pas l'effet de bord d'une case
 * cochée.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  where,
  guidedScreen,
  skipRest,
} from './common.mjs';

const browser = await launch();

// L'enregistrement local de la séance, lu dans la page : c'est lui qui dit ce
// qui a été retenu, indépendamment de ce que l'écran montre.
const record = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

// ── Un bloc en liste terminé passe la main ──────────────────────────────
{
  console.log('\n── cocher le dernier exercice enchaîne sur le bloc suivant');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  ok(
    "on démarre sur l'échauffement",
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );

  // L'échauffement porte deux mouvements.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(450);
  await skipRest(p);
  ok(
    '  → après le premier, on y est toujours',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );

  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok(
    '  → après le dernier, on est sur le bloc suivant',
    /— EMOM$/.test(await where(p)),
    await where(p)
  );

  // Aucun écran mort : on n'a jamais eu de « Bloc suivant » à toucher.
  ok(
    '  → sans avoir jamais eu à toucher « Bloc suivant »',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 0
  );

  // Le bloc sur lequel on arrive est bien neuf.
  ok(
    "  → et le bloc sur lequel on arrive attend qu'on le lance",
    /Toucher pour lancer/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(rien)'
  );

  // Rien ne se perd en chemin : les deux mouvements restent cochés.
  const g = await record(p, 'sess1');
  ok(
    '  → les deux exercices cochés sont enregistrés',
    g.done.length === 2,
    JSON.stringify(g.done)
  );
  ok("  → et l'étape aussi", g.step === 1, String(g.step));
  await ctx.close();
}

// ── Le dernier bloc ne termine pas de lui-même ──────────────────────────
{
  console.log('\n── terminer la séance reste une décision');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // La séance 5 est une pyramide : un bloc, sept paliers.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', { name: /^Fait$/ });
    if (!(await f.count())) break;
    await f.click();
    await p.waitForTimeout(350);
    await skipRest(p);
  }
  const screen = await guidedScreen(p);
  ok(
    'les sept paliers sont cochés',
    /7 sur 7 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → on est toujours dans la séance',
    /— Pyramide$/i.test(await where(p)),
    await where(p)
  );
  ok(
    "  → et c'est « Terminer » qui attend, pas un bilan déjà ouvert",
    (await p.getByRole('button', { name: 'Terminer', exact: true }).count()) ===
      1 &&
      (await p.locator('[role="dialog"] >> text=/Cette séance/').count()) === 0
  );
  await ctx.close();
}

// ── Une boucle ne passe jamais la main d'elle-même ──────────────────────
{
  console.log("\n── un AMRAP n'enchaîne pas : c'est le client qui l'arrête");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(200);
    await skipRest(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  ok('on atteint la boucle', /— AMRAP$/.test(await where(p)), await where(p));
  const before = await where(p);
  for (let i = 0; i < 4; i++) {
    await p.getByRole('button', { name: /^\+1 tour$/ }).click();
    await p.waitForTimeout(150);
  }
  ok(
    "  → compter des tours ne fait pas avancer d'un pouce",
    (await where(p)) === before,
    `${before} → ${await where(p)}`
  );
  await ctx.close();
}

// ── Revenir sur un bloc terminé reste possible ──────────────────────────
{
  console.log("\n── on peut revenir sur un bloc qu'on a terminé");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  await skipRest(p);
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok("on est passé à l'EMOM", /— EMOM$/.test(await where(p)), await where(p));

  await p.getByRole('button', { name: /^Précédent$/ }).click();
  await p.waitForTimeout(500);
  ok(
    "  → « Précédent » nous ramène à l'échauffement",
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );
  ok(
    '  → il est toujours coché',
    /2 sur 2 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(rien)'
  );
  ok(
    '  → et « Bloc suivant » est là pour en ressortir',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 1
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
