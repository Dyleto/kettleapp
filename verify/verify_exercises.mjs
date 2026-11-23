/**
 * La bibliothèque d'exercices (F7a) : les lignes, leur ordre, le champ qui
 * cherche et crée, la fiche en panneau ou en feuille.
 *
 * Le serveur d'essai porte dix exercices, dont un seul avec une vidéo
 * (« Kettlebell Swing ») et deux jamais utilisés. Les ordres attendus sont
 * recalculés depuis ce qu'il sert, et non écrits en dur : un décor qui gagne
 * un exercice ne fait pas tomber une assertion qui ne parle pas de lui.
 *
 * La fiche (F7b) : sa portée, ses deux sortes de liens, les refus de la
 * saisie, l'enregistrement sans message, et la suppression avec
 * « Annuler ».
 *
 * Aucun nom du décor ne commence par un accent, et ses deux ex æquo sont
 * déjà dans l'ordre alphabétique chez l'API : l'accent et les ex æquo se
 * vérifient dans `library.test.ts`, pas ici.
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

const WIDE = { viewport: { width: 1440, height: 1000 } };

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
const served = await (await fetch(`${API}/api/coach/exercises`)).json();
const byName = (a, b) =>
  a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
const nameOrder = [...served].sort(byName).map((e) => e._id);
const usageOrder = [...served]
  .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b))
  .map((e) => e._id);

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const rows = (p) =>
  p
    .locator('[data-exercise-row]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-exercise-row')))
    .catch(() => []);
const row = (p, id) => p.locator(`[data-exercise-row="${id}"]`);
const field = (p) =>
  p.getByRole('searchbox', { name: 'Chercher ou créer un exercice' });
const open = async (ctx, path = '/coach/exercises') => {
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return p;
};

const browser = await launch();

{
  console.log('\n── la liste');
  const ctx = await browser.newContext(WIDE);
  const p = await open(ctx);
  ok(
    'l’écran porte le nom de son onglet, et compte ses exercices',
    (await text(p.locator('h1'))) === 'Exercices' &&
      (await text(p.locator('[data-exercise-count]'))) ===
        `${served.length} exercices`
  );
  ok(
    'par nom d’abord',
    (await rows(p)).join() === nameOrder.join(),
    (await rows(p)).join()
  );
  const withVideo = await p
    .locator('[data-exercise-row]:has([data-thumb="video"])')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-exercise-row')))
    .catch(() => []);
  ok(
    'une vignette dit quels mouvements ont une vidéo',
    withVideo.join() ===
      served
        .filter((e) => e.videoUrl)
        .map((e) => e._id)
        .join(),
    withVideo.join()
  );
  const usage = async (id) => text(row(p, id).locator('[data-usage]'));
  ok(
    'chaque ligne dit son usage : séances, une séance, jamais utilisé',
    (await usage('ex1')) === '12 séances' &&
      (await usage('ex7')) === '1 séance' &&
      (await usage('ex8')) === 'jamais utilisé',
    `${await usage('ex1')} · ${await usage('ex7')} · ${await usage('ex8')}`
  );
  ok(
    '  → et sa consigne, quand elle en a une',
    (await text(row(p, 'ex2').locator('[data-description]'))) ===
      'Kettlebell contre la poitrine, descendre entre les talons.' &&
      (await row(p, 'ex3').locator('[data-description]').count()) === 0
  );

  ok(
    'sans choix, le panneau montre le premier de la liste',
    (await p
      .locator('[data-exercise-panel]')
      .getAttribute('data-exercise-panel')
      .catch(() => '')) === nameOrder[0] &&
      (await row(p, nameOrder[0])
        .getAttribute('aria-current')
        .catch(() => '')) === 'true'
  );
  await row(p, 'ex2')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'toucher une ligne ouvre sa fiche dans le panneau, et la marque',
    p.url().endsWith('/coach/exercises/ex2') &&
      (await p
        .locator('[data-exercise-panel]')
        .getAttribute('data-exercise-panel')
        .catch(() => '')) === 'ex2' &&
      (await row(p, 'ex2')
        .getAttribute('aria-current')
        .catch(() => '')) === 'true' &&
      (await row(p, nameOrder[0])
        .getAttribute('aria-current')
        .catch(() => '')) === null,
    p.url().split('/').at(-1)
  );

  await p
    .getByRole('button', { name: 'Trier : Par nom' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Les plus utilisés' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Les plus utilisés » range par usage',
    (await rows(p)).join() === usageOrder.join() &&
      (await p
        .getByRole('button', { name: 'Trier : Les plus utilisés' })
        .count()) === 1,
    (await rows(p)).join()
  );
  await ctx.close();
}

{
  console.log('\n── le champ qui cherche et crée');
  const ctx = await browser.newContext(WIDE);
  const p = await open(ctx);
  await field(p)
    .fill('CORDE a')
    .catch(() => {});
  ok(
    'chercher garde chaque mot, sans accent ni casse',
    (await rows(p)).join() === 'ex8',
    (await rows(p)).join()
  );
  await field(p)
    .fill('corde a sauter')
    .catch(() => {});
  ok(
    'un nom qui existe déjà, à l’accent près, ne se propose pas',
    (await rows(p)).join() === 'ex8' &&
      (await p.locator('[data-create-exercise]').count()) === 0
  );
  await field(p)
    .fill('Soulevé de terre')
    .catch(() => {});
  const offer = await text(p.locator('[data-create-exercise]'));
  const body = await text(p.locator('main'));
  ok(
    'un nom neuf : « Créer », et la phrase qui dit pourquoi',
    (await rows(p)).length === 0 &&
      offer === 'Créer « Soulevé de terre »' &&
      body.includes('Aucun exercice ne porte ce nom.'),
    offer
  );
  await field(p)
    .press('Enter')
    .catch(() => {});
  await settle(p);
  const created = (
    await (await fetch(`${API}/api/coach/exercises`)).json()
  ).find((e) => e.name === 'Soulevé de terre');
  ok(
    'Entrée le crée, ouvre sa fiche et vide le champ',
    !!created &&
      p.url().endsWith(`/coach/exercises/${created._id}`) &&
      (await p
        .locator('[data-exercise-panel]')
        .getAttribute('data-exercise-panel')
        .catch(() => '')) === created._id &&
      (await field(p)
        .inputValue()
        .catch(() => '?')) === '' &&
      (await text(p.locator('[data-exercise-count]'))) ===
        `${served.length + 1} exercices`,
    `${created?._id} · ${p.url().split('/').at(-1)}`
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  const ctx = await browser.newContext(MOBILE);
  const p = await open(ctx);
  ok(
    'sans choix, aucune fiche ne s’ouvre',
    (await p.getByRole('dialog').count()) === 0 &&
      (await p.locator('[data-exercise-panel]').count()) === 0
  );
  await row(p, 'ex1')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Kettlebell Swing' });
  ok(
    'toucher une ligne monte sa fiche dans une feuille',
    (await sheet.count()) === 1 &&
      (await sheet
        .getByRole('button', { name: "Nom de l'exercice" })
        .count()) === 1
  );
  await p.goBack();
  await gone(sheet);
  ok(
    '  → et le retour du téléphone la referme',
    (await sheet.count()) === 0 && p.url().endsWith('/coach/exercises'),
    p.url().split('/').at(-1)
  );
  await ctx.close();
}

{
  console.log('\n── la fiche');
  // « Corde à sauter », jamais utilisé, reçoit une consigne et un lien
  // Vimeo : de quoi éprouver l'autre sorte de lien, et ce qu'« Annuler »
  // doit remettre.
  await fetch(`${API}/api/coach/exercises/ex8`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Poignets souples.',
      videoUrl: 'https://vimeo.com/123456',
    }),
  });
  const serverExercise = async (id) =>
    (await (await fetch(`${API}/api/coach/exercises`)).json()).find(
      (e) => e._id === id
    );
  const ctx = await browser.newContext(WIDE);
  const p = await open(ctx, '/coach/exercises/ex1');
  const panel = p.locator('[data-exercise-panel]');
  const reach = await text(panel.locator('[data-exercise-reach]'));
  ok(
    'un exercice utilisé dit sa portée, et pourquoi il ne se supprime pas',
    reach.includes(
      'Utilisé dans 12 séances, chez 4 clients. Ce que tu changes ici change partout.'
    ) &&
      reach.includes('Retire-le de ces séances avant de le supprimer.') &&
      (await panel
        .getByRole('button', { name: 'Supprimer Kettlebell Swing' })
        .isDisabled()
        .catch(() => false)),
    reach.replace(/\n/g, ' | ')
  );
  const plays =
    (await panel
      .getByRole('button', { name: "Lire la vidéo de l'exercice" })
      .count()) === 1;

  await row(p, 'ex8')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const opens = panel.getByRole('link', { name: 'Ouvrir la vidéo' });
  ok(
    'un lien YouTube se joue dans la fiche, un autre s’ouvre ailleurs',
    plays &&
      (await opens.getAttribute('href').catch(() => '')) ===
        'https://vimeo.com/123456' &&
      (await opens.getAttribute('target').catch(() => '')) === '_blank',
    `${plays} · ${await opens.getAttribute('href').catch(() => 'aucun lien')}`
  );

  // Ce qui part vers le serveur pour cet exercice.
  const puts = [];
  p.on('request', (r) => {
    if (r.method() === 'PUT' && r.url().endsWith('/api/coach/exercises/ex8'))
      puts.push(r.postDataJSON());
  });
  const edit = async (label, value) => {
    await panel
      .getByRole('button', { name: label, exact: true })
      .click({ timeout: 2000 })
      .catch(() => {});
    const input = panel.getByRole('textbox', { name: label, exact: true });
    await input.fill(value).catch(() => {});
    await input.press('Enter').catch(() => {});
    await settle(p);
  };
  await edit("Nom de l'exercice", '');
  ok(
    'un nom vidé reprend l’ancien, sans rien envoyer',
    (await text(
      panel.getByRole('button', { name: "Nom de l'exercice", exact: true })
    )) === 'Corde à sauter' &&
      puts.length === 0 &&
      (await serverExercise('ex8'))?.name === 'Corde à sauter',
    JSON.stringify(puts)
  );
  // Chaque refus se juge sur ses propres envois : un nom parti par erreur
  // ne doit pas faire tomber le lien.
  puts.length = 0;
  await edit('Lien vidéo — Corde à sauter', 'pas un lien');
  ok(
    'un lien illisible est refusé, et la fiche dit pourquoi',
    (await text(panel.getByRole('alert'))) ===
      'Ce lien ne ressemble pas à une adresse.' && puts.length === 0,
    JSON.stringify(puts)
  );
  await panel
    .getByRole('textbox', { name: 'Lien vidéo — Corde à sauter' })
    .press('Escape')
    .catch(() => {});

  await panel
    .getByRole('button', { name: 'Consigne — Corde à sauter', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await panel
    .getByRole('textbox', { name: 'Consigne — Corde à sauter' })
    .fill('Poignets souples, sauts courts.')
    .catch(() => {});
  await p
    .locator('h1')
    .click()
    .catch(() => {});
  await settle(p);
  ok(
    'une consigne s’enregistre seule, sans message',
    (await serverExercise('ex8'))?.description ===
      'Poignets souples, sauts courts.' &&
      (await p.locator('[data-scope="toast"][data-part="root"]').count()) === 0,
    (await serverExercise('ex8'))?.description
  );

  await panel
    .getByRole('button', { name: 'Supprimer Corde à sauter' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const banner = p
    .locator('[data-scope="toast"][data-part="root"]')
    .filter({ hasText: 'supprimé' });
  await banner.waitFor({ timeout: 4000 }).catch(() => {});
  // La bannière paraît au geste, la suppression part derrière elle : le
  // serveur ne se lit qu'une fois la requête revenue. Lu tout de suite, il
  // gardait l'exercice quand le banc complet chargeait la machine.
  await settle(p);
  ok(
    'un exercice jamais utilisé se supprime d’une touche, et la bannière offre « Annuler »',
    (await row(p, 'ex8').count()) === 0 &&
      !(await serverExercise('ex8')) &&
      p.url().endsWith('/coach/exercises') &&
      (await text(banner.locator('[data-part="title"]'))) ===
        '« Corde à sauter » supprimé' &&
      (await banner.getByRole('button', { name: 'Annuler' }).count()) === 1,
    `${await text(banner)} · ${(await serverExercise('ex8')) ? 'encore sur le serveur' : 'parti'} · ${p.url()}`
  );
  await banner
    .getByRole('button', { name: 'Annuler' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const restored = (
    await (await fetch(`${API}/api/coach/exercises`)).json()
  ).find((e) => e.name === 'Corde à sauter');
  ok(
    '  → « Annuler » le remet, consigne et vidéo comprises, et rouvre sa fiche',
    !!restored &&
      restored.description === 'Poignets souples, sauts courts.' &&
      restored.videoUrl === 'https://vimeo.com/123456' &&
      p.url().endsWith(`/coach/exercises/${restored._id}`) &&
      (await panel.getAttribute('data-exercise-panel').catch(() => '')) ===
        restored._id,
    `${restored?._id} · ${p.url().split('/').at(-1)}`
  );

  // Toutes les tentatives échouent : une mutation est reprise deux fois.
  await ctx.route(/\/api\/coach\/exercises\/ex10$/, (r) =>
    r.request().method() === 'DELETE'
      ? r.fulfill({ status: 500, json: { message: 'Panne' } })
      : r.fallback()
  );
  await row(p, 'ex10')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await panel
    .getByRole('button', { name: 'Supprimer Planche' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const refused = p
    .locator('[data-scope="toast"][data-part="root"]')
    .filter({ hasText: 'n’a pas été supprimé' });
  await refused.waitFor({ timeout: 8000 }).catch(() => {});
  ok(
    'une suppression refusée le dit, et l’exercice reste',
    (await text(refused)).includes(
      'Il est toujours dans ta bibliothèque. Réessaie.'
    ) &&
      (await row(p, 'ex10').count()) === 1 &&
      (await panel.getAttribute('data-exercise-panel').catch(() => '')) ===
        'ex10',
    await text(refused)
  );
  await ctx.close();
}

{
  console.log('\n── une bibliothèque vide');
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/coach\/exercises$/, (r) =>
    r.request().method() === 'GET' ? r.fulfill({ json: [] }) : r.fallback()
  );
  const p = await open(ctx);
  const body = await text(p.locator('main'));
  ok(
    'une bibliothèque vide dit comment la remplir',
    body.includes('Ta bibliothèque est vide') &&
      body.includes('Tape le nom d') &&
      (await p.locator('main [data-mascot="hello"]').count()) === 1 &&
      (await p.getByRole('button', { name: /^Trier/ }).count()) === 0,
    body.slice(0, 120).replace(/\n/g, ' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
