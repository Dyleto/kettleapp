/**
 * « À lire » : réagir, répondre, lire en glissant, ouvrir, ajuster.
 *
 * Le fil (E2) se lit ; ici, il s'agit. Une réaction part d'une touche et la
 * séance est lue du même coup ; « Répondre » ouvre un champ et quatre
 * réponses toutes faites ; glisser une carte la lit sans répondre, avec
 * « Annuler » ; toucher une carte l'ouvre — en feuille sur téléphone, dans
 * le panneau de droite sur grand écran — et la lit ; « Ajuster » mène à
 * l'atelier.
 *
 * Le faux serveur garde une séance non lue de Sarah (cs6). Chaque partie la
 * remet à lire avant de commencer : les gestes de la précédente l'ont lue.
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
const DESKTOP = { viewport: { width: 1440, height: 900 } };

/** Remet la séance de Sarah à lire, directement chez le faux serveur. */
const unread = () =>
  fetch(`${API}/api/coach/sessions/completed/viewed`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: [SESSION], viewed: false }),
  });

/** Les écritures que la page envoie, dans l'ordre. */
const watch = (ctx) => {
  const sent = [];
  ctx.on('request', (r) => {
    if (r.method() !== 'PATCH') return;
    const path = new URL(r.url()).pathname;
    if (path.endsWith('/reply'))
      sent.push({ kind: 'reply', body: r.postDataJSON() });
    if (path.endsWith('/completed/viewed'))
      sent.push({ kind: 'viewed', body: r.postDataJSON() });
  });
  return sent;
};

const cards = (p) => p.locator('[data-inbox-card]').count();
const pressed = (p, name) =>
  p
    .getByRole('button', { name })
    .first()
    .getAttribute('aria-pressed', { timeout: 2000 })
    .catch(() => null);
const press = async (p, name) => {
  await p
    .getByRole('button', { name })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const body = (p) =>
  p
    .locator('body')
    .innerText()
    .then(clean)
    .catch(() => '');
const show = (x) => JSON.stringify(x);

/** Glisse la carte de Sarah vers la gauche, de `distance` pixels. */
const swipe = async (p, distance) => {
  const box = await p.locator('[data-inbox-card]').first().boundingBox();
  if (!box) return;
  const y = box.y + 30;
  await p.mouse.move(box.x + box.width - 30, y);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width - 30 - distance, y, { steps: 10 });
  await p.mouse.up();
  await settle(p);
};

const browser = await launch();

{
  console.log('\n── une réaction, d’une touche');
  await unread();
  const ctx = await browser.newContext(MOBILE);
  const sent = watch(ctx);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await press(p, 'Réagir : costaud');
  ok(
    'la réaction part, et s’allume',
    show(sent.at(-1)) ===
      show({ kind: 'reply', body: { reaction: 'strong' } }) &&
      (await pressed(p, 'Réagir : costaud')) === 'true',
    show(sent)
  );
  ok(
    '  → la carte reste à sa place pendant qu’on la lit',
    (await cards(p)) === 1
  );

  await press(p, 'Réagir : costaud');
  ok(
    'toucher de nouveau la retire',
    show(sent.at(-1)) === show({ kind: 'reply', body: { reaction: null } }) &&
      (await pressed(p, 'Réagir : costaud')) === 'false',
    show(sent.at(-1))
  );

  await press(p, 'Réagir : en feu');
  await p.reload({ waitUntil: 'domcontentloaded' });
  await settle(p);
  const after = await body(p);
  ok(
    'au prochain chargement, la séance réagie a quitté le fil',
    /Tout est lu/.test(after) && (await cards(p)) === 0,
    after.slice(0, 120)
  );
  await ctx.close();
}

