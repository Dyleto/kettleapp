/**
 * Ce que l'application dit quand elle n'a rien à montrer.
 *
 * Trois situations se ressemblaient à l'écran, et l'application les
 * confondait : le coach n'a encore rien écrit ; le serveur n'a pas répondu ;
 * l'adresse ne mène nulle part. Les trois donnaient une liste vide, et une
 * liste vide donnait « Pas encore de programme ». Un client en salle, sans
 * réseau, lisait que son coach ne lui avait rien préparé — et sur la fiche
 * d'une séance, qu'elle avait été supprimée.
 *
 * Rien de cela ne se voit dans le code : chaque écran compile, et chacun
 * affiche quelque chose de plausible. Il faut couper le réseau sous un vrai
 * navigateur pour lire ce que la personne lit.
 *
 * Dans l'ordre :
 *
 * 1. un programme vide est annoncé comme une attente, avec le personnage ;
 * 2. une panne est annoncée comme une panne, sur tous les écrans qui lisent
 *    le programme, et « Réessayer » le ramène ;
 * 3. un appareil passé hors connexion ne reste pas sur un écran vide — la
 *    requête est alors en pause, ni en erreur ni en chargement, et c'est le
 *    cas que `isError` ne voit pas ;
 * 4. une adresse inconnue dit qu'elle n'existe pas, sans proposer de
 *    réessayer, et sans faire attendre.
 *
 * Les pannes coûtent sept secondes chacune : trois reprises, dont l'attente
 * double. On ne les raccourcit pas — c'est ce que la personne attend
 * réellement, et une suite qui réglerait les reprises à zéro vérifierait une
 * autre application.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  MOBILE,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';

const PROGRAM = /\/api\/client\/program(\?|$)/;
const HISTORY = /\/api\/client\/history(\?|$)/;
const COACH_CLIENTS = /\/api\/coach\/clients(\?|$)/;
const COACH_CLIENT = new RegExp(`/api/coach/clients/${CLIENT}(\\?|$)`);

const DOWN = 'Kettle ne répond pas';
const WAITING = 'Ton programme arrive';

/** Ce que la page affiche, espaces normalisées. */
const screen = (p) => p.evaluate(() => document.body.innerText).then(clean);

/**
 * Attend qu'un texte paraisse, et dit s'il est venu.
 *
 * On attend le texte plutôt qu'une durée fixe : une panne met sept secondes
 * à se déclarer, et une attente écrite en dur serait ou trop courte sur une
 * machine lente, ou inutilement longue partout ailleurs.
 */
const appears = async (p, text, timeout = 15000) => {
  try {
    await p.getByText(text, { exact: false }).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
};

const tab = (p, name) =>
  p
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name })
    .click();

/**
 * Presse un bouton s'il est là, et ne dit rien sinon.
 *
 * Un bouton absent est déjà couvert par l'assertion qui suit — le programme
 * ne revient pas, l'adresse ne change pas. Laisser le clic attendre trente
 * secondes puis lever ferait planter la suite au lieu de la faire échouer,
 * et un plantage ne dit pas quelle promesse est rompue.
 */
const press = async (p, name) => {
  const button = p.getByRole('button', { name });
  if (await button.count()) await button.first().click();
};

const browser = await launch();

{
  console.log('\n── un programme vide est une attente, pas une panne');
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(PROGRAM, (r) =>
    r.fulfill({ json: { program: { _id: 'p-empty', sessions: [] } } })
  );
  await ctx.route(HISTORY, (r) => r.fulfill({ json: { history: [] } }));
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });

  ok("l'accueil annonce que le programme arrive", await appears(p, WAITING));
  ok("  → et ne parle pas d'une panne", !(await screen(p)).includes(DOWN));
  ok(
    '  → avec le personnage endormi',
    (await p.locator('[data-mascot="sleep"]').count()) === 1
  );
  ok(
    "  → que les lecteurs d'écran n'annoncent pas",
    (await p
      .locator('[data-mascot]')
      .first()
      .getAttribute('aria-hidden', { timeout: 1000 })
      .catch(() => null)) === 'true'
  );

  await tab(p, 'Progrès');
  ok(
    "l'historique vide dit ce qui y viendra",
    await appears(p, 'Rien à montrer encore', 4000)
  );
  await press(p, 'Voir mon programme');
  await p.waitForTimeout(500);
  ok(
    '  → et son bouton mène au programme',
    new URL(p.url()).pathname === '/client/program',
    new URL(p.url()).pathname
  );

  await ctx.close();
}

