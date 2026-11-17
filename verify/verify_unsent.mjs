/**
 * Une séance finie dont le ressenti n'est pas parti.
 *
 * Quittée sans envoyer, elle gardait son enregistrement — c'est voulu — et
 * l'accueil la prenait pour une séance en cours : « Reprendre » rouvrait le
 * dernier écran d'une séance déjà faite. Elle est maintenant « à valider »,
 * et l'accueil propose « Dire comment c'était ».
 *
 * Sans réseau, l'envoi se mettait en pause en mémoire : le bouton tournait
 * sans rien dire. Le ressenti est maintenant gardé sur le téléphone, et il
 * part seul au retour du réseau.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  BASE,
  START,
  clean,
  settle,
  finishFromPause,
  reachFeeling,
} from './common.mjs';

const browser = await launch();

const KEY = 'kettle-seance-sess2';
const record = (p) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const page = (p) =>
  p
    .locator('body')
    .innerText()
    .then(clean)
    .catch(() => '');
const feeling = (p) => p.getByRole('dialog', { name: 'Le ressenti' });
const button = (p, name) => p.getByRole('button', { name, exact: true });

/** La séance 2, arrêtée tout de suite, jusqu'à son ressenti. */
const toFeeling = async (p) => {
  await start(p, 'sess2');
  await finishFromPause(p);
  await reachFeeling(p);
};

{
  console.log('\n── quitter sans envoyer : la séance est « à valider »');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await toFeeling(p);
  ok('le ressenti est ouvert', (await feeling(p).count()) === 1);
  await button(p, 'Quitter sans envoyer')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'la fiche ne propose plus de la reprendre : « Dire comment c’était »',
    (await button(p, 'Dire comment c’était').count()) === 1 &&
      (await p.getByRole('button', { name: START }).count()) === 0
  );

  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const home = await page(p);
  ok(
    'l’accueil la dit « à valider », et non « en cours »',
    /À valider/i.test(home) &&
      /terminée il y a/.test(home) &&
      (await button(p, 'Reprendre').count()) === 0,
    home.replace(/\n+/g, ' | ').slice(0, 200)
  );
  await button(p, 'Dire comment c’était')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → « Dire comment c’était » rouvre le ressenti, seul',
    (await feeling(p).count()) === 1 &&
      (await button(p, 'Continuer').count()) === 0
  );
  await p
    .getByRole('radio', { name: /Juste/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await button(p, 'Envoyer à Julie')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → envoyé, la séance quitte le téléphone',
    (await record(p)) === null,
    JSON.stringify(await record(p))
  );
  await ctx.close();
}

{
  console.log('\n── sans réseau : le ressenti attend, puis part seul');
  const ctx = await browser.newContext(MOBILE);
  // Les envois arrivés, et eux seuls : une tentative sans réseau échoue, et
  // le serveur ne l'a jamais reçue.
  const posts = [];
  ctx.on('requestfinished', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      posts.push(r.postDataJSON());
  });
  const attempts = [];
  ctx.on('request', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      attempts.push(r.url());
  });
  const p = await signIn(ctx);
  await toFeeling(p);
  await p
    .getByRole('radio', { name: /Juste/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  // L'accueil se charge à la demande, et le serveur de développement ne le
  // sert pas sans réseau : on le charge dans ce document avant de couper.
  // L'application installée n'en a pas besoin — son service worker précache
  // tout le JavaScript.
  //
  // L'adresse se lit là où l'application l'importe : après une retouche, le
  // serveur y ajoute `?t=…`, et un chargement sans ce paramètre serait un
  // autre module — l'accueil retomberait sur « Quelque chose a cassé ».
  await p.evaluate(async () => {
    const app = await (await fetch('/src/App.tsx')).text();
    const url = app.match(/import\("([^"]*\/home\/Today[^"]*)"\)/)?.[1];
    if (url) await import(url);
  });
  await ctx.setOffline(true);
  await button(p, 'Envoyer à Julie')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const said = clean(
    await feeling(p)
      .innerText()
      .catch(() => '')
  );
  ok(
    'sans réseau, l’écran dit que le ressenti partira seul',
    /partira seul dès que le réseau revient/.test(said) &&
      (await button(p, 'Revenir à l’accueil').count()) === 1 &&
      attempts.length === 0,
    `${attempts.length} tentative(s) · ${said.replace(/\n+/g, ' | ').slice(-160)}`
  );
  const kept = (await record(p))?.pending;
  ok(
    '  → il est gardé sur le téléphone, daté de maintenant',
    Number.isInteger(kept?.feedback?.effort) &&
      Math.abs(Date.parse(kept?.completedAt ?? '') - Date.now()) < 120_000,
    JSON.stringify(kept)
  );

  await button(p, 'Revenir à l’accueil')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const waiting = await page(p);
  ok(
    'l’accueil le dit en attente de réseau',
    /En attente de réseau/i.test(waiting) &&
      (await button(p, 'Envoyer maintenant').count()) === 1,
    waiting.replace(/\n+/g, ' | ').slice(0, 200)
  );

  await button(p, 'Envoyer maintenant')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → « Envoyer maintenant » sans réseau le dit, et garde tout',
    /Toujours pas de réseau/.test(await page(p)) &&
      (await record(p))?.pending !== undefined &&
      attempts.length === 0,
    `${attempts.length} tentative(s)`
  );

  const sent = p
    .waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        /\/complete$/.test(new URL(r.url()).pathname),
      { timeout: 5_000 }
    )
    .catch(() => null);
  await ctx.setOffline(false);
  await sent;
  await settle(p);
  ok(
    'au retour du réseau, il part seul, tel qu’il a été dit',
    posts.length === 1 &&
      posts[0]?.feedback?.effort === kept?.feedback?.effort &&
      posts[0]?.completedAt === kept?.completedAt,
    JSON.stringify(posts)
  );
  const after = await page(p);
  ok(
    '  → « Séance envoyée », et la carte d’attente s’en va',
    /Séance envoyée/.test(after) &&
      !/En attente de réseau/i.test(after) &&
      (await record(p)) === null,
    after.replace(/\n+/g, ' | ').slice(0, 200)
  );
  await ctx.close();
}

{
  // Le téléphone se croit en ligne, et la requête part : c'est en route que
  // le réseau tombe. Rien ne dit d'avance qu'il manque — c'est l'absence de
  // réponse qui le dit.
  console.log('\n── une coupure en route : le ressenti attend aussi');
  const ctx = await browser.newContext(MOBILE);
  const posts = [];
  ctx.on('requestfinished', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      posts.push(r.postDataJSON());
  });
  const COMPLETE = /\/api\/client\/sessions\/[^/]+\/complete$/;
  await ctx.route(COMPLETE, (r) => r.abort('internetdisconnected'));
  const p = await signIn(ctx);
  await toFeeling(p);
  await p
    .getByRole('radio', { name: /Juste/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await button(p, 'Envoyer à Julie')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'la requête coupée met le ressenti en attente, sans parler d’échec',
    /partira seul dès que le réseau revient/.test(
      clean(
        await feeling(p)
          .innerText()
          .catch(() => '')
      )
    ) && (await record(p))?.pending !== undefined
  );

  await ctx.unroute(COMPLETE);
  await button(p, 'Revenir à l’accueil')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await button(p, 'Envoyer maintenant')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → « Envoyer maintenant » l’envoie, une fois',
    posts.length === 1 &&
      /Séance envoyée/.test(await page(p)) &&
      (await record(p)) === null,
    `${posts.length} envoi(s)`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
