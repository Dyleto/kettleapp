/**
 * Les séances sur téléphone : la bande de cartes et la feuille de la séance
 * (E7b).
 *
 * La bande montrait « S1 … S6 » : le rang, et rien d'autre. Elle montre
 * maintenant ce que le rail montre sur grand écran — le nom, la durée, la
 * composition, les cinq ressentis —, en cartes qu'un appui long soulève
 * pour les déplacer. L'en-tête de la séance s'efface : ce qu'il réglait
 * passe dans une feuille, ouverte par le « ⋯ » de la barre du haut.
 *
 * Le glisser se mène au toucher, par de vrais événements tactiles : c'est
 * l'appui long qu'il faut éprouver, et un glissement bref qui, lui, doit
 * faire défiler la bande sans rien déplacer. Une souris ne distingue pas
 * les deux.
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
  autosaved,
  gone,
  hold,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const SESSION = (n) => `${BASE}/coach/clients/${CLIENT}/s/${n}`;

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
/** Les séances du client, lues chez le serveur et non à l'écran. */
const serverSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions;
};
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const focused = (p) =>
  p.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
const cards = (p) => p.locator('[data-session-card]');
const band = (p) => p.locator('[data-session-band]');
const centre = async (locator) => {
  const box = await locator.boundingBox();
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : null;
};

const browser = await launch();

/** Une page de téléphone sur l'atelier du client, l'historique du client
 * substitué à celui, vide, que le serveur d'essai rend au coach. */
const open = async (n) => {
  await reset();
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(SESSION(n), { waitUntil: 'domcontentloaded' });
  await settle(p);
  await cards(p)
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  const cdp = await ctx.newCDPSession(p);
  /** Un doigt posé, déplacé, levé : de vrais événements tactiles. */
  const touch = (type, at) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [at],
    });
  return { ctx, p, touch };
};

{
  console.log('\n── la bande');
  const { ctx, p, touch } = await open(1);
  const first = cards(p).nth(0);
  const fourth = cards(p).nth(3);

  ok(
    'chaque séance est une carte : son nom, sa durée, ses ressentis',
    (await text(first)).startsWith('1 · Full body A') &&
      (await text(first)).includes('≈ 30 min') &&
      (await first.locator('[data-zone]').count()) === 5,
    (await text(first)).replace(/\n+/g, ' | ')
  );
  ok(
    '  → une séance jamais faite le dit, sans points',
    (await text(fourth)).includes('≈ 25 min · jamais faite') &&
      (await fourth.locator('[data-pulse]').count()) === 0,
    (await text(fourth)).replace(/\n+/g, ' | ')
  );

  await cards(p)
    .nth(1)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'toucher une carte ouvre sa séance',
    p.url().endsWith('/s/2') &&
      (await cards(p).nth(1).getAttribute('aria-current')) === 'true',
    p.url().split('/').slice(-2).join('/')
  );

  // Un glissement bref, sans appui long : la bande défile. Elle a pu
  // défiler déjà — la carte touchée se montre en entier —, d'où la mesure
  // avant, sans quoi l'assertion restait verte sans glissement. L'ordre se
  // lit à l'écran : un déplacement ne part au serveur qu'après un délai.
  const order = async () =>
    (await cards(p).allInnerTexts()).map((t) => clean(t).split('\n')[0]);
  const before = await order();
  const scrolledBefore = await band(p).evaluate((el) => el.scrollLeft);
  const from = await centre(cards(p).nth(1));
  // Une carte soulevée s'estompe. Sans appui long, un glissement bref la
  // soulevait aussi : la bande défilait quand même, et la carte, suivant le
  // doigt, revenait à sa place — l'ordre seul ne le voyait pas.
  let lifted = false;
  if (from) {
    await touch('touchStart', from);
    for (let dx = 20; dx <= 220; dx += 40)
      await touch('touchMove', { x: from.x - dx, y: from.y });
    lifted = await cards(p).evaluateAll((all) =>
      all.some((card) => card.style.opacity === '0.5')
    );
    await touch('touchEnd');
  }
  await settle(p);
  const scrolled =
    (await band(p).evaluate((el) => el.scrollLeft)) - scrolledBefore;
  const after = await order();
  ok(
    'un glissement bref fait défiler la bande, sans soulever ni déplacer de carte',
    scrolled >= 100 && !lifted && after.join(',') === before.join(','),
    `défilée de ${scrolled} px · ${lifted ? 'une carte soulevée' : 'rien de soulevé'} · ${after.slice(0, 3).join(', ')}`
  );
  await ctx.close();
}

{
  console.log('\n── l’appui long');
  const { ctx, p, touch } = await open(1);
  const before = await serverSessions();
  const from = await centre(cards(p).nth(0));
  const to = await centre(cards(p).nth(1));
  if (from && to) {
    await touch('touchStart', from);
    await hold(p, 400, 'l’appui long : la carte se soulève après 200 ms');
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await touch('touchMove', {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y,
      });
      await hold(p, 30, 'un doigt qui glisse, et non un saut');
    }
    // Un doigt marque un temps avant de lâcher : c'est là que la bande, si
    // elle défile trop tôt près du bord, file sous lui.
    await hold(p, 400, 'le temps qu’on prend avant de lâcher une carte');
    await touch('touchEnd');
  }
  await autosaved(p);
  const after = await serverSessions();
  ok(
    'un appui long puis glisser déplace la séance, et le serveur reçoit le nouvel ordre',
    after[0]?._id === before[1]?._id && after[1]?._id === before[0]?._id,
    after.map((s) => s.name ?? `Séance ${s.order}`).join(', ')
  );
  ok(
    '  → la bande se renumérote',
    (await text(cards(p).nth(0))).startsWith('1 · Haut du corps') &&
      (await text(cards(p).nth(1))).startsWith('2 · Full body A'),
    `${await text(cards(p).nth(0))} | ${await text(cards(p).nth(1))}`.replace(
      /\n+/g,
      ' '
    )
  );
  await ctx.close();
}

