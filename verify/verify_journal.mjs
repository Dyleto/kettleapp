/**
 * Les ressentis d'un client : le résumé, le calendrier, la liste, une
 * séance qui devient lue quand on l'ouvre (E11b), et son détail (E11c).
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

/** La séance ouverte : à droite sur grand écran, en feuille en dessous. */
const detailOf = (p) => p.locator('[data-journal-detail]');

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
  // L'historique passe par une route de la suite, qui le relit au serveur
  // d'essai : sous charge, `settle` rendait la main avant la liste, et une
  // partie a compté zéro ligne. On attend la première.
  await p
    .locator('main [data-journal-row]')
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
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
  const otherOpened = (await text(detailOf(p))).includes(
    'Épaule un peu sensible sur les swings.'
  );
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
  const opened = await text(detailOf(p));
  ok(
    '  → une pastille ouvre sa séance, qui devient lue',
    opened.includes('Dur sur la fin.') && JSON.stringify(reads) === '[["cs6"]]',
    `${JSON.stringify(reads)} · ${opened.slice(0, 60)}`
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
  console.log('\n── une séance ouverte');
  const { ctx, p } = await open(WIDE);
  const rows = p.locator('main [data-journal-row]');
  await rows
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const detail = detailOf(p);
  const said = await text(detail);
  ok(
    'sur grand écran, la séance s’ouvre à droite : son ressenti, ses étiquettes, son mot',
    (await p.locator('main aside [data-journal-detail="cs6"]').count()) === 1 &&
      (await p.getByRole('dialog').count()) === 0 &&
      said.startsWith('Full body A Dimanche 30 août Trop dure Fatigue') &&
      /Son mot Dur sur la fin\./i.test(said),
    said.slice(0, 120)
  );

  const line = (name) =>
    detail.locator('[data-done-line]').filter({ hasText: name }).first();
  const goblet = await text(line('Goblet Squat'));
  const swing = await text(line('Kettlebell Swing'));
  ok(
    '  → ce qui a été fait, en face du prévu, et la flèche quand la charge monte',
    goblet ===
      'Goblet Squat prévu 12 reps 12 reps · 26 kg ↗ , plus lourd que la fois d’avant' &&
      (await line('Goblet Squat').locator('[data-up]').count()) === 1 &&
      swing === 'Kettlebell Swing prévu 15 reps 15 reps · 20 kg' &&
      (await line('Kettlebell Swing').locator('[data-up]').count()) === 0,
    `${goblet} | ${swing}`
  );

  const answer = 'Bien vu, on garde.';
  await detail
    .getByRole('textbox', { name: 'Répondre à Sarah' })
    .fill(answer)
    .catch(() => {});
  await detail
    .getByRole('button', { name: 'Envoyer à Sarah' })
    .click({ timeout: 2000 })
    .catch(() => {});
  // La réponse partie, et non le texte : le champ le porte déjà avant
  // l'envoi, et une attente sur le texte rendait la main avant que le
  // serveur ait répondu.
  const thread = detail.locator('[data-reply-thread]');
  const sent = thread.locator('[data-reply]').filter({ hasText: answer });
  await sent
    .first()
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  const stored = (await serverHistory()).find((c) => c._id === 'cs6');
  const bubbles = await sent.count();
  const state = await text(thread);
  ok(
    '  → répondre d’ici : la réponse part, et se lit aussitôt avec son état',
    bubbles >= 1 &&
      /pas encore lue/.test(state) &&
      stored?.replies?.at(-1)?.text === answer,
    `${bubbles} réponse(s) partie(s) · serveur : ${stored?.replies?.at(-1)?.text} · ${state.slice(0, 90)}`
  );

  // « Haut du corps » est la séance 2 : l'atelier s'ouvre sur elle.
  await rows
    .filter({ hasText: 'Haut du corps' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await detail
    .getByRole('button', { name: 'Ajuster la séance' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → « Ajuster la séance » ouvre l’atelier sur elle',
    new URL(p.url()).pathname === `/coach/clients/${CLIENT}/s/2`,
    p.url().replace(BASE, '')
  );
  await ctx.close();
}

{
  console.log('\n── ce que le programme est devenu');
  const { ctx, p } = await open(WIDE);
  const rows = p.locator('main [data-journal-row]');
  const detail = detailOf(p);
  await rows
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sameSaysNothing =
    (await detail.locator('[data-program-changed]').count()) === 0;
  // La séance 3 a été faite, puis remaniée : même identifiant, autre
  // contenu.
  await rows
    .filter({ hasText: 'Séance 3' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'une séance remaniée depuis le dit : le « prévu » est celui du jour où elle a été faite',
    sameSaysNothing &&
      (await text(detail.locator('[data-program-changed]'))) ===
        'Le programme a changé depuis : le « prévu » est celui du jour où elle a été faite.',
    await text(detail.locator('[data-program-changed]'))
  );

  await rows
    .filter({ hasText: 'ancien bilan' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const legacy = await text(detail.locator('[data-legacy-metrics]'));
  ok(
    'un ancien bilan : ses cinq axes en lecture seule, sans ressenti',
    legacy === 'Stress 1/5 Humeur 5/5 Énergie 4/5 Sommeil 5/5 Douleurs 1/5' &&
      (await text(detail)).startsWith(
        'Full body A Dimanche 16 août ancien bilan'
      ),
    legacy
  );
  await ctx.close();
}

{
  console.log('\n── une séance retirée du programme');
  const { ctx, p } = await open(WIDE, {
    details: (client) => ({
      ...client,
      program: {
        ...client.program,
        sessions: client.program.sessions.filter((s) => s._id !== 'sess3'),
      },
    }),
  });
  await p
    .locator('main [data-journal-row]')
    .filter({ hasText: 'Séance 3' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const detail = detailOf(p);
  ok(
    'une séance qui n’est plus au programme le dit, et n’offre pas de l’ajuster',
    (await text(detail)).includes('Cette séance n’est plus au programme.') &&
      (await detail
        .getByRole('button', { name: 'Ajuster la séance' })
        .count()) === 0,
    (await text(detail)).slice(-80)
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
  await p
    .locator('main [data-journal-row]')
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', {
    name: 'Full body A · Dimanche 30 août',
  });
  const sheetSays = await text(sheet);
  const inSheet = await sheet.locator('[data-journal-detail="cs6"]').count();
  // Le fond assombri, au-dessus de la feuille.
  await p.mouse.click(20, 80);
  await gone(sheet);
  ok(
    '  → une séance monte en feuille, qui se referme en touchant le fond',
    inSheet === 1 &&
      sheetSays.includes('Dur sur la fin.') &&
      (await p.getByRole('dialog').count()) === 0,
    sheetSays.slice(0, 80)
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
