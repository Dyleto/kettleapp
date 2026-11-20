/**
 * Les ressentis d'un client (E11b) : le résumé, le calendrier, la liste, et
 * une séance qui devient lue quand on l'ouvre.
 *
 * L'ancien journal n'avait pas de résumé, filtrait sa liste au calendrier,
 * et marquait tout l'historique lu dès l'ouverture de l'écran. La maquette
 * pose une carte — cinq points, une phrase, le rythme, les étiquettes —, un
 * calendrier dont chaque pastille ouvre sa séance, et une lecture séance
 * par séance.
 *
 * L'historique du coach est vide sur le serveur d'essai : la suite lui
 * substitue celui du client, relu à chaque demande, pour que ce qu'une
 * lecture change chez le serveur se retrouve à l'écran. Six séances du 12
 * au 30 août, dont un ancien bilan le 16 ; la dernière, « Dur sur la fin. »,
 * n'est pas lue.
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

const CLIENT = '507f1f77bcf86cd799439012';
const JOURNAL = `${BASE}/coach/clients/${CLIENT}/journal`;
const WIDE = { viewport: { width: 1440, height: 1000 } };
// Le dimanche 30 août au soir : la semaine en cours porte deux séances.
const SUNDAY = new Date('2026-08-30T20:00:00+02:00');

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .then((t) => t.replace(/\s+/g, ' ').trim())
    .catch(() => '');
const serverHistory = async () =>
  (await (await fetch(`${API}/api/client/history`)).json()).history;
const unreadOnServer = async () =>
  (await serverHistory()).filter((c) => !c.viewedByCoach).map((c) => c._id);

const browser = await launch();

/** `details` retouche la fiche du client : la suite y pose un refus de
 * partage. Les lectures envoyées sont relevées, par route. */