{
  console.log('\n── une séance au bout de la bande');
  const { ctx, p } = await open(6);
  const visible = await cards(p)
    .nth(5)
    .evaluate((card) => {
      const strip = card.parentElement.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      return box.left >= strip.left - 1 && box.right <= strip.right + 1;
    })
    .catch(() => false);
  ok('ouverte par son adresse, la sixième se montre dans la bande', visible);
  await ctx.close();
}

{
  console.log('\n── la feuille de la séance');
  const { ctx, p } = await open(1);
  const before = (await serverSessions()).length;

  ok(
    'l’en-tête de la séance laisse la place au « ⋯ » de la barre du haut',
    (await p.getByRole('button', { name: 'Nom de la séance 1' }).count()) ===
      0 &&
      (await p.getByRole('button', { name: 'Menu de la séance 1' }).count()) ===
        1
  );

  // Celui de la barre du haut : l'en-tête, s'il restait, en porterait un
  // second du même nom.
  await p
    .locator('header')
    .filter({ hasText: 'Sarah Martin' })
    .getByRole('button', { name: 'Menu de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Régler la séance 1' });
  const name = sheet.getByRole('textbox', { name: 'Nom de la séance 1' });
  const offered = (await sheet.getByRole('button').allInnerTexts()).map(clean);
  ok(
    '« ⋯ » ouvre la feuille : le nom, les jours, le mot, et le reste du menu',
    (await name.inputValue().catch(() => '')) === 'Full body A' &&
      (await sheet.getByRole('group', { name: 'Jours conseillés' }).count()) ===
        1 &&
      offered.some((b) => b.startsWith('+ mot pour Sarah')) &&
      ['Dupliquer', 'Copier vers un client…', 'Enregistrer comme modèle'].every(
        (label) => offered.includes(label)
      ) &&
      offered.includes('Supprimer la séance 1'),
    offered.join(' | ')
  );

  await name.fill('Full body B').catch(() => {});
  await sheet
    .getByRole('button', { name: 'mercredi' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await autosaved(p);
  const saved = (await serverSessions())[0];
  ok(
    '  → le nom et les jours s’y règlent, et partent au serveur',
    saved?.name === 'Full body B' &&
      [...(saved?.suggestedDays ?? [])].sort().join(',') === '0,2,3',
    `${saved?.name} · ${saved?.suggestedDays}`
  );

  await sheet
    .getByRole('button', { name: 'Dupliquer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await gone(sheet);
  await autosaved(p);
  // Aucune feuille, et non seulement plus celle de la séance 1 : restée
  // ouverte, elle se renommait « Régler la séance 2 » sur la copie.
  ok(
    '  → une action referme la feuille, puis se fait',
    (await p.getByRole('dialog').count()) === 0 &&
      p.url().endsWith('/s/2') &&
      (await serverSessions()).length === before + 1,
    `${p.url().split('/').slice(-2).join('/')} · ${(await serverSessions()).length} séances`
  );
  await ctx.close();
}

{
  console.log('\n── « + » sur téléphone');
  const { ctx, p } = await open(1);
  const n = (await serverSessions()).length + 1;
  await p
    .getByRole('button', { name: 'Ajouter une séance' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  // Le focus passe au champ une fois la feuille montée : sur la CI, il
  // était encore sur le titre de la séance 1 quand la lecture passait.
  await p
    .waitForFunction(
      (name) => document.activeElement?.getAttribute('aria-label') === name,
      `Nom de la séance ${n}`,
      { timeout: 4000 }
    )
    .catch(() => {});
  ok(
    '« + » ouvre la feuille de la séance neuve, son nom prêt à la frappe',
    p.url().endsWith(`/s/${n}`) &&
      (await p
        .getByRole('dialog', { name: `Régler la séance ${n}` })
        .count()) === 1 &&
      (await focused(p)) === `Nom de la séance ${n}`,
    `${p.url().split('/').slice(-2).join('/')} · focus sur « ${await focused(p)} »`
  );
  await p.keyboard.type('Mobilité');
  await autosaved(p);
  ok(
    '  → le nom tapé part au serveur',
    (await serverSessions())[n - 1]?.name === 'Mobilité',
    (await serverSessions())[n - 1]?.name
  );

  // Le titre caché ne doit pas garder la demande : sur un écran plus large,
  // il se rouvrirait à l'écriture sans que personne l'ait demandé.
  await p.keyboard.press('Escape');
  await settle(p);
  await p.setViewportSize({ width: 1440, height: 1000 });
  await settle(p);
  ok(
    '  → et ne laisse aucun titre ouvert derrière elle',
    (await p.getByRole('button', { name: `Nom de la séance ${n}` }).count()) ===
      1 &&
      (await p
        .getByRole('textbox', { name: `Nom de la séance ${n}` })
        .count()) === 0
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
