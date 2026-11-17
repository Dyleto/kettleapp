/**
 * Le repos entre deux séries : une carte à la place de la série en cours,
 * et le bloc toujours lisible dessous.
 *
 * Il a pris tout l'écran : on cochait « Fait », et le bloc qu'on était en
 * train de lire disparaissait derrière un mur turquoise. Retour du terrain :
 * « pas agréable de se retrouver d'un coup avec un REPOS en pleine page ».
 * Il est ensuite devenu une bande de 56 px glissée dans la liste, qu'on ne
 * lisait pas de loin, et pendant laquelle « Fait » restait sous le pouce :
 * on cochait la série suivante par habitude, en soufflant.
 *
 * Il est maintenant une carte : l'anneau et les secondes, ce qui vient, et
 * la charge de la série suivante — c'est en soufflant qu'on charge sa
 * barre. La liste reste dessous, et le pied ne propose que « + 15 s » et
 * « Passer ».
 *
 * Le temps est mené à la main pour la fin du repos : on y vérifie que la
 * série suivante revient d'elle-même, sans geste.
 */
import {
  API,
  COACHES,
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  settle,
  pastInterlude,
} from './common.mjs';

const CARD = '[data-rest]';

/** Les secondes que la carte annonce, lues sur son nom. */
const restSeconds = (p) =>
  p
    .locator(CARD)
    .getAttribute('aria-label', { timeout: 1000 })
    .then((label) => Number(label?.match(/(\d+) secondes/)?.[1] ?? NaN))
    .catch(() => NaN);

const press = async (p, name) => {
  const button = p.getByRole('button', { name, exact: true });
  if (!(await button.count())) return false;
  await button
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  return true;
};

/** La séance 2, au bloc « Renfo », et sa première série cochée à 26 kg. */
const tickOneSet = async (p) => {
  await start(p, 'sess2');
  await press(p, 'Mettre la séance en pause');
  await p
    .locator('[role="dialog"][aria-label="Pause"]')
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await pastInterlude(p);
  await p
    .locator('[data-set-hero] input')
    .fill('26')
    .catch(() => {});
  await settle(p);
  await press(p, 'Série faite');
  await settle(p);
};

/** Ce qui a été noté pour le Goblet Squat, série par série. */
const gobletWeights = (p) =>
  p.evaluate(() => {
    const raw = localStorage.getItem('kettle-seance-sess2');
    const stored = raw ? JSON.parse(raw) : null;
    return (stored?.performed?.['2:1']?.sets ?? []).map((s) => s?.weight);
  });

const browser = await launch();

