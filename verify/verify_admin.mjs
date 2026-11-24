/**
 * L'administration (F10b) : quatre nombres, la liste des coachs, et
 * « Nouveau coach ».
 *
 * Le serveur d'essai ne connaît pas l'administration : la suite sert le
 * compte en administrateur, les nombres et les coachs, et reçoit les
 * ouvertures de compte. Ce qui compte est ce qui part — avec ou sans
 * `promote` — et combien de fois : l'ouverture ne se rejoue pas.
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

const WIDE = { viewport: { width: 1440, height: 900 } };

const STATS = {
  coachCount: 4,
  clientCount: 31,
  sessionCount: 512,
  sessionTodayCount: 9,
  exerciseCount: 148,
};
const COACHES = [
  {
    _id: '64c000000000000000000001',
    firstName: 'Julie',
    lastName: 'Martin',
    email: 'julie@example.com',
    clientCount: 12,
    exerciseCount: 64,
    createdAt: '2026-02-10T09:00:00.000Z',
  },
  {
    _id: '64c000000000000000000002',
    firstName: 'Marc',
    lastName: 'Lefèvre',
    email: 'marc@example.com',
    clientCount: 1,
    exerciseCount: 41,
    createdAt: '2026-03-02T09:00:00.000Z',
  },
  // Ouvert sans nom : il attend celui que Google donnera.
  {
    _id: '64c000000000000000000003',
    email: 'sam@example.com',
    clientCount: 0,
    exerciseCount: 0,
    createdAt: '2026-05-20T09:00:00.000Z',
  },
];
/** Un compte qui existe, sans être coach. */
const LEO = { firstName: 'Léo', lastName: 'Petit', email: 'leo@example.com' };

const me = (await (await fetch(`${API}/api/auth/me`)).json()).user;

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
/** Les paragraphes d'une zone, sans les initiales d'un avatar. */
const paragraphs = (locator) =>
  locator
    .locator('p')
    .allInnerTexts()
    .then((all) => clean(all.map((t) => t.trim()).join(' / ')))
    .catch(() => '');

/**
 * L'écran, ouvert en administrateur. `answer` décide de la réponse à une
 * ouverture ; `sent` reçoit ce qui part, `coachReads` compte les lectures
 * de la liste.
 */
const open = async (browser, { context = WIDE, answer } = {}) => {
  const ctx = await browser.newContext(context);
  const sent = [];
  const counts = { coachReads: 0 };
  await ctx.route(/\/api\/auth\/me$/, (r) =>
    r.fulfill({ json: { user: { ...me, isAdmin: true } } })
  );
  await ctx.route(/\/api\/admin\/stats$/, (r) => r.fulfill({ json: STATS }));
  await ctx.route(/\/api\/admin\/coaches$/, (r) => {
    counts.coachReads += 1;
    return r.fulfill({ json: COACHES });
  });
  await ctx.route(/\/api\/admin\/create-coach$/, (r) => {
    const body = r.request().postDataJSON();
    sent.push(body);
    const custom = answer?.(body);
    if (custom) return r.fulfill(custom);
    if (body.email === LEO.email && !body.promote)
      return r.fulfill({ json: { status: 'exists', account: LEO } });
    const known = body.email === LEO.email ? LEO : body;
    return r.fulfill({
      status: 201,
      json: {
        status: 'success',
        outcome: body.promote ? 'promoted' : 'created',
        coach: {
          _id: '64c000000000000000000009',
          email: known.email,
          firstName: known.firstName,
          lastName: known.lastName,
        },
      },
    });
  });
  const p = await signIn(ctx);
  await p.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  // Les chiffres et la liste arrivent chacun de leur côté, et les formes du
  // chargement ne portent pas `data-stat` : la CI, plus lente, lisait les
  // tuiles avant elles et n'en trouvait aucune. L'écran est prêt quand les
  // quatre tuiles et la carte de Julie sont là.
  await p
    .locator('[data-stat]')
    .nth(3)
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  await p
    .locator('[data-coach="julie@example.com"]')
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p, sent, counts };
};

