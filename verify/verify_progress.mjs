/**
 * Progrès (F2, F3) : les records, « Tes mouvements » en courbes, la feuille
 * d'un mouvement, le mois et la liste des séances, et le détail d'une
 * séance — en panneau sur grand écran, en feuille sur téléphone — avec
 * « Corriger ».
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
const open = async (options = MOBILE, history, now) => {
  const ctx = await browser.newContext(options);
  if (history)
    await ctx.route(/\/api\/client\/history(\?|$)/, (route) =>
      route.fulfill({ json: { history } })
    );
  const p = await signIn(ctx);
  if (now) await p.clock.setFixedTime(now);
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  // L'historique là, ou l'écran vide : un sabotage qui fait recompiler la
  // page laissait `settle` rendre la main avant, et trois parties lisaient
  // un calendrier pas encore dessiné.
  await p
    .locator('main [data-session-row]')
    .or(p.getByText('Rien à montrer encore'))
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p };
};
const serverHistory = async () =>
  (await (await fetch(`${API}/api/client/history`)).json()).history;
// Le samedi 5 septembre : le mois en cours est celui d'après la dernière
// séance, et il n'y en a pas d'autre.
const SEPTEMBER = new Date('2026-09-05T10:00:00+02:00');

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

  // L'ordre à l'écran, par la hauteur, et non celui du document : une
  // grille peut les intervertir sans toucher au document.
  const order = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        'main [data-records], main [data-movements], main [data-calendar]'
      ),
    ]
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
  console.log('\n── le calendrier');
  const { ctx, p } = await open(MOBILE, undefined, SEPTEMBER);
  const calendar = p.locator('main [data-calendar]');
  const month = calendar.locator('[data-calendar-month]');
  const next = calendar.getByRole('button', { name: 'Mois suivant' });
  const first = await text(month);
  const zones = await calendar
    .locator('[data-day]')
    .evaluateAll((days) => days.map((d) => d.dataset.zone).join(','));
  await next.click({ timeout: 2000 }).catch(() => {});
  const second = await text(month);
  ok(
    'toujours là : une pastille par séance, à la couleur de son effort, sur le mois de la dernière',
    first === 'Août 2026' &&
      zones === 'target,none,hard,target,hard,hard' &&
      (await p.getByText('Filtrer par date').count()) === 0,
    `${first} · ${zones}`
  );
  ok(
    '  → ses flèches s’arrêtent au mois en cours : pas de mois futur',
    second === 'Septembre 2026' && (await next.isDisabled()),
    `${second} · suivant ${(await next.isDisabled()) ? 'éteint' : 'actif'}`
  );
  await calendar
    .getByRole('button', { name: 'Mois précédent' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await calendar
    .locator('[data-day="2026-08-30"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → une pastille ouvre sa séance',
    (await text(p.getByRole('dialog'))).includes('Dur sur la fin.'),
    (await text(p.getByRole('dialog'))).slice(0, 80)
  );
  await ctx.close();
}

{
  console.log('\n── deux séances le même jour');
  const history = await serverHistory();
  const morning = {
    ...history.find((c) => c._id === 'cs5'),
    _id: 'matin',
    completedAt: '2026-08-30T07:00:00.000Z',
    clientNotes: 'Réveil difficile.',
  };
  const { ctx, p } = await open(MOBILE, [morning, ...history]);
  const day = p.locator('main [data-calendar] [data-day="2026-08-30"]');
  const label = await day.getAttribute('aria-label').catch(() => null);
  await day.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Dimanche 30 août' });
  const rows = await texts(sheet.locator('[data-session-row]'));
  await sheet
    .locator('[data-session-row="matin"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'la pastille d’un jour à deux séances ouvre la liste des deux',
    label === 'dimanche 30 août : 2 séances' && rows.length === 2,
    `${label} · ${rows.join(' | ')}`
  );
  ok(
    '  → et chacune s’ouvre de là',
    (await text(p.getByRole('dialog').last())).includes('Réveil difficile.'),
    (await text(p.getByRole('dialog').last())).slice(0, 80)
  );
  await ctx.close();
}

{
  console.log('\n── tes séances');
  // Une réponse du coach sur la dernière, et une correction sur celle du
  // 22 : les deux mentions que le décor ne porte pas.
  const history = (await serverHistory()).map((c) =>
    c._id === 'cs6'
      ? {
          ...c,
          replies: [
            {
              coachId: 'coach-julie',
              firstName: 'Julie',
              text: 'Bien joué.',
              sentAt: '2026-08-31T08:00:00.000Z',
            },
          ],
        }
      : c._id === 'cs4'
        ? { ...c, editedAt: '2026-09-02T10:00:00.000Z' }
        : c
  );
  const { ctx, p } = await open(MOBILE, history);
  const rows = await texts(p.locator('main [data-session-row]'));
  ok(
    'une ligne par séance, la plus récente d’abord : son nom, sa date, ce qu’il y a à savoir, son ressenti',
    rows.join(' | ') ===
      [
        'Full body A dim. 30 août · Julie a répondu Trop dure',
        'Full body A mer. 26 août Dure',
        'Full body A sam. 22 août · corrigée le 2 sept. Juste',
        'Haut du corps mer. 19 août Dure',
        'Full body A dim. 16 août · ancien bilan',
        'Séance 3 mer. 12 août · modifiée depuis Juste',
      ].join(' | '),
    rows.join(' | ')
  );
  await p
    .locator('main [data-session-row="cs5"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → une ligne ouvre sa séance',
    (await text(p.getByRole('dialog'))).includes(
      'Épaule un peu sensible sur les swings.'
    ),
    (await text(p.getByRole('dialog'))).slice(0, 80)
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

const lines = (scope) =>
  scope
    .locator('[data-done-line]')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.innerText.replace(/\s+/g, ' ').trim())
    )
    .catch(() => []);
const recordLines = (scope) =>
  scope
    .locator('[data-done-line][data-record]')
    .evaluateAll((nodes) => nodes.map((n) => n.innerText.split('\n')[0].trim()))
    .catch(() => []);

{
  console.log('\n── le détail d’une séance');
  // Une réponse de Julie, pas encore lue, sur la dernière.
  const reply = {
    coachId: 'coach-julie',
    firstName: 'Julie',
    text: 'Bien joué, on garde 26.',
    sentAt: '2026-08-31T08:00:00.000Z',
  };
  const history = (await serverHistory()).map((c) =>
    c._id === 'cs6' ? { ...c, replies: [reply] } : c
  );
  const { ctx, p } = await open(MOBILE, history);
  const reads = [];
  await ctx.route(/\/replies\/read$/, (route) => {
    reads.push(route.request().url());
    return route.fulfill({
      json: {
        completed: {
          ...history.find((c) => c._id === 'cs6'),
          replies: [{ ...reply, readAt: '2026-09-01T08:00:00.000Z' }],
        },
      },
    });
  });
  await p
    .locator('main [data-session-row="cs6"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  // Lue sans son nom : un nom cassé ne doit faire tomber que l'assertion
  // qui le regarde.
  const sheet = p.getByRole('dialog');
  const name = await sheet.getAttribute('aria-label').catch(() => null);
  ok(
    'sur téléphone, une séance s’ouvre en feuille, nommée par sa date',
    (await sheet.count()) === 1 && name === 'Full body A · Dimanche 30 août',
    name ?? '(aucune feuille)'
  );
  const feeling = sheet.locator('[data-detail-feeling]');
  ok(
    '→ son ressenti : le visage, le mot, et ce qu’il veut dire',
    (await text(feeling)) === "Trop dure « je n'ai pas pu tout faire »" &&
      (await feeling.getAttribute('data-detail-feeling').catch(() => '')) ===
        'hard',
    await text(feeling)
  );
  const said = await text(sheet);
  ok(
    '→ ton mot, et sous lui la réponse de Julie, que l’ouvrir marque lue',
    /Ton mot Dur sur la fin\. Julie Bien joué, on garde 26\./i.test(said) &&
      reads.length === 1 &&
      reads[0].includes('/cs6/'),
    `${reads.length} lecture(s) · ${said.slice(0, 120)}`
  );
  const done = await lines(sheet);
  ok(
    '→ ce que tu as fait, mouvement par mouvement : le format et la dose, le fait en face',
    done.join(' | ') ===
      [
        'Corde à sauter Échauffement · 2 min fait',
        'Mountain Climbers Échauffement · 15 reps fait, sans charge notée',
        'Kettlebell Swing EMOM · 15 reps 15 reps · 20 kg',
        'Goblet Squat EMOM · 12 reps 12 reps · 26 kg Record',
        'Burpee AMRAP · 10 reps fait, sans charge notée',
        'Row (rameur) AMRAP · 1 min fait',
        'Fentes marchées AMRAP · 20 reps 20 reps · 12 kg',
      ].join(' | '),
    done.join(' | ')
  );
  // Le swing a fait 20 kg le 26 et le 30 : son record est au 26, et le 30
  // ne le porte pas.
  const here = await recordLines(sheet);
  await p.keyboard.press('Escape');
  await settle(p);
  await p
    .locator('main [data-session-row="cs5"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const before = await recordLines(p.getByRole('dialog'));
  ok(
    '→ un record se marque sur la seule séance qui l’a établi',
    here.join() === 'Goblet Squat' && before.join() === 'Kettlebell Swing',
    `30 août : ${here.join()} · 26 août : ${before.join()}`
  );
  // Ce qui s'affiche, et ce que dit le lecteur d'écran : l'attribut
  // `data-up` restait posé quand la flèche ne l'était plus.
  const arrows = (await lines(p.getByRole('dialog'))).filter((l) =>
    l.includes('↗')
  );
  ok(
    '→ une charge plus lourde que la fois d’avant porte sa flèche',
    arrows.join(' | ') ===
      'Goblet Squat EMOM · 12 reps 12 reps · 24 kg ↗ , plus lourd que la fois d’avant',
    arrows.join(' | ') || '(aucune flèche)'
  );
  await ctx.close();
}

{
  console.log('\n── l’ancien bilan');
  const { ctx, p } = await open();
  const patched = [];
  await ctx.route(/\/api\/client\/sessions\/completed\/[^/]+$/, (route) => {
    if (route.request().method() === 'PATCH')
      patched.push(route.request().postDataJSON());
    return route.fallback();
  });
  await p
    .locator('main [data-session-row="cs3"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog');
  ok(
    'un ancien bilan montre ses cinq axes, sans visage ni moyenne',
    (await text(sheet.locator('[data-legacy-metrics]'))) ===
      'Stress 1/5 Humeur 5/5 Énergie 4/5 Sommeil 5/5 Douleurs 1/5' &&
      (await sheet.locator('[data-detail-feeling]').count()) === 0,
    await text(sheet.locator('[data-legacy-metrics]'))
  );
  await p
    .getByRole('button', { name: 'Corriger' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const loads = p.getByRole('dialog', { name: 'Mes charges' });
  const save = loads.getByRole('button', { name: 'Enregistrer', exact: true });
  ok(
    '→ « Corriger » rouvre ses charges, et s’enregistre de là : aucun ressenti à inventer',
    (await loads.count()) === 1 &&
      (await save.count()) === 1 &&
      (await loads.getByRole('button', { name: 'Continuer' }).count()) === 0
  );
  await save.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    '→ rien de changé : rien n’est envoyé, et la séance revient',
    patched.length === 0 &&
      (await p.getByRole('dialog', { name: 'Mes charges' }).count()) === 0 &&
      (await p.getByRole('dialog', { name: 'Le ressenti' }).count()) === 0 &&
      (await p.locator('[data-legacy-metrics]').count()) === 1,
    `${patched.length} envoi(s)`
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
    .locator('main [data-calendar]')
    .evaluate((el) => el.getBoundingClientRect().left)
    .catch(() => -1);
  ok(
    'les records et les mouvements à gauche, le mois et les séances à droite',
    left >= 0 && calendar > left + 300,
    `${left} · ${calendar}`
  );

  const aside = p.getByRole('complementary', { name: 'Séance ouverte' });
  ok(
    'le panneau attend une séance, et dit ce qu’il montrera',
    /^Ouvre une séance/.test(await text(aside)),
    await text(aside)
  );
  const row = p.locator('main [data-session-row="cs6"]');
  await row.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  const list = await p
    .locator('main [data-session-list]')
    .evaluate((el) => el.getBoundingClientRect().right)
    .catch(() => -1);
  const panel = await aside
    .evaluate((el) => el.getBoundingClientRect().left)
    .catch(() => -1);
  ok(
    'une ligne ouvre sa séance dans le panneau, à droite de la liste, sans feuille',
    (await aside.locator('[data-completed-detail="cs6"]').count()) === 1 &&
      (await p.getByRole('dialog').count()) === 0 &&
      list > 0 &&
      panel > list,
    `liste jusqu’à ${list} · panneau dès ${panel}`
  );
  ok(
    '→ la ligne ouverte le dit',
    (await row.getAttribute('aria-current').catch(() => null)) === 'true' &&
      (await p
        .locator('main [aria-current="true"][data-session-row]')
        .count()) === 1
  );
  await ctx.close();
}

// En dernier : la correction s'enregistre sur le serveur d'essai, que les
// parties d'avant lisent tel qu'il démarre.
{
  console.log('\n── corriger une séance');
  const { ctx, p } = await open();
  const patched = [];
  await ctx.route(/\/api\/client\/sessions\/completed\/[^/]+$/, (route) => {
    if (route.request().method() === 'PATCH')
      patched.push(route.request().postDataJSON());
    return route.fallback();
  });
  await p
    .locator('main [data-session-row="cs4"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p
    .getByRole('button', { name: 'Corriger' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  // Le goblet du 22 : 20 kg, ramené à 19.
  await p
    .locator('[data-load-row="2:2"] button[aria-label$="à corriger"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('button', { name: 'Un kilo de moins' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('button', { name: 'Continuer', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const feeling = p.getByRole('dialog', { name: 'Le ressenti' });
  const date = feeling.getByRole('textbox', {
    name: 'Date de réalisation de la séance',
  });
  ok(
    '« Corriger » rouvre tes charges, puis ton ressenti tel que tu l’as laissé, date comprise',
    (await text(feeling.locator('h1'))) === 'Ton ressenti' &&
      (await feeling
        .getByRole('radio', { name: /^Juste/ })
        .getAttribute('aria-checked')
        .catch(() => null)) === 'true' &&
      (await date.inputValue().catch(() => '')) === '22/08/2026',
    `${await text(feeling.locator('h1'))} · ${await date.inputValue().catch(() => '(pas de date)')}`
  );
  await date.fill('21/08/2026').catch(() => {});
  await date.press('Enter').catch(() => {});
  await settle(p);
  await feeling
    .getByRole('button', { name: 'Enregistrer', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  const back = p.getByRole('dialog', {
    name: 'Full body A · Vendredi 21 août',
  });
  await back.waitFor({ timeout: 6000 }).catch(() => {});
  const [sent] = patched;
  ok(
    '→ n’envoie que ce qui a changé : une charge, le ressenti tel quel, et la date',
    patched.length === 1 &&
      JSON.stringify(sent.performed) ===
        JSON.stringify([
          { blockOrder: 2, exerciseOrder: 2, sets: [{ weight: 19, reps: 12 }] },
        ]) &&
      JSON.stringify(sent.feedback) === JSON.stringify({ effort: 3 }) &&
      sent.clientNotes === 'Bon rythme.' &&
      sent.completedAt === '2026-08-21',
    JSON.stringify(patched)
  );
  const after = await text(back);
  ok(
    '→ la séance revient corrigée : à sa nouvelle date, avec sa charge, et « Corrigée le »',
    (await lines(back)).includes(
      'Goblet Squat EMOM · 12 reps 12 reps · 19 kg'
    ) && /Corrigée le \d+ \p{L}+/u.test(after),
    after.slice(-80)
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
