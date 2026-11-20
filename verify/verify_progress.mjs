/**
 * Progrès (F2) : les records, « Tes mouvements » en courbes, et la feuille
 * d'un mouvement.
 *
 * L'ancien écran ouvrait sur un calendrier, et rangeait « 20 → 24 → 26 kg »
 * dans une colonne étroite dessous. La maquette met en tête les records,
 * puis une ligne par mouvement : sa dernière charge, une courbe, l'écart
 * depuis le premier passage — sarcelle quand ça monte, bleu quand ça
 * baisse, sans jugement.
 *
 * Le décor : six séances du 12 au 30 août. Le goblet passe par 24, 20, 24
 * puis 26 kg (le 19 août en classique, quatre séries différentes) ; le
 * swing par 16, 20, 20 ; les fentes par 16 puis 12.
 */
import {
  API,
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  gone,
} from './common.mjs';

const WIDE = { viewport: { width: 1280, height: 900 } };
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .then((t) => t.replace(/\s+/g, ' ').trim())
    .catch(() => '');
const texts = (locator) =>
  locator.evaluateAll((nodes) =>
    nodes.map((n) => n.innerText.replace(/\s+/g, ' ').trim())
  );

const browser = await launch();

/** `history` remplace l'historique du serveur d'essai, quand la partie en
 * demande un autre. */
const open = async (options = MOBILE, history) => {
  const ctx = await browser.newContext(options);
  if (history)
    await ctx.route(/\/api\/client\/history(\?|$)/, (route) =>
      route.fulfill({ json: { history } })
    );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};

