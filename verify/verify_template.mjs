/**
 * Les modèles de programme : la liste, l'atelier, et ce qu'ils n'ont pas.
 *
 * Demande du terrain : « un nouvel onglet pour le coach qui va permettre de
 * répertorier des programmes préfaits […] et après pouvoir faire tout ce
 * qu'il peut faire comme un programme client classique ».
 *
 * « Tout ce qu'il peut faire » est tenu par la réutilisation de l'atelier :
 * un seul hook, `useProgramWorkshop`, sert les deux écrans. C'est précisément
 * ce qui a besoin d'être lu dans un navigateur plutôt que compilé — un
 * atelier qui monte sans erreur de type mais n'enregistre pas chez le bon
 * destinataire passerait `typecheck` sans broncher.
 *
 * Cette suite vérifie donc, dans cet ordre :
 *
 * 1. la liste montre les modèles du coach avec leur nombre de séances ;
 * 2. on crée en tapant un nom, et l'atelier s'ouvre sur le modèle créé ;
 * 3. ce qu'on y écrit arrive dans le modèle — et nulle part ailleurs ;
 * 4. le nom du modèle s'édite là où il se lit ;
 * 5. l'atelier d'un modèle ne propose pas « copier vers un client », la seule
 *    chose de cet écran qui parle d'un client ;
 * 6. supprimer demande confirmation, et le serveur perd bien le modèle ;
 * 7. l'écran porte le nom de son onglet, son bouton la couleur de
 *    l'application, et une liste vide dit à quoi sert un modèle ;
 * 8. le rail d'un modèle ne dit rien de ce qu'un client aurait fait — il
 *    écrivait « jamais faite » sous chaque séance, sur un écran sans client.
 */
import { BASE, launch, ok, failureCount, signIn, clean } from './common.mjs';

const API = 'http://localhost:3001';
const CLIENT = '507f1f77bcf86cd799439012';

/** Les modèles que le serveur d'essai porte vraiment, lus hors navigateur. */
const serverTemplates = async () => {
  const r = await fetch(`${API}/api/coach/templates`);
  return (await r.json()).templates;
};

const serverTemplate = async (id) => {
  const r = await fetch(`${API}/api/coach/templates/${id}`);
  if (!r.ok) return null;
  return (await r.json()).template;
};

/** Les séances du client : elles ne doivent pas bouger d'un pouce ici. */
const clientSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  const { program } = await r.json();
  return program.sessions;
};

