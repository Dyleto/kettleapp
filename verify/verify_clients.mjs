/**
 * Clients (F4) : la liste du coach, triée par ce qui demande de
 * l'attention, trois chiffres en tête qui filtrent, la recherche, le menu
 * de tri et l'état vide.
 *
 * Le décor : les six clients de la maquette, au samedi 5 septembre midi.
 * Thomas a trois séances à lire, toutes « Juste » ; Sarah une, et ses deux
 * derniers ressentis sont durs ; Julien deux, ses deux derniers faciles ;
 * Karim n'a rien fait depuis trois semaines ; Manon vient d'arriver, sans
 * programme ; Léa est à jour.
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
} from './common.mjs';

const NOW = new Date('2026-09-05T12:00:00+02:00');
const ago = (days) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const row = (o) => ({
  unseenCount: 0,
  linkedAt: ago(90),
  tagIds: [],
  weekDone: 1,
  weekTarget: 3,
  sessionCount: 3,
  recentEfforts: [3, 3],
  lastCompletedAt: ago(2),
  ...o,
});
const ROSTER = [
  row({
    _id: 'lea',
    firstName: 'Léa',
    lastName: 'Dubois',
    weekDone: 2,
    weekTarget: 2,
    recentEfforts: [1, 3, 3],
    lastCompletedAt: ago(3),
  }),
  row({
    _id: 'karim',
    firstName: 'Karim',
    lastName: 'Haddad',
    weekDone: 0,
    recentEfforts: [3, 4],
    lastCompletedAt: ago(22),
  }),
  row({
    _id: 'sarah',
    firstName: 'Sarah',
    lastName: 'Martin',
    unseenCount: 1,
    weekDone: 1,
    recentEfforts: [3, 3, 3, 4, 5],
    lastCompletedAt: ago(1),
  }),
  row({
    _id: 'manon',
    firstName: 'Manon',
    lastName: 'Petit',
    weekDone: 0,
    weekTarget: 0,
    sessionCount: 0,
    recentEfforts: [],
    lastCompletedAt: undefined,
    linkedAt: ago(2),
  }),
  row({
    _id: 'thomas',
    firstName: 'Thomas',
    lastName: 'Bernard',
    unseenCount: 3,
    weekDone: 3,
    recentEfforts: [3, 3, 3, 3, 3],
    lastCompletedAt: ago(1),
  }),
  row({
    _id: 'julien',
    firstName: 'Julien',
    lastName: 'Moreau',
    unseenCount: 2,
    weekDone: 2,
    recentEfforts: [3, 3, 1, 1],
    lastCompletedAt: ago(3),
  }),
];
const WIDE = { viewport: { width: 1280, height: 800 } };

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .then((t) => t.replace(/\s+/g, ' ').trim())
    .catch(() => '');
/** Les lignes affichées, dans l'ordre de l'écran : le nom de chacune. */
const names = (p) =>
  p
    .locator('main [data-client-row]')
    .evaluateAll((rows) =>
      rows.map((r) => r.querySelector('p')?.textContent?.trim() ?? '')
    )
    .catch(() => []);

const browser = await launch();

const open = async (options = MOBILE, roster = ROSTER) => {
  const ctx = await browser.newContext(options);
  await ctx.route(/\/api\/coach\/clients(\?|$)/, (route) =>
    route.fulfill({ json: roster })
  );
  const p = await signIn(ctx);
  await p.clock.setFixedTime(NOW);
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .locator('main [data-client-row]')
    .or(p.getByText('Invite ton premier client'))
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p };
};