/** Ouvrir « Nouveau coach » et remplir ce qui est donné. */
const fillDialog = async (p, { firstName, lastName, email }) => {
  await p
    .getByRole('button', { name: 'Nouveau coach' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const dialog = p.getByRole('dialog');
  const fields = { Prénom: firstName, Nom: lastName, 'Adresse e-mail': email };
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    await dialog
      .getByRole('textbox', { name, exact: true })
      .fill(value, { timeout: 2000 })
      .catch(() => {});
  }
  return dialog;
};

/**
 * Toucher un bouton et lire le message qui suit : il ne dure que deux
 * secondes, il se lit au geste.
 */
const pressAndRead = async (p, locator) => {
  await locator.click({ timeout: 2000 }).catch(() => {});
  return text(p.locator('[data-scope="toast"][data-part="title"]').first());
};

const browser = await launch();

{
  console.log('\n── l’écran');
  const { ctx, p } = await open(browser);
  const tiles = await p
    .locator('[data-stat]')
    .evaluateAll((all) =>
      all.map((e) =>
        [...e.querySelectorAll('p')].map((t) => t.textContent).join(' ')
      )
    )
    .catch(() => []);
  ok(
    'quatre nombres, ce qu’ils comptent, et les séances du jour',
    tiles.join(' / ') ===
      "4 coachs / 31 clients / 512 séances faites + 9 aujourd'hui / 148 exercices créés",
    tiles.join(' / ')
  );
  const julie = await paragraphs(
    p.locator('[data-coach="julie@example.com"] > div').first()
  );
  const marc = await paragraphs(
    p.locator('[data-coach="marc@example.com"] > div').first()
  );
  ok(
    'une ligne par coach : nom, adresse, clients, exercices, et depuis quand',
    julie ===
      'Julie Martin / julie@example.com / 12 clients / 64 exercices / depuis février 2026' &&
      marc.includes(' / 1 client / '),
    `${julie} · ${marc}`
  );
  const sam = await p
    .locator('[data-coach="sam@example.com"] > div')
    .first()
    .locator('p')
    .allInnerTexts()
    .catch(() => []);
  ok(
    'sans nom, la ligne dit l’adresse, une seule fois',
    sam[0] === 'sam@example.com' &&
      sam.filter((t) => t === 'sam@example.com').length === 1,
    sam.join(' / ')
  );
  ok(
    'le rail et le titre nomment l’écran « Administration »',
    (await p
      .getByRole('link', { name: 'Administration' })
      .getAttribute('aria-current', { timeout: 2000 })
      .catch(() => null)) === 'page' &&
      (await text(p.getByRole('heading', { level: 1 }))) === 'Administration' &&
      (await p.title()) === 'Administration · Kettle'
  );
  await ctx.close();
}

{
  const { ctx, p } = await open(browser, { context: MOBILE });
  const boxes = await p
    .locator('[data-stat]')
    .evaluateAll((all) =>
      all.map((e) => Math.round(e.getBoundingClientRect().top))
    )
    .catch(() => []);
  const card = await paragraphs(
    p.locator('[data-coach="julie@example.com"] > div:visible').first()
  );
  // Le bord droit le plus loin de la page, comparé à la largeur de
  // l'écran. Ni `scrollWidth` ni `innerWidth` : un téléphone élargit sa
  // fenêtre de mise en page jusqu'au contenu qui dépasse — mesuré, 396 px
  // pour un écran de 390 —, et le débord disparaît des deux mesures.
  const overflow = await p
    .evaluate(
      (width) =>
        Math.ceil(
          Math.max(
            ...[...document.querySelectorAll('main *')].map(
              (e) => e.getBoundingClientRect().right
            )
          )
        ) - width,
      MOBILE.viewport.width
    )
    .catch(() => 1);
  ok(
    'sur téléphone : les tuiles sur deux colonnes, une carte par coach, rien ne déborde',
    boxes.length === 4 &&
      boxes[0] === boxes[1] &&
      boxes[2] === boxes[3] &&
      boxes[2] > boxes[0] &&
      card ===
        'Julie Martin / julie@example.com / 12 clients · 64 exercices · depuis février 2026' &&
      overflow <= 0,
    `${boxes.join(', ')} · ${card} · débord ${overflow} px`
  );
  await ctx.close();
}

{
  console.log('\n── « Nouveau coach »');
  const { ctx, p, sent, counts } = await open(browser);
  const dialog = await fillDialog(p, { email: 'ines@example' });
  const create = dialog.getByRole('button', { name: 'Créer le compte' });
  const notYet = await create.isDisabled().catch(() => false);
  await dialog
    .getByRole('textbox', { name: 'Adresse e-mail' })
    .fill('ines.roux@example.com')
    .catch(() => {});
  const armed = await create.isEnabled().catch(() => false);
  ok(
    '« Créer le compte » attend une adresse, et dit avec quoi on se connecte',
    notYet &&
      armed &&
      (await text(dialog)).includes(
        'La connexion se fera avec le compte Google de cette adresse.'
      ),
    `${notYet} · ${armed}`
  );
  await dialog
    .getByRole('textbox', { name: 'Prénom' })
    .fill('Inès')
    .catch(() => {});
  await dialog
    .getByRole('textbox', { name: 'Nom', exact: true })
    .fill('Roux')
    .catch(() => {});
  const reads = counts.coachReads;
  const said = await pressAndRead(p, create);
  await gone(dialog);
  await settle(p);
  ok(
    'une adresse inconnue ouvre le compte, avec le nom saisi, sans rien demander',
    JSON.stringify(sent) ===
      JSON.stringify([
        { email: 'ines.roux@example.com', firstName: 'Inès', lastName: 'Roux' },
      ]) &&
      said === 'Compte de coach ouvert pour Inès Roux' &&
      (await p.getByRole('dialog').count()) === 0 &&
      counts.coachReads > reads,
    `${JSON.stringify(sent)} · ${said} · ${reads} → ${counts.coachReads}`
  );
  await ctx.close();
}

{
  const { ctx, p, sent } = await open(browser);
  const dialog = await fillDialog(p, {
    firstName: 'Leo',
    email: 'leo@example.com',
  });
  await dialog
    .getByRole('button', { name: 'Créer le compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const asked = await text(
    p.locator('[data-new-coach-found]').getByRole('heading')
  );
  const found = await paragraphs(p.locator('[data-new-coach-found]'));
  ok(
    'une adresse connue : « Ce compte existe déjà », avec son nom, et rien n’est donné',
    asked === 'Ce compte existe déjà' &&
      found.startsWith('Léo Petit / leo@example.com') &&
      sent.length === 1 &&
      !('promote' in sent[0]),
    `${asked} · ${found} · ${JSON.stringify(sent)}`
  );

  // Le bouton doit avoir été là : sans la question, l'adresse reste dans
  // le formulaire et l'assertion passerait sans que « Retour » existe.
  const backed = await p
    .getByRole('button', { name: 'Retour' })
    .click({ timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  const kept = await p
    .getByRole('textbox', { name: 'Adresse e-mail' })
    .inputValue({ timeout: 2000 })
    .catch(() => '');
  ok(
    '→ « Retour » revient au formulaire, l’adresse gardée',
    backed &&
      kept === 'leo@example.com' &&
      sent.length === 1 &&
      (await p.locator('[data-new-coach-found]').count()) === 0,
    `${backed} · ${kept}`
  );

  await p
    .getByRole('button', { name: 'Créer le compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const said = await pressAndRead(
    p,
    p.getByRole('button', { name: 'Donner le rôle de coach' })
  );
  await gone(p.getByRole('dialog'));
  ok(
    '→ « Donner le rôle de coach » renvoie avec `promote`, et le nom du compte',
    sent.length === 3 &&
      sent[2].promote === true &&
      said === 'Léo Petit est maintenant coach',
    `${JSON.stringify(sent.at(-1))} · ${said}`
  );
  await ctx.close();
}

{
  console.log('\n── quand ça ne passe pas');
  const { ctx, p, sent } = await open(browser, {
    answer: (body) =>
      body.email === 'julie@example.com'
        ? {
            status: 409,
            json: { status: 'fail', message: 'Ce compte est déjà coach' },
          }
        : { status: 500, json: { status: 'error', message: 'Erreur' } },
  });
  const dialog = await fillDialog(p, { email: 'julie@example.com' });
  await dialog
    .getByRole('button', { name: 'Créer le compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'un compte déjà coach : la boîte le dit, et reste ouverte',
    (await text(dialog.getByRole('alert'))) ===
      'Ce compte est déjà coach : il est dans la liste.' &&
      (await dialog.count()) === 1
  );

  await dialog
    .getByRole('textbox', { name: 'Adresse e-mail' })
    .fill('nora@example.com')
    .catch(() => {});
  const cleared = (await dialog.getByRole('alert').count()) === 0;
  await dialog
    .getByRole('button', { name: 'Créer le compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'une panne : « Rien n’a été créé », une seule demande, l’adresse gardée',
    cleared &&
      (await text(dialog.getByRole('alert'))) ===
        "Rien n'a été créé. Réessaie." &&
      sent.filter((b) => b.email === 'nora@example.com').length === 1 &&
      (await dialog
        .getByRole('textbox', { name: 'Adresse e-mail' })
        .inputValue()
        .catch(() => '')) === 'nora@example.com',
    `${cleared} · ${sent.length} envois`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