{
  console.log('\n── une panne se dit, sur chaque écran qui lit le programme');
  const ctx = await browser.newContext(MOBILE);
  const cut = (r) => r.abort();
  await ctx.route(PROGRAM, cut);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });

  ok("l'accueil dit que Kettle ne répond pas", await appears(p, DOWN));
  const home = await screen(p);
  ok(
    '  → et non que le programme est vide',
    !home.includes(WAITING) && !home.includes('Pas encore de programme'),
    home.slice(0, 80)
  );
  ok(
    "  → et l'annonce à un lecteur d'écran",
    clean(
      await p
        .locator('[role="alert"]')
        .first()
        .innerText()
        .catch(() => '')
    ).includes(DOWN)
  );

  await tab(p, 'Programme');
  await p.waitForTimeout(600);
  const program = await screen(p);
  ok(
    'le programme aussi',
    program.includes(DOWN) && !program.includes(WAITING),
    program.slice(0, 80)
  );

  await tab(p, 'Progrès');
  await p.waitForTimeout(600);
  const history = await screen(p);
  ok(
    "l'historique aussi",
    history.includes(DOWN) && !history.includes('Rien à montrer encore'),
    history.slice(0, 80)
  );

  // Le réseau revient. Rien ne doit se réparer tout seul à l'insu de la
  // suite : on vérifie d'abord que la panne est toujours affichée, puis que
  // c'est bien le bouton qui ramène le programme.
  await tab(p, "Aujourd'hui");
  await p.waitForTimeout(400);
  await ctx.unroute(PROGRAM, cut);
  await press(p, 'Réessayer');
  ok(
    '« Réessayer » ramène le programme',
    await appears(p, 'Voir la séance', 6000)
  );
  ok('  → et la panne disparaît', !(await screen(p)).includes(DOWN));

  // La fiche d'une séance, ouverte par son adresse pendant une panne : le
  // pire cas, parce que l'écran accusait le coach de l'avoir supprimée.
  await ctx.route(PROGRAM, cut);
  await p.goto(`${BASE}/client/session/sess2`, {
    waitUntil: 'domcontentloaded',
  });
  ok("la fiche d'une séance dit la panne", await appears(p, DOWN));
  const sheet = await screen(p);
  ok(
    "  → sans prétendre que la séance n'existe plus",
    !sheet.includes('Séance introuvable') && !sheet.includes("n'existe plus"),
    sheet.slice(0, 120)
  );
  ok(
    "  → et sans quitter l'adresse demandée",
    new URL(p.url()).pathname === '/client/session/sess2',
    new URL(p.url()).pathname
  );

  // Le compte ne lit pas le programme : on doit pouvoir s'y rendre, et s'y
  // déconnecter, quand le reste ne répond pas.
  //
  // On compte les demandes plutôt que de chercher l'écran de panne : sous la
  // porte, le compte s'afficherait normalement pendant les sept secondes de
  // reprises avant d'être remplacé, et une assertion lue trop tôt le
  // déclarerait joignable. Ne pas demander le programme du tout est la
  // propriété qui tient dans la durée.
  let programRequests = 0;
  ctx.on('request', (r) => {
    if (PROGRAM.test(r.url())) programRequests++;
  });
  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  ok(
    '« Mon compte » reste joignable pendant la panne',
    await p
      .getByRole('heading', { name: 'Mon compte' })
      .waitFor({ timeout: 6000 })
      .then(() => true)
      .catch(() => false)
  );
  await p.waitForTimeout(800);
  ok(
    '  → sans même demander le programme',
    programRequests === 0,
    `${programRequests} demandes`
  );

  await ctx.close();
}

