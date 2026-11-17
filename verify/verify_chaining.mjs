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
  advance,
  timerLabel,
  launchClock,
  settle,
  hold,
  pastInterlude,
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
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click();
  await settle(p);
  await skipRest(p);
  ok(
    '  → après le premier, on y est toujours',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );

  // Le dernier geste du bloc dit ce qui vient après lui : la liste dessous
  // s'arrête là, et rien n'annonçait que cocher allait changer d'écran.
  const lastGesture = await guidedScreen(p);
  ok(
    '  → le dernier geste du bloc annonce le bloc suivant',
    /Ensuite · bloc suivant : EMOM/.test(lastGesture),
    lastGesture.match(/Ensuite[^\n]*/)?.[0] ?? '(rien)'
  );

  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click();
  await settle(p);
  ok(
    '  → après le dernier, on est sur le bloc suivant',
    /— EMOM$/.test(await where(p)),
    await where(p)
  );

  // Trois secondes entre les deux : ce qui vient de finir, ce qui vient.
  const between = await guidedScreen(p);
  ok(
    "  → l'écran « Bloc suivant » dit ce qui finit et ce qui vient",
    (await p.locator('[data-next-block]').count()) === 1 &&
      /Bloc 1 terminé · 2 exercices/.test(between) &&
      /Bloc 2 sur 3/i.test(between) &&
      /Kettlebell Swing/.test(between),
    between.replace(/\n+/g, ' | ').slice(0, 160)
  );

  // Aucun écran mort : on n'a jamais eu de « Bloc suivant » à toucher.
  ok(
    '  → sans avoir jamais eu à toucher « Bloc suivant »',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 0
  );

  await hold(
    p,
    3_400,
    "l'écran « Bloc suivant » s'efface seul au bout de trois secondes"
  );
  await settle(p);
  ok(
    '  → et il s’efface seul, sans un geste',
    (await p.locator('[data-next-block]').count()) === 0
  );

  // Le bloc sur lequel on arrive est bien neuf.
  ok(
    "  → et le bloc sur lequel on arrive attend qu'on le lance",
    (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
      1 && /pas encore lancé$/.test((await timerLabel(p)) ?? ''),
    await timerLabel(p)
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
  // La séance 5 est une échelle : un bloc, sept paliers.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await f.count())) break;
    await f.click();
    await settle(p);
    await skipRest(p);
  }
  // L'échelle a sa scène : elle annonce ses paliers au-dessus des marches,
  // « 7 paliers sur 7 », là où la liste disait « 7 sur 7 faits ».
  const screen = await guidedScreen(p);
  ok(
    'les sept paliers sont cochés',
    /7 paliers sur 7/i.test(screen),
    (screen.match(/[^\n]*paliers? \d+ sur \d+[^\n]*/i) ?? ['(rien)'])[0]
  );
  ok(
    '  → on est toujours dans la séance',
    /— Échelle$/i.test(await where(p)),
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
    if (await p.getByRole('button', { name: /^Ajouter un tour/ }).count())
      break;
    await advance(p);
    await skipRest(p);
  }
  // Le rond ne compte qu'une fois l'horloge lancée : rien ne part sans un
  // geste, pas plus dans un AMRAP qu'ailleurs.
  await launchClock(p);
  ok('on atteint la boucle', /— AMRAP$/.test(await where(p)), await where(p));
  const before = await where(p);
  for (let i = 0; i < 4; i++) {
    await p.getByRole('button', { name: /^Ajouter un tour/ }).click();
    await settle(p);
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
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click();
  await settle(p);
  await skipRest(p);
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click();
  await settle(p);
  await pastInterlude(p);
  ok("on est passé à l'EMOM", /— EMOM$/.test(await where(p)), await where(p));

  await p.getByRole('button', { name: /^Bloc précédent$/ }).click();
  await settle(p);
  ok(
    "  → « Bloc précédent » nous ramène à l'échauffement",
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

// ── L'écran « Bloc suivant » ─────────────────────────────────────────────
//
// Trois secondes entre deux blocs, puis la suite vient seule. Toucher
// l'écran n'importe où enchaîne tout de suite ; la pause fige le décompte.

/** La séance 1 jusqu'à l'écran « Bloc suivant » : les deux mouvements de
 * l'échauffement cochés. */
const toInterlude = async (p) => {
  await start(p, 'sess1');
  for (let i = 0; i < 2; i++) {
    await p.getByRole('button', { name: /^(Fait|Série faite)$/ }).click();
    await settle(p);
    await skipRest(p);
  }
};

{
  console.log("\n── toucher l'écran « Bloc suivant » enchaîne tout de suite");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await toInterlude(p);
  ok(
    "l'écran « Bloc suivant » est là",
    (await p.locator('[data-next-block]').count()) === 1
  );
  // N'importe où : le nom du bloc, pas le bouton du pied.
  await p
    .locator('[data-next-block] h1')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → un toucher sur le nom du bloc suffit, sans attendre',
    (await p.locator('[data-next-block]').count()) === 0 &&
      (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
        1
  );
  await ctx.close();
}

{
  console.log("\n── la pause fige l'écran « Bloc suivant »");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await toInterlude(p);
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await settle(p);
  await p.clock.runFor(10_000);
  await p.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await settle(p);
  ok(
    'dix secondes de pause ne le font pas partir',
    (await p.locator('[data-next-block]').count()) === 1
  );
  await p.clock.runFor(3_500);
  await settle(p);
  ok(
    '  → il repart de là où il était, et s’efface',
    (await p.locator('[data-next-block]').count()) === 0
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