const open = async (options, { details, now } = {}) => {
  await fetch(`${API}/api/mock/reset`, { method: 'POST' });
  // `reset` ne rend pas l'historique : la dernière séance redevient non
  // lue, comme au départ, quoi qu'une partie précédente en ait fait.
  await fetch(`${API}/api/coach/sessions/completed/viewed`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ['cs6'], viewed: false }),
  });
  const ctx = await browser.newContext(options);
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    serverHistory().then((history) => r.fulfill({ json: history }))
  );
  if (details)
    await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}$`), async (r) =>
      r.fulfill({
        json: details(
          await (await fetch(`${API}/api/coach/clients/${CLIENT}`)).json()
        ),
      })
    );
  const reads = [];
  ctx.on('request', (request) => {
    if (request.method() !== 'PATCH') return;
    if (/\/sessions\/completed\/viewed$/.test(request.url()))
      reads.push(request.postDataJSON()?.ids ?? []);
    if (/\/history\/mark-viewed$/.test(request.url())) reads.push('tout');
  });
  const p = await signIn(ctx);
  if (now) await p.clock.setFixedTime(now);
  await p.goto(JOURNAL, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p, reads };
};

{
  console.log('\n── le résumé');
  const { ctx, p } = await open(WIDE, { now: SUNDAY });
  const summary = p.locator('main [data-journal-summary]');
  const zones = await summary
    .locator('[data-zone]')
    .evaluateAll((dots) => dots.map((d) => d.dataset.zone).join(','));
  const said = await text(summary);
  ok(
    'cinq points, et la phrase de la série en cours',
    zones === 'none,hard,target,hard,hard' &&
      said.startsWith('Les deux dernières : dures'),
    `${zones} · ${said}`
  );
  ok(
    '  → le rythme : depuis quand, combien par semaine, et cette semaine',
    said.includes(
      '6 séances depuis le 12 août · 1,5 par semaine · 2 sur 3 cette semaine'
    ),
    said
  );
  const tags = await summary
    .getByRole('group', { name: 'Filtrer par étiquette' })
    .getByRole('button')
    .allInnerTexts();
  ok(
    '  → les étiquettes et leur compte, la douleur d’abord',
    tags.map(clean).join(' | ') === 'Douleur × 1 | Fatigue × 2 | Mal dormi × 1',
    tags.join(' | ')
  );
  ok(
    'la bascule dit le volet ouvert, et « Programme » mène à l’atelier',
    (await p
      .getByRole('navigation', { name: 'Volets de la fiche' })
      .getByRole('link', { name: 'Ressentis' })
      .getAttribute('aria-current')
      .catch(() => null)) === 'page' &&
      (await p
        .getByRole('navigation', { name: 'Volets de la fiche' })
        .getByRole('link', { name: 'Programme' })
        .getAttribute('href')
        .catch(() => '')) === `/coach/clients/${CLIENT}/s/1`
  );
  await ctx.close();
}

{
  console.log('\n── une étiquette filtre la liste');
  const { ctx, p } = await open(WIDE);
  const rows = p.locator('main [data-journal-row]');
  const all = await rows.count();
  const pain = p.getByRole('button', { name: 'Douleur × 1' });
  await pain.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  const kept = await rows.count();
  const keptText = await text(rows.first());
  const line = await text(
    p.locator('main').getByText(/séances? avec « Douleur »/)
  );
  ok(
    '« Douleur × 1 » ne laisse que la séance qui la porte',
    all === 6 &&
      kept === 1 &&
      keptText.includes('Épaule un peu sensible sur les swings.') &&
      (await pain.getAttribute('aria-pressed')) === 'true' &&
      line === '1 séance avec « Douleur »',
    `${all} → ${kept} ligne(s) · ${line}`
  );
  await p
    .getByRole('button', { name: 'Tout afficher' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → « Tout afficher » rend toutes les séances',
    (await rows.count()) === 6 &&
      (await pain.getAttribute('aria-pressed')) === 'false'
  );
  await ctx.close();
}

{
  console.log('\n── lue à l’ouverture de la séance');
  const { ctx, p, reads } = await open(WIDE);
  const rows = p.locator('main [data-journal-row]');
  const last = rows.first();
  const dotBefore = await last.locator('[data-unread-dot]').count();
  // Un lecteur d'écran l'entend en mots, et seulement sur celle-là.
  const heard = await p
    .locator('main')
    .getByRole('button', { name: /à lire/ })
    .count();
  ok(
    'ouvrir l’écran ne lit rien : la séance non lue garde son point',
    dotBefore === 1 &&
      reads.length === 0 &&
      (await unreadOnServer()).join() === 'cs6' &&
      heard === 1,
    `${reads.length} lecture(s) envoyée(s) · ${heard} ligne(s) « à lire »`
  );

  // Une autre séance d'abord : elle était lue, rien ne part.
  await rows
    .nth(1)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const drawer = p.getByRole('dialog');
  const otherOpened = (await text(drawer)).includes(
    'Épaule un peu sensible sur les swings.'
  );
  await p.keyboard.press('Escape');
  await gone(drawer);
  const readsAfterOther = reads.length;

  await last.click({ timeout: 2000 }).catch(() => {});
  await last
    .locator('[data-unread-dot]')
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => {});
  ok(
    '  → ouvrir une séance la lit, elle seule, et son point tombe',
    otherOpened &&
      readsAfterOther === 0 &&
      JSON.stringify(reads) === '[["cs6"]]' &&
      (await unreadOnServer()).length === 0 &&
      (await last.locator('[data-unread-dot]').count()) === 0,
    `${JSON.stringify(reads)} · non lues chez le serveur : ${(await unreadOnServer()).join() || 'aucune'}`
  );
  await ctx.close();
}

{
  console.log('\n── le calendrier');
  const { ctx, p, reads } = await open(WIDE);
  const calendar = p.locator('main [data-calendar]');
  const zoneOf = (day) =>
    calendar
      .locator(`[data-day="2026-08-${day}"]`)
      .getAttribute('data-zone')
      .catch(() => null);
  // La couleur affichée, et non l'attribut : c'est elle que le coach lit.
  const colorOf = (day) =>
    calendar
      .locator(`[data-day="2026-08-${day}"]`)
      .evaluate((el) => getComputedStyle(el).backgroundColor)
      .catch(() => '');
  ok(
    'une pastille pleine par séance, à la couleur de son effort',
    (await calendar.locator('[data-day]').count()) === 6 &&
      (await zoneOf('30')) === 'hard' &&
      (await colorOf('30')) === 'rgb(236, 128, 121)' &&
      (await zoneOf('22')) === 'target' &&
      (await colorOf('22')) === 'rgb(127, 192, 138)' &&
      (await zoneOf('16')) === 'none' &&
      (await calendar
        .getByRole('button', {
          name: 'dimanche 30 août : Full body A, Trop dure',
        })
        .count()) === 1,
    `${await calendar.locator('[data-day]').count()} pastille(s) · 30 : ${await zoneOf('30')}, ${await colorOf('30')}`
  );

  // Le serveur d'essai date ses séances d'août : le calendrier s'ouvre sur
  // le mois de la dernière, pas sur le mois en cours.
  const month = calendar.locator('[data-calendar-month]');
  const first = await text(month);
  const previous = calendar.getByRole('button', { name: 'Mois précédent' });
  const next = calendar.getByRole('button', { name: 'Mois suivant' });
  const before = await previous.isDisabled().catch(() => false);
  await next.click({ timeout: 2000 }).catch(() => {});
  const after = await text(month);
  await previous.click({ timeout: 2000 }).catch(() => {});
  ok(
    '  → il ouvre sur le mois de la dernière séance, et ses flèches parcourent les mois',
    first === 'Août 2026' &&
      before &&
      after === 'Septembre 2026' &&
      (await text(month)) === 'Août 2026',
    `${first} → ${after} → ${await text(month)}`
  );

  await calendar
    .locator('[data-day="2026-08-30"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const drawer = await text(p.getByRole('dialog'));
  ok(
    '  → une pastille ouvre sa séance, qui devient lue',
    drawer.includes('Dur sur la fin.') && JSON.stringify(reads) === '[["cs6"]]',
    `${JSON.stringify(reads)} · ${drawer.slice(0, 60)}`
  );
  await ctx.close();
}

{
  console.log('\n── sans partage des données de santé');
  const { ctx, p } = await open(WIDE, {
    details: (client) => ({ ...client, sharesHealthData: false }),
  });
  const summary = p.locator('main [data-journal-summary]');
  const said = await text(summary);
  ok(
    'la carte dit pourquoi ses ressentis n’ont ni étiquette ni mot',
    said.includes(
      'Sarah ne partage pas ses données de santé : ses ressentis n’ont ni étiquette ni mot.'
    ) &&
      (await summary
        .getByRole('group', { name: 'Filtrer par étiquette' })
        .count()) === 0,
    said
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  const { ctx, p } = await open(MOBILE);
  const order = await p
    .locator('[data-journal-summary], [data-calendar], [data-journal-list]')
    .evaluateAll((nodes) =>
      nodes.map((n) =>
        n.hasAttribute('data-journal-summary')
          ? 'résumé'
          : n.hasAttribute('data-calendar')
            ? 'calendrier'
            : 'liste'
      )
    );
  ok(
    'une barre, le nom du client ; puis la bascule, le résumé, le calendrier et la liste',
    (await text(p.getByRole('heading', { level: 1 }))) === 'Sarah Martin' &&
      (await p
        .getByRole('link', { name: 'Ressentis' })
        .filter({ visible: true })
        .count()) === 1 &&
      order.join(',') === 'résumé,calendrier,liste',
    order.join(', ')
  );
  // Les bords de ce qui est dessiné, contre la largeur de l'appareil, et
  // non la largeur de la page : un téléphone élargit sa fenêtre à ce qui
  // déborde — 422 px pour un calendrier trop large — et la comparaison à
  // `innerWidth` restait verte. Un sabotage l'a montré.
  const device = p.viewportSize().width;
  const spilled = await p
    .locator('main [data-calendar] *, main [data-journal-summary] *')
    .evaluateAll(
      (nodes, width) =>
        nodes.filter((n) => {
          const box = n.getBoundingClientRect();
          return box.width > 0 && box.right > width;
        }).length,
      device
    );
  ok(
    '  → rien ne déborde de l’écran',
    spilled === 0,
    `${spilled} élément(s) au-delà du bord`
  );
  await ctx.close();
}

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
await browser.close();
process.exit(failureCount() ? 1 : 0);