{
  console.log('\n── « Répondre »');
  await unread();
  const ctx = await browser.newContext(MOBILE);
  const sent = watch(ctx);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await press(p, 'Répondre');
  const sheet = p.getByRole('dialog', { name: 'Répondre à Sarah Martin' });
  await press(p, 'Bien joué');
  const field = await sheet
    .getByRole('textbox')
    .inputValue({ timeout: 2000 })
    .catch(() => null);
  ok(
    'la feuille s’ouvre, et une réponse toute faite remplit le champ',
    (await sheet.count()) === 1 && field === 'Bien joué',
    show(field)
  );

  await press(p, 'Envoyer à Sarah');
  ok(
    '  → « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
    // La réaction posée plus haut n'est pas lue : le brouillon la reprend
    // au lieu de l'effacer sans le dire.
    show(sent.at(-1)?.body) === show({ text: 'Bien joué', reaction: 'fire' }) &&
      (await sheet.count()) === 0,
    show(sent)
  );

  await press(p, /Ouvrir la séance de Sarah/);
  const opened = clean(
    await p
      .getByRole('dialog', { name: 'La séance ouverte' })
      .innerText()
      .catch(() => '')
  );
  ok(
    '  → la réponse se relit dans la séance ouverte, « pas encore lue »',
    // La bulle envoyée, émoji compris : « Bien joué » seul se lit aussi
    // dans les réponses toutes faites du champ.
    /🔥 Bien joué/.test(opened) && /pas encore lue/.test(opened),
    opened.replace(/\n+/g, ' | ').slice(0, 200)
  );
  await ctx.close();
}

{
  console.log('\n── glisser pour lire, « Annuler » pour revenir');
  await unread();
  const ctx = await browser.newContext(MOBILE);
  const sent = watch(ctx);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await swipe(p, 40);
  ok(
    'un glissement trop court ne lit rien',
    (await cards(p)) === 1 && sent.length === 0,
    show(sent)
  );

  await swipe(p, 160);
  const badge = await p
    .locator('nav [data-count]')
    .count()
    .catch(() => -1);
  ok(
    'glisser une carte la lit sans répondre, et la retire du fil',
    (await cards(p)) === 0 &&
      show(sent.at(-1)) ===
        show({ kind: 'viewed', body: { ids: [SESSION], viewed: true } }) &&
      badge === 0 &&
      /Séance lue/.test(await body(p)),
    `${await cards(p)} carte(s) · ${show(sent)} · ${badge} pastille(s)`
  );

  await press(p, 'Annuler');
  ok(
    '  → « Annuler » la remet, et le dit au serveur',
    (await cards(p)) === 1 &&
      show(sent.at(-1)) ===
        show({ kind: 'viewed', body: { ids: [SESSION], viewed: false } }),
    show(sent.at(-1))
  );
  await ctx.close();
}

{
  console.log('\n── toucher une carte l’ouvre, et la lit');
  await unread();
  const ctx = await browser.newContext(MOBILE);
  const sent = watch(ctx);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await press(p, /Ouvrir la séance de Sarah/);
  const sheet = clean(
    await p
      .getByRole('dialog', { name: 'La séance ouverte' })
      .innerText()
      .catch(() => '')
  );
  ok(
    'sur téléphone, en feuille : son mot, ce qui a été fait',
    // Les intertitres s'écrivent en capitales : `innerText` les rend ainsi.
    /son mot/i.test(sheet) &&
      /Dur sur la fin/.test(sheet) &&
      /ce qui a été fait/i.test(sheet) &&
      /Goblet Squat/.test(sheet),
    sheet.replace(/\n+/g, ' | ').slice(0, 160)
  );
  ok(
    '  → la séance est lue, mais la carte reste jusqu’au prochain chargement',
    show(sent.at(-1)) ===
      show({ kind: 'viewed', body: { ids: [SESSION], viewed: true } }) &&
      (await cards(p)) === 1,
    show(sent)
  );
  await ctx.close();

  await unread();
  const wide = await browser.newContext(DESKTOP);
  const q = await signIn(wide);
  await q.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(q);
  await press(q, /Ouvrir la séance de Sarah/);
  const panel = clean(
    await q
      .getByRole('complementary', { name: 'La séance ouverte' })
      .innerText()
      .catch(() => '')
  );
  ok(
    'à partir de 1 280 px, elle s’ouvre dans le panneau de droite',
    /ce qui a été fait/i.test(panel) &&
      (await q.getByRole('dialog').count()) === 0,
    panel.slice(0, 120)
  );
  await wide.close();
}

{
  console.log('\n── « Ajuster »');
  await unread();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await press(p, 'Ajuster');
  ok(
    '« Ajuster » ouvre l’atelier du client sur cette séance',
    new URL(p.url()).pathname === `/coach/clients/${CLIENT}/s/1`,
    p.url()
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
