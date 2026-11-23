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
 * 2. « Nouveau » demande un nom, et l'atelier s'ouvre sur le modèle créé ;
 * 3. ce qu'on y écrit arrive dans le modèle — et nulle part ailleurs ;
 * 4. le nom du modèle s'édite là où il se lit ;
 * 5. l'atelier d'un modèle ne propose pas « copier vers un client », la seule
 *    chose de cet écran qui parle d'un client ;
 * 6. supprimer demande confirmation, et le serveur perd bien le modèle ;
 * 7. l'écran porte le nom de son onglet, son bouton la couleur de
 *    l'application, et une liste vide dit à quoi sert un modèle ;
 * 8. le rail d'un modèle ne dit rien de ce qu'un client aurait fait — il
 *    écrivait « jamais faite » sous chaque séance, sur un écran sans client ;
 * 9. une carte montre ses séances et son usage, et son menu duplique et
 *    renomme (F6a).
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  clean,
  API,
  settle,
  autosaved,
} from './common.mjs';

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
  await settle(p);

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

  const meta = clean(
    await p
      .locator('[data-template-card="tpl1"] [data-template-meta]')
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok(
    '  → avec son nombre de séances',
    meta === '2 séances · jamais utilisé',
    meta
  );

  // ── 2. « Nouveau » demande un nom ────────────────────────────────────────
  // L'ambre de la marque, lu sur le bouton lui-même. Il était bleu : la
  // palette par défaut du composant, que personne n'avait choisie.
  const createColor = await p
    .getByRole('button', { name: /^Nouveau/ })
    .evaluate((button) => getComputedStyle(button).backgroundColor)
    .catch(() => '');
  ok(
    "« Nouveau » est à la couleur de l'application",
    createColor === 'rgb(207, 159, 63)',
    createColor
  );
  await p
    .getByRole('button', { name: /^Nouveau/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  const field = p
    .getByRole('dialog', { name: 'Nouveau modèle' })
    .getByRole('textbox', { name: 'Nom du modèle' });
  await field
    .fill('Hypertrophie haut du corps', { timeout: 2000 })
    .catch(() => {});
  await field.press('Enter').catch(() => {});
  await p.waitForURL(/\/s\/1$/, { timeout: 4000 }).catch(() => {});
  await settle(p);

  ok(
    "l'atelier s'ouvre sur le modèle créé",
    /\/coach\/templates\/[^/]+\/s\/1$/.test(p.url()),
    p.url()
  );

  const createdId = p.url().match(/templates\/([^/]+)\/s\//)?.[1] ?? '';
  const body = () => p.locator('body').innerText().then(clean);

  // L'état attendu, et non le calme du réseau : sous la charge du banc
  // complet, l'atelier se dessinait plus de 150 ms après la dernière
  // réponse, et la lecture tombait entre les deux.
  await p
    .getByText('Ce modèle est vide')
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  ok(
    '  → vide, et il le dit',
    (await body()).includes('Ce modèle est vide'),
    (await body()).slice(0, 80).replace(/\n/g, ' · ')
  );

  // ── 3. Ce qu'on écrit arrive dans le modèle ──────────────────────────────
  await p.getByRole('button', { name: 'Ajouter une séance' }).click();
  await settle(p);

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

  // Une séance ajoutée s'ouvre sur son nom, prêt à la frappe (E7a) ; le
  // titre ne se touche que s'il ne l'est pas — `verify_session` éprouve
  // l'ouverture elle-même.
  const sessionName = p.getByRole('textbox', { name: /^Nom de la séance 1$/ });
  if (!(await sessionName.count()))
    await p
      .getByRole('button', { name: /^Nom de la séance 1$/ })
      .click({ timeout: 2000 })
      .catch(() => {});
  await sessionName.fill('Poussée').catch(() => {});
  await sessionName.press('Enter');
  await autosaved(p);

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
  await autosaved(p);

  const renamed = await serverTemplate(createdId);
  ok(
    'le nom du modèle s’enregistre à la frappe',
    renamed?.name === 'Haut du corps',
    renamed?.name
  );

  // ── 5. Ce que l'atelier d'un modèle n'a pas ──────────────────────────────
  //
  // « Copier vers un client… » est une entrée du menu de la séance : on
  // l'ouvre, on lit ses entrées, on le referme.
  const menuEntries = async () => {
    await p
      .getByRole('button', { name: 'Menu de la séance 1' })
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
    const entries = await p
      .getByRole('menuitem')
      .allInnerTexts()
      .catch(() => []);
    await p.keyboard.press('Escape');
    await settle(p);
    return entries.map(clean);
  };
  const templateMenu = await menuEntries();
  ok(
    "le menu d'une séance de modèle ne propose pas « copier vers un client »",
    templateMenu.includes('Dupliquer') &&
      !templateMenu.some((e) => /Copier vers un client/.test(e)),
    templateMenu.join(' | ')
  );

  // La même entrée existe bien chez un client : sans ce contrôle, l'assertion
  // ci-dessus resterait verte si l'entrée disparaissait des deux écrans.
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const clientMenu = await menuEntries();
  ok(
    '  → alors que celui d’un client la propose',
    clientMenu.some((e) => /Copier vers un client/.test(e)),
    clientMenu.join(' | ')
  );
  // La même contre-épreuve pour le rail : « jamais faite » doit rester là où
  // il y a quelqu'un pour faire la séance.
  ok(
    '  → et que son rail dit bien ce qui n’a jamais été fait',
    /jamais faite/i.test(await body())
  );

  // ── 6. La suppression, et sa question ────────────────────────────────────
  await p.goto(`${BASE}/coach/templates`, { waitUntil: 'domcontentloaded' });
  await settle(p);

  // Par le menu de sa carte.
  await p
    .getByRole('button', { name: 'Menu du modèle Haut du corps' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Supprimer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);

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
  await settle(p);

  const left = await serverTemplates();
  ok(
    '  → et le serveur perd bien le modèle',
    left.length === 1 && left[0]?.name === 'Prise de masse',
    left.map((t) => t.name).join(', ')
  );

  // ── 7. Les cartes : l'aperçu, et ce que fait leur menu ───────────────────
  const card = (id) => p.locator(`[data-template-card="${id}"]`);
  const preview = (id) =>
    card(id)
      .locator('[data-preview-session]')
      .evaluateAll((rows) =>
        rows.map(
          (r) =>
            `${r.innerText.trim()} (${r.querySelectorAll('[data-composition] > *').length})`
        )
      )
      .catch(() => []);
  const seededServer = await serverTemplate('tpl1');
  const expected = [...seededServer.sessions]
    .sort((a, b) => a.order - b.order)
    .map((s) => `${s.order} · ${s.name} (${s.blocks.length})`);
  ok(
    'une carte montre ses séances : rang, nom, et un segment par bloc',
    (await preview('tpl1')).join(' | ') === expected.join(' | '),
    `${(await preview('tpl1')).join(' | ')} ≠ ${expected.join(' | ')}`
  );

  await p
    .getByRole('button', { name: 'Menu du modèle Prise de masse' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Dupliquer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .locator('[data-template-card]', { hasText: 'Prise de masse (copie)' })
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  const copies = (await serverTemplates()).filter((t) =>
    t.name.startsWith('Prise de masse')
  );
  const firstCard = clean(
    await p
      .locator('[data-template-card] h2')
      .first()
      .innerText({ timeout: 2000 })
      .catch(() => '')
  );
  ok(
    '« Dupliquer » : la copie entre en tête, avec les mêmes séances',
    copies.length === 2 &&
      firstCard === 'Prise de masse (copie)' &&
      copies.every((t) => t.sessionCount === 2),
    `${firstCard} · ${copies.map((t) => `${t.name} ${t.sessionCount}`).join(', ')}`
  );
  const copyId = copies.find((t) => t.name.endsWith('(copie)'))?._id ?? '';

  await p
    .getByRole('button', { name: 'Menu du modèle Prise de masse (copie)' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Renommer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const renameField = p
    .getByRole('dialog', { name: 'Renommer le modèle' })
    .getByRole('textbox', { name: 'Nom du modèle' });
  const prefilled = await renameField
    .inputValue({ timeout: 2000 })
    .catch(() => '');
  await renameField.fill('Prépa compétition').catch(() => {});
  await renameField.press('Enter').catch(() => {});
  await p
    .getByRole('dialog', { name: 'Renommer le modèle' })
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Renommer » part du nom actuel, et la carte prend le nouveau',
    prefilled === 'Prise de masse (copie)' &&
      (await serverTemplate(copyId))?.name === 'Prépa compétition' &&
      (await card(copyId)
        .locator('h2')
        .innerText()
        .catch(() => '')) === 'Prépa compétition',
    prefilled
  );

  // Six séances dans la copie : la carte en montre quatre, puis le reste.
  // Sans copie — « Dupliquer » cassé —, rien à allonger : l'assertion qui
  // suit tombe, et la suite continue plutôt que de s'arrêter sur une lecture
  // vide.
  const copy = copyId ? await serverTemplate(copyId) : null;
  if (copy) {
    const six = Array.from({ length: 6 }, (_, i) => ({
      ...copy.sessions[i % copy.sessions.length],
      _id: undefined,
      order: i + 1,
      name: `Séance ${i + 1}`,
    }));
    await fetch(`${API}/api/coach/templates/${copyId}/sessions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions: six }),
    });
  }
  // Et le modèle d'origine importé chez un client : son usage le compte.
  await fetch(`${API}/api/coach/clients/${CLIENT}/program/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId: 'tpl1' }),
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await settle(p);
  await card(copyId)
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  ok(
    'au-delà de quatre séances, la carte dit combien il en reste',
    (await preview(copyId)).length === 4 &&
      (
        await card(copyId)
          .innerText()
          .catch(() => '')
      ).includes('+ 2 séances'),
    (await preview(copyId)).join(' | ')
  );
  ok(
    'un modèle importé chez un client le dit sur sa carte',
    clean(
      await card('tpl1')
        .locator('[data-template-meta]')
        .innerText()
        .catch(() => '')
    ) === '2 séances · utilisé chez 1 client'
  );

  // ── 8. Une liste vide dit à quoi sert un modèle ──────────────────────────
  {
    const ctx = await browser.newContext();
    await ctx.route(/\/api\/coach\/templates(\?|$)/, (r) =>
      r.fulfill({ json: { templates: [] } })
    );
    const empty = await signIn(ctx);
    await empty.goto(`${BASE}/coach/templates`, {
      waitUntil: 'domcontentloaded',
    });
    await settle(empty);
    const text = clean(await empty.locator('body').innerText());
    ok(
      'sans modèle, la liste dit à quoi ils servent',
      text.includes('Écris-le une fois') && text.includes("Tu l'importes"),
      text.slice(0, 100).replace(/\n/g, ' · ')
    );
    ok(
      '  → avec le personnage',
      // Dans la page : le rail porte le même personnage en logo.
      (await empty.locator('main [data-mascot="hello"]').count()) === 1
    );
    ok(
      '  → et de quoi en créer un',
      (await empty
        .locator('main')
        .getByRole('button', { name: 'Créer un modèle' })
        .count()) === 1 && text.includes('Enregistrer comme modèle')
    );
    await ctx.close();
  }

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