{
  console.log('\n── la liste');
  const { ctx, p } = await open();
  const tiles = await p
    .locator('main [data-tile]')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.innerText.replace(/\s+/g, ' ').trim())
    );
  ok(
    'trois chiffres en tête : six à lire chez trois clients, un à relancer, deux mal réglées',
    tiles.join(' | ') ===
      '6 à lire chez 3 clients | 1 à relancer 14 jours sans séance | 2 mal réglées deux fois de suite',
    tiles.join(' | ')
  );
  const order = await names(p);
  ok(
    'une ligne par client, ce qui demande de l’attention d’abord : à lire, à relancer, puis par activité',
    order.join(', ') ===
      'Thomas Bernard, Julien Moreau, Sarah Martin, Karim Haddad, Manon Petit, Léa Dubois',
    order.join(', ')
  );
  // Lu par client, et non par rang : un ordre cassé ne doit faire tomber
  // que l'assertion de l'ordre.
  const rows = Object.fromEntries(
    await p.locator('main [data-client-row]').evaluateAll((nodes) =>
      nodes.map((r) => {
        const line = r.querySelector('[data-status-line]');
        const ring = r.querySelectorAll('svg circle')[1];
        const week = r.querySelector('[data-week]');
        let shownWeek = week?.textContent?.trim() ?? '';
        if (ring) {
          const s = getComputedStyle(ring);
          const part =
            1 - parseFloat(s.strokeDashoffset) / parseFloat(s.strokeDasharray);
          shownWeek = `${week.innerText.trim()} (${Math.round(part * 100)} %)`;
        }
        return [
          r.getAttribute('data-client-row'),
          {
            text: line?.textContent?.trim() ?? '',
            color: line ? getComputedStyle(line).color : '',
            week: shownWeek,
            pulse:
              r.querySelector('[data-pulse]')?.getAttribute('aria-label') ??
              '—',
          },
        ];
      })
    )
  );
  const IDS = ['thomas', 'julien', 'sarah', 'karim', 'manon', 'lea'];
  const of = (key) => IDS.map((id) => rows[id]?.[key] ?? '(absent)');
  ok(
    '→ chacune sa ligne d’état, dite sans accorder',
    of('text').join(' | ') ===
      [
        '3 séances à lire',
        '2 à lire · trop facile',
        '1 à lire · devient trop dure',
        'rien depuis 3 semaines',
        'nouveau suivi · programme à écrire',
        'à jour',
      ].join(' | '),
    of('text').join(' | ')
  );
  // Ambre ce qui est à lire, bleu le trop facile, corail le trop dur et le
  // silence, gris le reste : quatre couleurs, lues à l'écran.
  const color = (id) => rows[id]?.color;
  ok(
    '→ à sa couleur : ambre, bleu, corail, gris',
    Object.keys(rows).length === 6 &&
      color('sarah') === color('karim') &&
      color('manon') === color('lea') &&
      new Set([
        color('thomas'),
        color('julien'),
        color('sarah'),
        color('manon'),
      ]).size === 4,
    of('color').join(' · ')
  );
  ok(
    '→ la semaine en anneau, rempli de ce qui est fait ; un tiret sans jour conseillé',
    of('week').join(' | ') ===
      '3/3 (100 %) | 2/3 (67 %) | 1/3 (33 %) | 0/3 (0 %) | — | 2/2 (100 %)',
    of('week').join(' | ')
  );
  ok(
    '→ les derniers ressentis en points, du plus ancien au plus récent ; aucun, rien',
    rows.sarah?.pulse ===
      'Derniers ressentis : juste, juste, juste, dure, dure' &&
      rows.julien?.pulse ===
        'Derniers ressentis : juste, juste, facile, facile' &&
      rows.manon?.pulse === '—',
    of('pulse').join(' | ')
  );
  // Mesuré contre la fenêtre du banc, jamais `innerWidth` : l'émulation
  // d'un téléphone l'élargit.
  const overflow = await p.evaluate(
    (width) =>
      [...document.querySelectorAll('main *')]
        .filter((el) => el.getBoundingClientRect().right > width + 1)
        .map((el) => el.tagName)
        .slice(0, 3),
    p.viewportSize().width
  );
  ok(
    'rien ne déborde à 390 px',
    p.viewportSize().width === 390 && overflow.length === 0,
    overflow.join(' | ')
  );
  await ctx.close();
}

