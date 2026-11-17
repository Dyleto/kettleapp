/**
 * La séance guidée sur grand écran : une tablette posée en largeur, un
 * ordinateur au sol.
 *
 * Elle s'y affichait dans une boîte de 560 px au milieu d'un voile — l'écran
 * du téléphone, centré, lu à trois mètres. Elle prend maintenant la place,
 * sur deux colonnes : la série à gauche, le bloc entier et le plan de la
 * séance à droite. Et elle se mène au clavier : Espace valide, P met en
 * pause, ← et → reculent et avancent.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  settle,
  skipRest,
  pastInterlude,
  timerLabel,
} from './common.mjs';

const browser = await launch();
const WIDE = { viewport: { width: 1280, height: 800 } };

/** La séance 2, au bloc « Renfo » : on passe le Tabata par la pause. */
const reachRenfo = async (p) => {
  await start(p, 'sess2');
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await settle(p);
  await p
    .locator('[role="dialog"][aria-label="Pause"]')
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await pastInterlude(p);
};
const box = (p, selector) =>
  p.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find(
      (e) => e.offsetParent !== null
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
    };
  }, selector);
/** Ce que l'appareil a gardé de la séance 2. */
const record = (p) =>
  p.evaluate(() =>
    JSON.parse(localStorage.getItem('kettle-seance-sess2') || '{}')
  );
/** Rien n'a le focus : une touche va à la page, comme au pied d'une
 * tablette qu'on n'a pas touchée. */
const blur = (p) =>
  p.evaluate(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement.blur()
      : null
  );
const press = async (p, key) => {
  await blur(p);
  await p.keyboard.press(key);
  await settle(p);
};

{
  console.log('\n── la série sur deux colonnes, avec le plan de la séance');
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await reachRenfo(p);
  const hero = await box(p, '[data-set-hero]');
  const side = await box(p, '[data-list-side]');
  ok(
    'la série à gauche, le bloc entier à droite',
    hero && side && hero.right <= side.left && side.left > 640,
    `${JSON.stringify(hero)} · ${JSON.stringify(side)}`
  );
  const button = await box(p, '[data-guided-primary]');
  ok(
    '  → « Série faite » sous la série, dans l’écran',
    button && button.right <= side.left && button.bottom <= 800,
    JSON.stringify(button)
  );
  const outline = await p.evaluate(() => {
    const el = document.querySelector('[data-session-outline]');
    if (!el || el.offsetParent === null) return null;
    return {
      states: [...el.querySelectorAll('[data-outline-state]')].map((li) =>
        li.getAttribute('data-outline-state')
      ),
      text: el.innerText,
    };
  });
  ok(
    'le plan de la séance dit le bloc fait et celui en cours',
    JSON.stringify(outline?.states) === '["done","now"]' &&
      /Tabata/.test(outline?.text ?? '') &&
      /Renfo/.test(outline?.text ?? ''),
    JSON.stringify(outline)
  );
  ok(
    '  → et les raccourcis du clavier',
    /Espace : valider · P : pause/.test(outline?.text ?? ''),
    outline?.text
  );
  await ctx.close();
}

{
  console.log('\n── au téléphone, rien ne change');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachRenfo(p);
  const hero = await box(p, '[data-set-hero]');
  const side = await box(p, '[data-list-side]');
  ok(
    'la série au-dessus du bloc, et pas de plan',
    hero &&
      side &&
      hero.bottom <= side.top &&
      (await box(p, '[data-session-outline]')) === null,
    `${JSON.stringify(hero)} · ${JSON.stringify(side)}`
  );
  await ctx.close();
}

{
  console.log('\n── au clavier');
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await reachRenfo(p);

  await press(p, 'Space');
  ok(
    'Espace coche la série en cours',
    (await record(p)).done?.includes('2:1:1'),
    JSON.stringify((await record(p)).done)
  );
  await press(p, 'Space');
  ok(
    '  → et, pendant le repos, le passe',
    (await p.locator('[data-rest]').count()) === 0 &&
      (await p.locator('[data-set-hero="2:1:2"]').count()) === 1
  );
  const before = (await record(p)).done ?? [];
  await press(p, 'ArrowLeft');
  ok(
    '← revient sur la série précédente',
    before.includes('2:1:1') && !(await record(p)).done?.includes('2:1:1'),
    `${JSON.stringify(before)} → ${JSON.stringify((await record(p)).done)}`
  );

  await press(p, 'p');
  ok(
    'P met en pause',
    (await p.locator('[role="dialog"][aria-label="Pause"]').count()) === 1
  );
  await press(p, 'Space');
  ok(
    '  → et la pause ouverte, Espace ne coche rien derrière elle',
    !(await record(p)).done?.includes('2:1:1'),
    JSON.stringify((await record(p)).done)
  );
  await p.keyboard.press('Escape');
  await settle(p);

  await p.locator('[data-set-hero] input[aria-label^="Poids utilisé"]').focus();
  await p.keyboard.press('Space');
  await settle(p);
  ok(
    'dans un champ, Espace s’écrit et ne coche rien',
    !(await record(p)).done?.includes('2:1:1'),
    JSON.stringify((await record(p)).done)
  );

  await press(p, 'ArrowRight');
  ok(
    '→ passe l’exercice en cours',
    (await record(p)).skipped?.includes('2:1'),
    JSON.stringify((await record(p)).skipped)
  );
  await ctx.close();
}

{
  console.log('\n── un EMOM sur grand écran');
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 2; i++) {
    await p.getByRole('button', { name: /^(Fait|Série faite)$/ }).click();
    await settle(p);
    await skipRest(p);
  }
  await pastInterlude(p);
  const ring = await box(p, '[role="timer"]');
  const lines = await box(
    p,
    '[aria-label="Séance guidée"] [data-guided-primary]'
  );
  ok(
    'le temps en grand, à gauche des doses',
    ring && ring.right - ring.left >= 400 && ring.right < 640,
    JSON.stringify(ring)
  );
  await press(p, 'Space');
  await press(p, 'Space');
  ok(
    'Espace lance le bloc, puis franchit son décompte',
    / secondes restantes$/.test((await timerLabel(p)) ?? ''),
    `${await timerLabel(p)} · ${JSON.stringify(lines)}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
