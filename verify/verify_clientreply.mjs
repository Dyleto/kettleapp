/**
 * La réponse du coach chez le client.
 *
 * Sur l'accueil, elle remplace la question — « Julie ne l'a pas encore
 * lue » — par une bulle, avec « Nouveau » tant que le client ne l'a pas
 * vue ; dans Progrès, la même bulle sous son mot. La voir, c'est l'avoir
 * lue : le coach lit alors « lue par Sarah », et ne peut plus la modifier.
 *
 * Le coach répond par le faux serveur directement : ce qui est éprouvé ici,
 * c'est ce que le client en voit, et ce que son écran en dit au serveur.
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  MOBILE,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const SESSION = 'cs6';
const DESKTOP = { viewport: { width: 1280, height: 800 } };

/** Le coach répond, chez le faux serveur. */
const coachWrites = (body) =>
  fetch(`${API}/api/coach/sessions/completed/${SESSION}/reply`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const stored = async () =>
  (await (await fetch(`${API}/api/client/history`)).json()).history.find(
    (c) => c._id === SESSION
  );

/** Les lectures que l'écran déclare au serveur. */
const reads = (ctx) => {
  const sent = [];
  ctx.on('request', (r) => {
    if (
      r.method() === 'PATCH' &&
      new URL(r.url()).pathname.endsWith('/replies/read')
    )
      sent.push(new URL(r.url()).pathname);
  });
  return sent;
};
const lastCard = (p) =>
  p
    .getByRole('region', { name: 'Ta dernière séance' })
    .innerText({ timeout: 3000 })
    .then(clean)
    .catch(() => '');

const browser = await launch();

{
  console.log('\n── sur l’accueil, la réponse remplace la question');
  await coachWrites({
    reaction: 'strong',
    text: 'Bien joué. J’allège les swings.',
  });
  const ctx = await browser.newContext(MOBILE);
  const sent = reads(ctx);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const card = await lastCard(p);
  ok(
    'la réponse en bulle, réaction comprise, à la place de « pas encore lue »',
    card.includes('💪 Bien joué. J’allège les swings.') &&
      !/pas encore lue/.test(card) &&
      !card.includes('Dur sur la fin'),
    card.replace(/\n+/g, ' | ')
  );
  ok('  → « Nouveau », tant qu’il ne l’a pas vue', /Nouveau/.test(card));
  ok(
    '  → la voir, c’est l’avoir lue : le serveur le sait',
    sent.length === 1 &&
      typeof (await stored())?.replies?.at(-1)?.readAt === 'string',
    `${sent.length} lecture(s) déclarée(s)`
  );
  // La lecture est partie : la pastille ne s'éteint pas pour autant sous
  // les yeux de celui qu'elle prévient.
  ok(
    '  → « Nouveau » tient le temps de la visite',
    /Nouveau/.test(await lastCard(p))
  );

  await p.reload({ waitUntil: 'domcontentloaded' });
  await settle(p);
  const again = await lastCard(p);
  ok(
    'à la visite suivante, la bulle reste, sans « Nouveau »',
    again.includes('Bien joué. J’allège les swings.') && !/Nouveau/.test(again),
    again.replace(/\n+/g, ' | ')
  );

  await p
    .getByRole('button', { name: /Voir ta dernière séance/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const detail = clean(
    await p
      .getByRole('dialog')
      .last()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok(
    'dans le détail de la séance, la même bulle, sous son mot',
    /ton mot/i.test(detail) &&
      detail.indexOf('Dur sur la fin') > -1 &&
      detail.indexOf('💪 Bien joué') > detail.indexOf('Dur sur la fin'),
    detail.replace(/\n+/g, ' | ').slice(0, 200)
  );
  await ctx.close();
}

{
  console.log('\n── une réponse lue ne bouge plus : la suivante est nouvelle');
  // Lue, la première ne se modifie plus : ce que le coach écrit ensuite en
  // devient une seconde, et c'est elle que l'accueil montre.
  await coachWrites({ text: 'Et la suite ?' });
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const card = await lastCard(p);
  ok(
    'la plus récente en bulle, avec « Nouveau »',
    card.includes('Et la suite ?') &&
      !card.includes('J’allège les swings') &&
      /Nouveau/.test(card),
    card.replace(/\n+/g, ' | ')
  );
  await ctx.close();
}

{
  console.log(
    '\n── le coach qui relit le journal ne lit pas à la place du client'
  );
  await coachWrites({ text: 'Une de plus.' });
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(DESKTOP);
  const sent = reads(ctx);
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/journal`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  // La ligne la plus récente de la liste : le calendrier porte aussi des
  // boutons « … Full body A », dans l'ordre des jours.
  await p
    .locator('main [data-journal-row]')
    .filter({ hasText: 'Full body A' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  // À 1 280 px, la séance s'ouvre dans le panneau de droite (E11c).
  const detail = clean(
    await p
      .locator('main [data-journal-detail]')
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok(
    'le coach voit ses réponses dans le détail, sans les marquer lues',
    detail.includes('Une de plus.') &&
      sent.length === 0 &&
      (await stored())?.replies?.at(-1)?.readAt === undefined,
    `${sent.length} lecture(s) · ${detail.replace(/\n+/g, ' | ').slice(0, 120)}`
  );
  await ctx.close();
}

{
  console.log(
    '\n── l’aperçu d’un client, dans la liste, ne lit pas non plus à sa place'
  );
  // Le dernier endroit où le coach ouvre le tiroir du client, en lecture
  // seule. Le journal a son propre détail depuis E11c : sans cette partie,
  // la garde qui empêche le coach de lire à la place du client ne serait
  // plus éprouvée nulle part. Le serveur d'essai ne rend aucun client :
  // la suite pose Sarah dans la liste.
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(DESKTOP);
  const sent = reads(ctx);
  await ctx.route(/\/api\/coach\/clients(\?.*)?$/, (r) =>
    r.request().method() === 'GET'
      ? r.fulfill({
          json: [
            {
              _id: CLIENT,
              firstName: 'Sarah',
              lastName: 'Martin',
              unseenCount: 0,
              linkedAt: '2026-06-01T09:00:00.000Z',
              tagIds: [],
              weekDone: 0,
              weekTarget: 3,
              sessionCount: 6,
              recentEfforts: [3, 4, 5],
              lastCompletedAt: '2026-08-30T18:00:00.000Z',
              lastEffort: 5,
            },
          ],
        })
      : r.fallback()
  );
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .locator('main')
    .getByText('Sarah Martin')
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  await p
    .locator('main')
    .getByRole('button', { name: /Full body A/ })
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const drawer = clean(
    await p
      .getByRole('dialog')
      .last()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok(
    'dans l’aperçu d’un client, le coach voit ses réponses sans les marquer lues',
    drawer.includes('Dur sur la fin.') &&
      drawer.includes('Une de plus.') &&
      sent.length === 0 &&
      (await stored())?.replies?.at(-1)?.readAt === undefined,
    `${sent.length} lecture(s) · ${drawer.replace(/\n+/g, ' | ').slice(0, 120)}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