{
  console.log('\n── les tuiles filtrent');
  const { ctx, p } = await open();
  const tile = (key) => p.locator(`main [data-tile="${key}"]`);
  await tile('silent')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const silent = await names(p);
  ok(
    'une tuile montre ce qu’elle compte : « à relancer », Karim seul',
    silent.join(', ') === 'Karim Haddad' &&
      (await tile('silent')
        .getAttribute('aria-pressed', { timeout: 2000 })
        .catch(() => null)) === 'true',
    silent.join(', ')
  );
  await tile('silent')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '→ la toucher de nouveau retire le filtre',
    (await names(p)).length === 6 &&
      (await tile('silent')
        .getAttribute('aria-pressed', { timeout: 2000 })
        .catch(() => null)) === 'false'
  );
  await tile('misjudged')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const misjudged = await names(p);
  await tile('unread')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const unread = await names(p);
  ok(
    '→ « mal réglées » : Julien et Sarah ; « à lire » : Thomas, Julien et Sarah',
    misjudged.join(', ') === 'Julien Moreau, Sarah Martin' &&
      unread.join(', ') === 'Thomas Bernard, Julien Moreau, Sarah Martin',
    `${misjudged.join(', ')} · ${unread.join(', ')}`
  );
  await ctx.close();

  // Sans personne à relancer, la tuile dit zéro et ne filtre rien : elle
  // montrerait une liste vide.
  const quiet = ROSTER.filter((c) => c._id !== 'karim');
  const second = await open(MOBILE, quiet);
  ok(
    'une tuile à zéro ne se touche pas',
    (await second.p
      .locator('main [data-tile="silent"]')
      .isDisabled({ timeout: 2000 })
      .catch(() => false)) &&
      /^0 à relancer/.test(
        await text(second.p.locator('main [data-tile="silent"]'))
      )
  );
  await second.ctx.close();
}