{
  console.log('\n── le repos prend la place de la série, pas celle du bloc');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  ok(
    'une carte de repos apparaît après la série',
    (await p.locator(CARD).count()) === 1
  );
  const seconds = await restSeconds(p);
  ok(
    '  → avec le repos prescrit : une minute',
    seconds >= 58 && seconds <= 60,
    `${seconds} s`
  );
  const card = (
    await p
      .locator(CARD)
      .innerText()
      .catch(() => '')
  )
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\n+/g, ' | ');
  ok(
    '  → et ce qui vient, avec sa charge',
    card.includes('Goblet Squat · série 2 sur 4') &&
      card.includes('10 reps à 26 kg'),
    card
  );

  // La liste du bloc reste à l'écran, sous la carte.
  const next = await p.evaluate(() => {
    const row = document.querySelector(
      '[aria-label="Séance guidée"] [aria-current="step"]'
    );
    if (!row) return null;
    const r = row.getBoundingClientRect();
    const onTop = document.elementFromPoint(r.left + 8, r.top + r.height / 2);
    return {
      visible: r.top >= 0 && r.bottom <= innerHeight - 90,
      covered: !row.contains(onTop),
    };
  });
  ok(
    'la série suivante reste lisible dans la liste, sous le repos',
    next !== null && next.visible && !next.covered,
    JSON.stringify(next)
  );
  ok(
    '  → et toutes les séries du bloc y sont',
    (await p
      .locator('[aria-label="Séance guidée"]')
      .getByText(/série \d \/ [34]/)
      .count()) === 7
  );

  ok(
    'pendant le repos, aucun bouton ne coche la série suivante',
    (await p
      .getByRole('button', { name: /^(Fait|Série faite|Palier fait)$/ })
      .count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── on prépare la série suivante en soufflant');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  await press(p, 'Un kilo de plus');
  await press(p, 'Un kilo de plus');
  ok(
    'la charge de la série suivante se règle pendant le repos',
    (await gobletWeights(p))[1] === 28,
    JSON.stringify(await gobletWeights(p))
  );
  ok(
    '  → sans toucher à celle de la série faite',
    (await gobletWeights(p))[0] === 26,
    JSON.stringify(await gobletWeights(p))
  );

  const before = await restSeconds(p);
  await press(p, 'Quinze secondes de repos de plus');
  const after = await restSeconds(p);
  ok(
    '« + 15 s » rallonge le repos de quinze secondes',
    after - before >= 14 && after - before <= 15,
    `${before} s → ${after} s`
  );

  await press(p, 'Passer');
  ok('« Passer » termine le repos', (await p.locator(CARD).count()) === 0);
  const hero = await p
    .locator('[data-set-hero]')
    .innerText({ timeout: 2000 })
    .catch(() => '');
  ok(
    '  → la série suivante revient en grand, avec la charge réglée',
    /SÉRIE 2 SUR 4/.test(hero) &&
      (await p.locator('[data-set-hero] input').inputValue()) === '28',
    hero.replace(/\n+/g, ' | ')
  );
  ok(
    '  → et la série cochée le reste',
    /1 sur 7 faits/.test(
      await p.locator('[aria-label="Séance guidée"]').innerText()
    )
  );
  await ctx.close();
}

{
  console.log('\n── la fin du repos ramène la série, sans geste');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await tickOneSet(p);
  ok('le repos a commencé', (await p.locator(CARD).count()) === 1);
  await p.clock.runFor(61_000);
  await settle(p);
  ok(
    'à zéro, la carte de repos s’efface d’elle-même',
    (await p.locator(CARD).count()) === 0
  );
  ok(
    '  → et la série suivante est là',
    (await p.locator('[data-set-hero]').count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── aucun repos là où le coach n’en a prescrit aucun');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Le chipper de la séance 3 ne prescrit aucun repos entre ses
  // mouvements.
  await start(p, 'sess3');
  await press(p, 'Fait');
  ok(
    "un bloc sans repos prescrit n'affiche aucune carte de repos",
    (await p.locator(CARD).count()) === 0 &&
      (await p.locator('[data-set-hero]').count()) === 1
  );
  await ctx.close();
}

// ── Entre deux blocs ────────────────────────────────────────────────────
//
// Le repos entre deux blocs passait par l'ancien minuteur : une jauge en
// plein écran sarcelle, « Ensuite : … » en petit, et « Précédent » à côté
// de « Passer ». Deux repos, deux dessins, pour le même geste. Il prend
// maintenant la carte du repos entre deux séries.
//
// Le décor n'a pas de séance de cette forme : on la compose à partir de la
// séance 2, un bloc d'une série suivi de trente secondes de repos.

/** Une séance de deux blocs, trente secondes de repos entre eux ; l'horloge
 * de la page est menée à la main quand `clock` le demande. */
const withBlockRest = async (ctx, { clock = false } = {}) => {
  const { program } = await (await fetch(`${API}/api/client/program`)).json();
  const base = program.sessions.find((s) => s._id === 'sess2');
  const classic = base.blocks.find((b) => b.type === 'classic');
  const session = {
    ...base,
    _id: 'sess-breath',
    order: 9,
    name: 'Souffle',
    blocks: [
      {
        ...classic,
        _id: 'breath-a',
        order: 1,
        label: 'Renfo A',
        restBetweenRounds: 30,
        exercises: [{ ...classic.exercises[0], sets: 1 }],
      },
      { ...classic, _id: 'breath-b', order: 2, label: 'Renfo B' },
    ],
  };
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...program, sessions: [...program.sessions, session] },
        coaches: COACHES,
      },
    })
  );
  const p = await signIn(ctx);
  if (clock) await p.clock.install();
  await start(p, 'sess-breath');
  await press(p, 'Fait');
  await settle(p);
  return { p, next: classic.exercises[0].exercise.name };
};

{
  console.log('\n── entre deux blocs, la même carte de repos');
  const ctx = await browser.newContext(MOBILE);
  const { p, next } = await withBlockRest(ctx);
  const seconds = await restSeconds(p);
  ok(
    'entre deux blocs, le repos prend la carte des séries',
    (await p.locator(CARD).count()) === 1 && seconds >= 28 && seconds <= 30,
    `${await p.locator(CARD).count()} carte(s), ${seconds} s`
  );
  const card = (
    await p
      .locator(CARD)
      .innerText()
      .catch(() => '')
  ).replace(/\n+/g, ' | ');
  ok('→ et annonce ce qui vient', card.includes(next), card);
  // Ce repos termine un bloc : il nomme le bloc qui vient, pas seulement son
  // premier mouvement.
  ok(
    '→ en nommant le bloc suivant',
    card.includes('Bloc suivant : Renfo B'),
    card
  );
  await press(p, 'Quinze secondes de repos de plus');
  const longer = await restSeconds(p);
  ok(
    '« + 15 s » le rallonge aussi',
    longer >= seconds + 13 && longer <= seconds + 15,
    `${seconds} s → ${longer} s`
  );
  await press(p, 'Passer');
  ok(
    '« Passer » mène au bloc suivant',
    (await p.locator(CARD).count()) === 0 &&
      (await p.locator('[data-set-hero]').count()) === 1,
    `${await p.locator(CARD).count()} carte(s)`
  );
  await ctx.close();
}

{
  console.log('\n── entre deux blocs, la fin du repos ramène le bloc suivant');
  const ctx = await browser.newContext(MOBILE);
  const { p } = await withBlockRest(ctx, { clock: true });
  ok(
    'le repos entre deux blocs a commencé',
    (await p.locator(CARD).count()) === 1
  );
  await p.clock.runFor(31_000);
  await settle(p);
  ok(
    'à zéro, le bloc suivant vient de lui-même',
    (await p.locator(CARD).count()) === 0 &&
      (await p.locator('[data-set-hero]').count()) === 1,
    `${await p.locator(CARD).count()} carte(s)`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
