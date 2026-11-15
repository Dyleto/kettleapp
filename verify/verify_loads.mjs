/**
 * « Compléter mes charges » : la séance, mouvement par mouvement, et ses
 * séries en pastilles.
 *
 * Il remplace une question — « Tu veux noter tes charges ? » — et un
 * formulaire de champs vides sous chaque exercice. Ce qui a été noté en route
 * est déjà là ; une série vide se note d'un toucher, à la charge proposée ;
 * une série qui suit une série vide ne s'ouvre pas, parce qu'une série vide
 * arrête l'exercice et qu'on y perdait ce qu'on notait au-delà.
 */
import {
  BASE,
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  passBlock,
  skipRest,
  finishFromPause,
  dialogs,
  clean,
} from './common.mjs';

const browser = await launch();
const settle = (p) => p.waitForTimeout(300);

const performedOf = (p, id) =>
  p.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(`kettle-seance-${key}`) || '{}')
        .performed ?? {},
    id
  );
/** Les pastilles d'un mouvement : leur nom, et si elles s'ouvrent. */
const chips = (p, key) =>
  p.evaluate((k) => {
    const row = document.querySelector(`[data-load-row="${k}"]`);
    return [...(row?.querySelectorAll('button') ?? [])]
      .filter((b) => !/^Même charge/.test(b.textContent ?? ''))
      .filter((b) => !b.closest('[role="group"]'))
      .map((b) => ({
        name: b.getAttribute('aria-label') ?? '',
        disabled: b.getAttribute('aria-disabled') === 'true',
      }))
      .filter((b) => !/kilo de/.test(b.name));
  }, key);

// ── Depuis l'écran de fin ───────────────────────────────────────────────
{
  console.log('\n── ce qui a été noté en route est déjà là');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  await passBlock(p);
  // Cinq séries cochées : les quatre du Goblet, la première des fentes.
  for (let i = 0; i < 5; i++) {
    const done = p.getByRole('button', { name: /^(Série faite|Fait)$/ });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(250);
    await skipRest(p);
  }
  await finishFromPause(p);
  await p
    .getByRole('button', { name: 'Compléter mes charges', exact: true })
    .click();
  await settle(p);

  const goblet = (await chips(p, '2:1')).map((c) => clean(c.name));
  ok(
    'les quatre séries du Goblet, en pastilles pleines',
    goblet.length === 4 &&
      goblet.every((n) => /^série \d — 26 kg, à corriger$/.test(n)),
    goblet.join(' · ')
  );
  const lunges = await chips(p, '2:2');
  ok(
    'aux fentes : la première notée, la deuxième à noter, la troisième fermée',
    lunges.length === 3 &&
      /— 12 kg, à corriger$/.test(clean(lunges[0].name)) &&
      /^Noter la charge — Fentes marchées, série 2$/.test(lunges[1].name) &&
      lunges[2].disabled,
    lunges
      .map((c) => `${clean(c.name)}${c.disabled ? ' (fermée)' : ''}`)
      .join(' · ')
  );

  await p
    .getByRole('button', { name: 'Noter la charge — Fentes marchées, série 2' })
    .click();
  await settle(p);
  ok(
    'un toucher note la série à la charge proposée, celle d’avant',
    JSON.stringify((await performedOf(p, 'sess2'))['2:2']?.sets) ===
      '[{"weight":12},{"weight":12}]',
    JSON.stringify((await performedOf(p, 'sess2'))['2:2'])
  );
  await p
    .locator('[data-load-row="2:2"]')
    .getByRole('button', { name: 'Un kilo de plus' })
    .click();
  await settle(p);
  ok(
    '  → et le sélecteur s’ouvre pour la corriger',
    (await performedOf(p, 'sess2'))['2:2']?.sets?.[1]?.weight === 13,
    JSON.stringify((await performedOf(p, 'sess2'))['2:2'])
  );
  await p
    .getByRole('button', { name: 'Même charge pour les trois séries' })
    .click();
  await settle(p);
  ok(
    '« Même charge pour les trois séries » recopie la première',
    JSON.stringify((await performedOf(p, 'sess2'))['2:2']?.sets) ===
      '[{"weight":12},{"weight":12},{"weight":12}]',
    JSON.stringify((await performedOf(p, 'sess2'))['2:2'])
  );

  await p.getByRole('button', { name: 'OK', exact: true }).click();
  await settle(p);
  ok(
    '« OK » ramène à l’écran de fin',
    /Séance arrêtée/.test(await dialogs(p)),
    (await dialogs(p)).split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await ctx.close();
}

// ── Déclarée faite sans le mode guidé ───────────────────────────────────
{
  console.log(
    '\n── « J’ai terminé cette séance » : les charges, puis le ressenti'
  );
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/session/sess1`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /J'ai terminé cette séance/ }).click();
  await settle(p);
  const t = await dialogs(p);
  ok(
    'pas de question : « Mes charges » directement',
    /Mes charges/.test(t) && !/Tu veux noter tes charges/i.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  ok(
    '  → sans la corde à sauter, qui ne se pèse pas',
    !/Corde à sauter/.test(t) && /Mountain Climbers/.test(t)
  );
  await p.getByRole('button', { name: 'Continuer', exact: true }).click();
  await p.waitForTimeout(800);
  ok(
    '« Continuer » mène au ressenti',
    /Alors, cette séance/.test(await dialogs(p))
  );
  await ctx.close();

  const ctx2 = await browser.newContext(MOBILE);
  const q = await signIn(ctx2);
  await q.goto(`${BASE}/client/session/sess1`, {
    waitUntil: 'domcontentloaded',
  });
  await q.waitForTimeout(1700);
  await q.getByRole('button', { name: /J'ai terminé cette séance/ }).click();
  await settle(q);
  await q.getByRole('button', { name: 'Revenir à la séance' }).click();
  await settle(q);
  ok(
    'la flèche revient à la séance, sans rien envoyer',
    (await q.locator('[role="dialog"]').count()) === 0 &&
      (await q
        .getByRole('button', { name: /J'ai terminé cette séance/ })
        .count()) === 1
  );
  await ctx2.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