const main = async () => {
  await fetch(`${API}/api/mock/reset`, { method: 'POST' });

  const browser = await launch();
  const p = await signIn(await browser.newContext());

  // L'état du client avant toute écriture dans un modèle. Relevé plutôt
  // qu'écrit en dur : un décor qui gagne une séance ferait tomber une
  // assertion qui ne parle pas de lui.
  const clientBefore = await clientSessions();

  // ── 1. La liste ──────────────────────────────────────────────────────────
  await p.goto(`${BASE}/coach/templates`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);

  const seeded = p.getByRole('button', {
    name: /Ouvrir le modèle Prise de masse/,
  });
  ok('la liste montre le modèle du coach', (await seeded.count()) === 1);

  const title = clean(
    await p
      .locator('h1')
      .first()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok("l'écran porte le nom de son onglet", title === 'Modèles', title);

  ok(
    '  → avec son nombre de séances',
    clean(await seeded.innerText()).includes('2 séances'),
    clean(await seeded.innerText()).replace(/\n/g, ' · ')
  );

  // ── 2. On crée en tapant un nom ──────────────────────────────────────────
  const field = p.getByRole('textbox', { name: 'Nom du nouveau modèle' });
  await field.fill('Hypertrophie haut du corps');
  // L'ambre de la marque, lu sur le bouton lui-même. Il était bleu : la
  // palette par défaut du composant, que personne n'avait choisie.
  const createColor = await p
    .getByRole('button', { name: 'Créer' })
    .evaluate((button) => getComputedStyle(button).backgroundColor)
    .catch(() => '');
  ok(
    "« Créer » est à la couleur de l'application",
    createColor === 'rgb(207, 159, 63)',
    createColor
  );
  await field.press('Enter');
  await p.waitForTimeout(1800);

  ok(
    "l'atelier s'ouvre sur le modèle créé",
    /\/coach\/templates\/[^/]+\/s\/1$/.test(p.url()),
    p.url()
  );

  const createdId = p.url().match(/templates\/([^/]+)\/s\//)?.[1] ?? '';
  const body = () => p.locator('body').innerText().then(clean);

  ok(
    '  → vide, et il le dit',
    (await body()).includes('Ce modèle est vide'),
    (await body()).slice(0, 80).replace(/\n/g, ' · ')
  );

  // ── 3. Ce qu'on écrit arrive dans le modèle ──────────────────────────────
  await p.getByRole('button', { name: 'Ajouter une séance' }).click();
  await p.waitForTimeout(2000);

  const templateRail = await body();
  ok(
    "le rail d'un modèle ne dit rien de ce qu'un client aurait fait",
    templateRail.includes('Séance 1') && !/jamais faite/i.test(templateRail),
    templateRail.match(/[^\n]*jamais faite[^\n]*/i)?.[0] ?? ''
  );

  const withOne = await serverTemplate(createdId);
  ok(
    'une séance ajoutée au modèle est enregistrée',
    withOne?.sessions.length === 1,
    `${withOne?.sessions.length} séance(s)`
  );

  await p.getByRole('button', { name: /^Nom de la séance 1$/ }).click();
  const sessionName = p.getByRole('textbox', { name: /^Nom de la séance 1$/ });
  await sessionName.fill('Poussée');
  await sessionName.press('Enter');
  await p.waitForTimeout(2000);

  const named = await serverTemplate(createdId);
  ok(
    '  → et son nom aussi',
    named?.sessions[0]?.name === 'Poussée',
    named?.sessions[0]?.name
  );

  // Le même atelier sert les deux écrans : la seule façon de voir qu'il écrit
  // chez le bon destinataire est de regarder l'autre.
  const untouched = await clientSessions();
  ok(
    "  → sans rien écrire dans le programme d'un client",
    JSON.stringify(untouched) === JSON.stringify(clientBefore),
    `${clientBefore.length} → ${untouched.length} séances, la première nommée ${untouched[0]?.name ?? '(sans nom)'}`
  );

  // ── 4. Le nom du modèle, édité là où il se lit ───────────────────────────
  await p.getByRole('button', { name: 'Nom du modèle' }).click();
  const templateName = p.getByRole('textbox', { name: 'Nom du modèle' });
  await templateName.fill('Haut du corps');
  await templateName.press('Enter');
  await p.waitForTimeout(2000);

  const renamed = await serverTemplate(createdId);
  ok(
    'le nom du modèle s’enregistre à la frappe',
    renamed?.name === 'Haut du corps',
    renamed?.name
  );

  // ── 5. Ce que l'atelier d'un modèle n'a pas ──────────────────────────────
  ok(
    "l'atelier d'un modèle ne propose pas « copier vers un client »",
    (await p.getByRole('button', { name: /Copier vers un client/ }).count()) ===
      0
  );

  // Le même bouton existe bien chez un client : sans ce contrôle, l'assertion
  // ci-dessus resterait verte si le bouton disparaissait des deux écrans.
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1800);
  ok(
    '  → alors que celui d’un client le propose',
    (await p.getByRole('button', { name: /Copier vers un client/ }).count()) >=
      1
  );
  // La même contre-épreuve pour le rail : « jamais faite » doit rester là où
  // il y a quelqu'un pour faire la séance.
  ok(
    '  → et que son rail dit bien ce qui n’a jamais été fait',
    /jamais faite/i.test(await body())
  );

  // ── 6. La suppression, et sa question ────────────────────────────────────
  await p.goto(`${BASE}/coach/templates`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);

  await p
    .getByRole('button', { name: /Supprimer le modèle Haut du corps/ })
    .click();
  await p.waitForTimeout(600);

  const asked = (await body()).includes('Supprimer « Haut du corps » ?');
  ok(
    'supprimer un modèle demande confirmation',
    asked,
    asked ? '' : (await body()).slice(0, 120).replace(/\n/g, ' · ')
  );

  // Sans la question, le bouton de la boîte n'existe pas : on le dit plutôt
  // que de laisser la suite s'achever sur une attente expirée, qui ferait
  // passer un sabotage mesurable pour un plantage.
  if (!asked) {
    ok('  → et le serveur perd bien le modèle', false, 'non éprouvé');
    await browser.close();
    process.exit(1);
  }

  await p.getByRole('button', { name: /^Supprimer$/ }).click();
  await p.waitForTimeout(1500);

  const left = await serverTemplates();
  ok(
    '  → et le serveur perd bien le modèle',
    left.length === 1 && left[0]?.name === 'Prise de masse',
    left.map((t) => t.name).join(', ')
  );

  // ── 7. Une liste vide dit à quoi sert un modèle ──────────────────────────
  {
    const ctx = await browser.newContext();
    await ctx.route(/\/api\/coach\/templates(\?|$)/, (r) =>
      r.fulfill({ json: { templates: [] } })
    );
    const empty = await signIn(ctx);
    await empty.goto(`${BASE}/coach/templates`, {
      waitUntil: 'domcontentloaded',
    });
    await empty.waitForTimeout(1500);
    const text = clean(await empty.locator('body').innerText());
    ok(
      'sans modèle, la liste dit à quoi ils servent',
      text.includes('Écris-le une fois') && text.includes("Tu l'importes"),
      text.slice(0, 100).replace(/\n/g, ' · ')
    );
    ok(
      '  → avec le personnage',
      (await empty.locator('[data-mascot="hello"]').count()) === 1
    );
    await ctx.close();
  }

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