{
  console.log('\n── la recherche');
  const { ctx, p } = await open();
  const search = p.getByRole('searchbox', { name: 'Chercher un client' });
  await search.fill('LEA', { timeout: 2000 }).catch(() => {});
  await settle(p);
  const lea = await names(p);
  await search.fill('ju mo', { timeout: 2000 }).catch(() => {});
  await settle(p);
  const julien = await names(p);
  ok(
    'filtre à la frappe, sans accent ni casse, chaque mot où qu’il soit',
    lea.join() === 'Léa Dubois' && julien.join() === 'Julien Moreau',
    `${lea.join()} · ${julien.join()}`
  );
  await search.fill('zoé', { timeout: 2000 }).catch(() => {});
  await settle(p);
  const none = await text(p.locator('main [data-no-match]'));
  ok(
    'aucun résultat : la phrase le dit, avec le mot tapé',
    /^Aucun client ne s’appelle « zoé » Vérifie l’orthographe, ou invite cette personne\./.test(
      none
    ),
    none
  );
  await p
    .locator('main [data-no-match]')
    .getByRole('button', { name: 'Effacer la recherche' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '→ « Effacer la recherche » rend toute la liste',
    (await names(p)).length === 6 &&
      (await search.inputValue().catch(() => null)) === ''
  );
  await p
    .locator('main [data-tile="unread"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await search.fill('sa', { timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    'la recherche se cumule avec une tuile',
    (await names(p)).join() === 'Sarah Martin',
    (await names(p)).join()
  );
  await ctx.close();
}

{
  console.log('\n── le tri');
  const { ctx, p } = await open();
  const pick = async (label) => {
    await p
      .getByRole('button', { name: /^Trier :/ })
      .click({ timeout: 2000 })
      .catch(() => {});
    await p
      .getByRole('menuitem', { name: label })
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
  };
  await pick('A → Z');
  const alpha = await names(p);
  const trigger = await p
    .getByRole('button', { name: /^Trier :/ })
    .getAttribute('aria-label', { timeout: 2000 })
    .catch(() => null);
  ok(
    'le menu de tri range par prénom, et dit le tri choisi',
    alpha.join(', ') ===
      'Julien Moreau, Karim Haddad, Léa Dubois, Manon Petit, Sarah Martin, Thomas Bernard' &&
      trigger === 'Trier : A → Z',
    `${alpha.join(', ')} · ${trigger}`
  );
  await pick('Activité');
  const recent = await names(p);
  ok(
    '→ « Activité » : la plus récente d’abord',
    recent.join(', ') ===
      'Sarah Martin, Thomas Bernard, Manon Petit, Julien Moreau, Léa Dubois, Karim Haddad',
    recent.join(', ')
  );
  await ctx.close();
}

{
  console.log('\n── une ligne ouvre l’atelier');
  const { ctx, p } = await open();
  await p
    .locator('main [data-client-row="sarah"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .waitForURL(/\/coach\/clients\/sarah\/s\/1/, { timeout: 4000 })
    .catch(() => {});
  ok(
    'sur téléphone, toucher une ligne ouvre l’atelier du client',
    /\/coach\/clients\/sarah\/s\/1$/.test(new URL(p.url()).pathname),
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── aucun client');
  const { ctx, p } = await open(MOBILE, []);
  const main = await text(p.locator('main'));
  ok(
    'l’état vide propose l’action au lieu de la décrire',
    /Invite ton premier client/.test(main) &&
      (await p
        .locator('main')
        .getByRole('button', { name: 'Obtenir le lien d’invitation' })
        .count()) === 1 &&
      (await p.locator('main [data-tile]').count()) === 0 &&
      (await p.getByRole('searchbox').count()) === 0,
    main.slice(0, 120)
  );
  await ctx.close();
}

{
  console.log('\n── sur grand écran');
  const { ctx, p } = await open(WIDE);
  const cells = await p
    .locator('main [data-client-row="sarah"]')
    .evaluate((r) => {
      const box = (el) => el.getBoundingClientRect();
      const dots = r.querySelector('[data-pulse]');
      const chip = r.querySelector('[data-status-cell] > *');
      return {
        dots: dots ? box(dots).right : -1,
        chip: chip ? box(chip).left : -1,
        chipRight: chip ? box(chip).right : -1,
        row: box(r).right,
      };
    });
  ok(
    'des colonnes : la pastille d’état à droite, sans mordre sur les points',
    cells.dots > 0 && cells.chip > cells.dots && cells.chipRight <= cells.row,
    JSON.stringify(cells)
  );
  // La ligne grise de Manon passait sur trois lignes à 1 280 px.
  const heights = await p
    .locator('main [data-status-cell]')
    .evaluateAll((cells) =>
      cells.map((c) => Math.round(c.getBoundingClientRect().height))
    );
  ok(
    '→ chaque état tient sur une ligne',
    heights.length === 6 && Math.max(...heights) <= 28,
    heights.join(' · ')
  );
  const row = p.locator('main [data-client-row="sarah"]');
  await row.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    'une ligne choisit le client, sans quitter la liste',
    /\/coach\/clients$/.test(new URL(p.url()).pathname) &&
      (await row
        .getAttribute('aria-current', { timeout: 2000 })
        .catch(() => null)) === 'true',
    new URL(p.url()).pathname
  );
  await row.dblclick({ timeout: 2000 }).catch(() => {});
  await p.waitForURL(/\/s\/1$/, { timeout: 4000 }).catch(() => {});
  ok(
    '→ le double-clic ouvre son atelier',
    /\/coach\/clients\/sarah\/s\/1$/.test(new URL(p.url()).pathname),
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── le panneau');
  // Les séances de Sarah : celles du serveur d'essai, du 12 au 30 août.
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(WIDE);
  await ctx.route(/\/api\/coach\/clients(\?|$)/, (route) =>
    route.fulfill({ json: ROSTER })
  );
  await ctx.route(/\/api\/coach\/clients\/[^/]+\/history/, (route) =>
    route.fulfill({ json: [] })
  );
  await ctx.route(/\/api\/coach\/clients\/sarah\/history/, (route) =>
    route.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.clock.setFixedTime(NOW);
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const aside = p.getByRole('complementary', { name: 'Aperçu du client' });
  await aside
    .locator('[data-client-preview]')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  ok(
    'sans choix, le panneau montre le premier de la liste : le prochain à traiter',
    (await aside.locator('[data-client-preview="thomas"]').count()) === 1 &&
      (await p
        .locator('main [data-client-row="thomas"]')
        .getAttribute('aria-current', { timeout: 2000 })
        .catch(() => null)) === 'true'
  );

  await p
    .locator('main [data-client-row="sarah"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await aside
    .locator('[data-recent]')
    .first()
    .waitFor({ timeout: 6000 })
    .catch(() => {});
  const head = await text(aside.locator('h2').locator('..'));
  ok(
    'une ligne choisie s’y ouvre : le nom, et depuis quand dure le suivi',
    head === 'Sarah Martin avec toi depuis le 7 juin',
    head
  );
  const pulse = aside.locator('[data-preview-pulse]');
  const said = await text(pulse);
  const colors = await pulse
    .evaluate((card) => ({
      phrase: getComputedStyle(card.querySelector('p')).color,
      hard: getComputedStyle(card.querySelector('[data-zone="hard"]'))
        .backgroundColor,
    }))
    .catch(() => ({}));
  ok(
    '→ ses ressentis en points, et la phrase de sa ligne, à la couleur du dur',
    said.startsWith('Devient trop dure') &&
      colors.phrase !== undefined &&
      colors.phrase === colors.hard,
    `${said} · ${JSON.stringify(colors)}`
  );
  ok(
    '→ sa semaine, et son total de séances',
    said.endsWith('1 séance sur 3 cette semaine · 6 séances au total'),
    said
  );
  const recent = await aside
    .locator('[data-recent]')
    .evaluateAll((rows) =>
      rows.map((r) => r.innerText.replace(/\s+/g, ' ').trim())
    );
  ok(
    '→ ses trois dernières séances, la plus récente d’abord, son mot compris',
    recent.join(' | ') ===
      [
        'Full body A dim. 30 août · « Dur sur la fin. » Trop dure',
        'Full body A mer. 26 août · « Épaule un peu sensible sur les swings. » Dure',
        'Full body A sam. 22 août · « Bon rythme. » Juste',
      ].join(' | '),
    recent.join(' | ')
  );
  await aside
    .locator('[data-recent]')
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', {
    name: 'Full body A · Dimanche 30 août',
  });
  ok(
    '→ une séance s’ouvre en feuille, au « Son mot », sans « Corriger »',
    /Son mot/i.test(await text(sheet)) &&
      (await sheet.getByRole('button', { name: 'Corriger' }).count()) === 0,
    (await text(sheet)).slice(0, 80)
  );
  await p.keyboard.press('Escape');
  await settle(p);
  await aside
    .getByRole('button', { name: 'Tous ses ressentis' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForURL(/\/journal$/, { timeout: 4000 }).catch(() => {});
  ok(
    '→ « Tous ses ressentis » mène à son journal',
    new URL(p.url()).pathname === '/coach/clients/sarah/journal',
    new URL(p.url()).pathname
  );

  await p.goBack();
  await aside
    .locator('[data-client-preview]')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  await p
    .locator('main [data-client-row="manon"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const fresh = await text(aside);
  ok(
    'un client sans séance : le panneau le dit, sans lien vers un journal vide',
    /Ses séances terminées apparaîtront ici/.test(fresh) &&
      (await aside
        .getByRole('button', { name: 'Tous ses ressentis' })
        .count()) === 0,
    fresh.slice(-120)
  );
  await aside
    .getByRole('button', { name: 'Ouvrir son programme' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForURL(/\/s\/1$/, { timeout: 4000 }).catch(() => {});
  ok(
    '« Ouvrir son programme » mène à son atelier',
    new URL(p.url()).pathname === '/coach/clients/manon/s/1',
    new URL(p.url()).pathname
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