{
  console.log('\n── les records et les mouvements');
  const { ctx, p } = await open();
  const records = await texts(p.locator('[data-record]'));
  ok(
    'deux records, les plus récents, la valeur en grand et ce qu’elle récompense',
    records.join(' | ') ===
      'RECORD 26 kg Goblet Squat | RECORD 20 kg Kettlebell Swing',
    records.join(' | ')
  );

  const rows = await texts(p.locator('[data-movement]'));
  ok(
    'une ligne par mouvement chargé : la dernière charge, le nombre de séances, l’écart',
    rows.join(' | ') ===
      'Kettlebell Swing 20 kg · 3 séances + 4 kg | Goblet Squat 26 kg · 4 séances + 2 kg | Fentes marchées 12 kg · 2 séances − 4 kg',
    rows.join(' | ')
  );

  const colorOf = (name) =>
    p
      .locator('[data-movement]')
      .filter({ hasText: name })
      .locator('[data-curve]')
      .evaluate((svg) => getComputedStyle(svg).color)
      .catch(() => '');
  ok(
    '  → une courbe chacun, sarcelle qui monte, bleue qui baisse',
    (await colorOf('Kettlebell Swing')) !==
      (await colorOf('Fentes marchées')) &&
      (await colorOf('Fentes marchées')) === 'rgb(127, 169, 224)',
    `${await colorOf('Kettlebell Swing')} · ${await colorOf('Fentes marchées')}`
  );

  // Sur téléphone, le calendrier est replié derrière « Filtrer par date ».
  // L'ordre à l'écran, par la hauteur, et non celui du document : une
  // grille peut les intervertir sans toucher au document.
  const order = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        'main [data-records], main [data-movements], main button'
      ),
    ]
      .filter(
        (n) =>
          n.hasAttribute('data-records') ||
          n.hasAttribute('data-movements') ||
          n.textContent?.trim() === 'Filtrer par date'
      )
      .map((n) => ({
        top: n.getBoundingClientRect().top,
        name: n.hasAttribute('data-records')
          ? 'records'
          : n.hasAttribute('data-movements')
            ? 'mouvements'
            : 'calendrier',
      }))
      .sort((a, b) => a.top - b.top)
      .map((n) => n.name)
  );
  ok(
    'sur téléphone, les records et les mouvements passent avant le calendrier',
    order.join(',') === 'records,mouvements,calendrier',
    order.join(', ')
  );

  await p
    .locator('[data-movement]')
    .filter({ hasText: 'Goblet Squat' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Goblet Squat' });
  const passages = await texts(sheet.locator('[data-passage]'));
  ok(
    'un mouvement ouvre sa feuille : chaque passage, le plus récent d’abord, avec son format',
    passages.join(' | ') ===
      '30 août · EMOM 12 reps · 26 kg Record | 26 août · EMOM 12 reps · 24 kg | 22 août · EMOM 12 reps · 20 kg | 19 août · Classique 12 × 24 kg · 12 × 24 kg · 10 × 24 kg · 8 × 22 kg',
    passages.join(' | ')
  );
  ok(
    '  → sa courbe en grand, et l’écart en tête',
    (await sheet.locator('[data-curve] polygon').count()) === 1 &&
      (await text(sheet.locator('[data-movement-sheet]'))) ===
        'Goblet Squat + 2 kg'
  );
  await p.keyboard.press('Escape');
  await gone(sheet);
  ok('  → Échap la referme', (await p.getByRole('dialog').count()) === 0);

  await p
    .locator('[data-record]')
    .filter({ hasText: 'Kettlebell Swing' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const swing = p.getByRole('dialog', { name: 'Kettlebell Swing' });
  const swingPassages = await texts(swing.locator('[data-passage]'));
  // Refaire 20 kg le 30 ne rend pas le record plus neuf : il reste au 26.
  ok(
    'une carte de record ouvre la feuille de son mouvement, le record à sa date',
    swingPassages.join(' | ') ===
      '30 août · EMOM 15 reps · 20 kg | 26 août · EMOM 15 reps · 20 kg Record | 22 août · EMOM 15 reps · 16 kg',
    swingPassages.join(' | ')
  );
  await ctx.close();
}

{
  console.log('\n── un passage, et beaucoup de mouvements');
  // Une seule séance, huit mouvements chargés : ni courbe ni écart, et la
  // liste se replie à six.
  const base = (await (await fetch(`${API}/api/client/history`)).json())
    .history[0];
  const one = {
    ...base,
    _id: 'unique',
    blocks: [
      {
        type: 'classic',
        order: 1,
        exercises: Array.from({ length: 8 }, (_, i) => ({
          exercise: { _id: `ex-${i + 1}`, name: `Mouvement ${i + 1}` },
          order: i + 1,
          sets: 1,
          reps: 10,
          performed: { sets: [{ weight: 10 + i, reps: 10 }] },
        })),
      },
    ],
  };
  const { ctx, p } = await open(MOBILE, [one]);
  const rows = p.locator('[data-movement]');
  const shown = await rows.count();
  const plain =
    (await rows.locator('[data-curve]').count()) === 0 &&
    !/[+−] \d/.test(await text(p.locator('[data-movements]')));
  await p
    .getByRole('button', { name: 'Voir tes 8 mouvements' })
    .click({ timeout: 2000 })
    .catch(() => {});
  ok(
    'un seul passage : la valeur seule, sans courbe ni écart',
    plain && (await text(rows.first())) === 'Mouvement 1 10 kg · 1 séance',
    await text(rows.first())
  );
  ok(
    '  → au-delà de six mouvements, la liste se déplie à la demande',
    shown === 6 &&
      (await rows.count()) === 8 &&
      (await p.getByRole('button', { name: 'Voir moins' }).count()) === 1,
    `${shown} puis ${await rows.count()}`
  );
  await ctx.close();
}

{
  console.log('\n── avant la première séance');
  const { ctx, p } = await open(MOBILE, []);
  ok(
    'rien à montrer : le personnage, une phrase, et le programme',
    (await p.getByText('Rien à montrer encore').count()) === 1 &&
      (await p.getByRole('button', { name: 'Voir mon programme' }).count()) ===
        1 &&
      (await p.locator('[data-records], [data-movements]').count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── sur grand écran');
  const { ctx, p } = await open(WIDE);
  const left = await p
    .locator('[data-movements]')
    .evaluate((el) => el.getBoundingClientRect().left)
    .catch(() => -1);
  const calendar = await p
    .locator('[aria-label^="Séances de"]')
    .first()
    .evaluate((el) => el.getBoundingClientRect().left)
    .catch(() => -1);
  ok(
    'les records et les mouvements à gauche, le mois et les séances à droite',
    left >= 0 && calendar > left + 300,
    `${left} · ${calendar}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