{
  console.log("\n── l'historique seul en panne suffit à ne rien affirmer");
  // Sans lui, « la prochaine » retombe sur la séance 1 : l'accueil
  // afficherait une séance, mais pas forcément la bonne. Mieux vaut dire que
  // rien ne répond que de désigner la mauvaise.
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(HISTORY, (r) => r.abort());
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  ok("l'accueil dit la panne", await appears(p, DOWN));
  ok(
    '  → et ne désigne aucune séance',
    !(await screen(p)).includes('Voir la séance')
  );
  await ctx.close();
}

{
  console.log('\n── un appareil passé hors connexion ne reste pas sur du vide');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Le compte d'abord : il ne charge pas le programme, donc rien n'est en
  // cache au moment où le réseau tombe.
  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  await appears(p, 'Mon compte', 6000);

  // React Query met ses requêtes en pause sur cet événement : elles ne sont
  // alors ni en erreur ni en chargement.
  await p.evaluate(() => window.dispatchEvent(new Event('offline')));
  await tab(p, "Aujourd'hui");

  ok('la panne est dite sans attendre', await appears(p, DOWN, 2500));
  ok('  → et non un programme vide', !(await screen(p)).includes(WAITING));

  await p.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(
    'le programme revient avec le réseau, sans rien presser',
    await appears(p, 'Voir la séance', 6000)
  );

  await ctx.close();
}

{
  console.log("\n── une adresse qui ne mène nulle part n'est pas une panne");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);

  await p.goto(`${BASE}/nimporte/quoi`, { waitUntil: 'domcontentloaded' });
  ok(
    "une page inconnue dit qu'elle n'existe pas",
    await appears(p, "Cette page n'existe pas", 6000)
  );
  ok(
    '  → sans proposer de recharger',
    (await p.getByRole('button', { name: /Recharger|Réessayer/ }).count()) === 0
  );
  await press(p, "Revenir à l'accueil");
  await p.waitForTimeout(800);
  ok(
    "  → et son bouton ramène à l'accueil",
    !new URL(p.url()).pathname.startsWith('/nimporte'),
    new URL(p.url()).pathname
  );

  await ctx.close();
}

{
  console.log("\n── l'espace coach : ni page blanche, ni liste vide");
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // Un client que le serveur ne connaît pas. Il répond 404, et un refus ne
  // se retente pas : l'écran doit le dire tout de suite, pas après les sept
  // secondes d'une panne.
  const refuse = (r) =>
    r.fulfill({ status: 404, json: { message: 'Client introuvable' } });
  await ctx.route(COACH_CLIENT, refuse);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  ok(
    'un client inconnu est dit introuvable, sans attendre',
    await appears(p, 'Ce client est introuvable', 3500)
  );
  ok(
    '  → sans proposer de réessayer',
    (await p.getByRole('button', { name: 'Réessayer' }).count()) === 0
  );
  ok(
    '  → avec le chemin pour repartir',
    (await p.getByRole('button', { name: 'Voir mes clients' }).count()) === 1
  );
  await ctx.unroute(COACH_CLIENT, refuse);

  const cut = (r) => r.abort();
  await ctx.route(COACH_CLIENTS, cut);
  await ctx.route(COACH_CLIENT, cut);

  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  ok('la liste des clients dit la panne', await appears(p, DOWN));
  const list = await screen(p);
  ok(
    "  → et non qu'il n'y a aucun client",
    !list.includes('Aucun client'),
    list.slice(0, 120)
  );
  ok(
    '  → une seule fois : aucun toast ne la redit',
    !list.includes('Impossible de charger')
  );

  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  ok(
    "l'atelier dit la panne au lieu d'une page blanche",
    await appears(p, DOWN)
  );

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
