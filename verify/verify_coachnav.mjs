/**
 * La navigation du coach : quatre onglets, « À lire » en premier avec son
 * compteur, et un rail dont la largeur suit l'écran.
 *
 * Sous 768 px, une barre d'onglets en bas ; de 768 à 1 279 px, un rail
 * d'icônes de 76 px ; au-delà, le rail complet de 232 px avec ses libellés.
 * Dans l'atelier, le rail se replie en icônes à toutes les largeurs : la
 * place revient aux séances, à l'éditeur et à l'aperçu.
 *
 * Le rail était à 200 px partout, l'espace s'ouvrait sur la liste des
 * clients, et rien ne disait qu'une séance attendait d'être lue.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  MOBILE,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const TABLET = { viewport: { width: 1024, height: 768 } };
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const INBOX = /\/api\/coach\/inbox/;
const ORDER = 'À lire · Clients · Modèles · Exercices';

/**
 * La navigation visible, mesurée : sa place, ses libellés lisibles, les
 * noms que ses liens annoncent, son compteur et l'onglet allumé.
 */
/**
 * Le rail tel qu'il se lit, une fois là.
 *
 * On attend qu'il paraisse avant de le lire : sous la charge de quatre
 * files, `settle` pouvait rendre la main entre la réponse de
 * l'authentification et le chargement de l'espace du coach — un rail pas
 * encore monté se lisait `null`, et « 99+ » tombait sans raison.
 */
const nav = async (p) => {
  await p
    .locator('nav[aria-label="Navigation principale"]')
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  return readNav(p);
};

const readNav = (p) =>
  p.evaluate(() => {
    const el = [
      ...document.querySelectorAll('nav[aria-label="Navigation principale"]'),
    ].find((n) => n.getClientRects().length > 0);
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const links = [...el.querySelectorAll('a')];
    return {
      width: Math.round(box.width),
      atBottom: box.top > window.innerHeight / 2,
      labels: links.map((a) =>
        a.innerText
          .replace(a.querySelector('[data-count]')?.textContent ?? '', '')
          .trim()
      ),
      names: links.map((a) => a.getAttribute('aria-label')),
      count: el.querySelector('[data-count]')?.textContent ?? null,
      current: links
        .filter((a) => a.getAttribute('aria-current') === 'page')
        .map((a) => a.getAttribute('aria-label')),
    };
  });

const title = (p) =>
  p
    .locator('h1')
    .first()
    .innerText({ timeout: 4000 })
    .catch(() => '');

const show = (n) => JSON.stringify(n);

const browser = await launch();

{
  console.log('\n── sur téléphone : quatre onglets en bas, « À lire » d’abord');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const n = await nav(p);
  ok(
    'une barre d’onglets en bas : À lire, Clients, Modèles, Exercices',
    n?.atBottom === true && n.labels.join(' · ') === ORDER,
    show(n)
  );
  // Le faux serveur garde une séance non lue : la dernière de Sarah.
  ok(
    '  → « À lire » porte le compte des séances à lire',
    n?.count === '1',
    show(n)
  );
  ok(
    '  → l’espace s’ouvre sur « À lire », onglet allumé',
    (await title(p)) === 'À lire' &&
      n?.current.length === 1 &&
      n.current[0].startsWith('À lire'),
    `${await title(p)} · ${show(n?.current)}`
  );
  await ctx.close();
}

{
  console.log('\n── de 768 à 1 279 px : un rail d’icônes');
  const ctx = await browser.newContext(TABLET);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const n = await nav(p);
  ok(
    'un rail de 76 px, sans libellés',
    n?.width === 76 && n.labels.every((label) => label === ''),
    show(n)
  );
  // Le libellé visible disparaît : c'est le lien qui doit porter le nom.
  ok(
    '  → chaque icône garde son nom, compteur compris',
    show(n?.names) === show(['À lire (1)', 'Clients', 'Modèles', 'Exercices']),
    show(n?.names)
  );
  ok(
    '  → sur la liste des clients, seul « Clients » est allumé',
    show(n?.current) === show(['Clients']),
    show(n?.current)
  );
  await ctx.close();
}

{
  console.log(
    '\n── à partir de 1 280 px : le rail complet, replié dans l’atelier'
  );
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const n = await nav(p);
  ok(
    'un rail de 232 px, avec ses libellés',
    n?.width === 232 && n.labels.join(' · ') === ORDER,
    show(n)
  );
  ok('  → le compteur sur « À lire »', n?.count === '1', show(n));

  await p.goto(`${BASE}/coach/clients/${CLIENT}`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const w = await nav(p);
  ok(
    'dans l’atelier, le rail se replie en icônes, « Clients » allumé',
    w?.width === 76 &&
      w.labels.every((label) => label === '') &&
      show(w.current) === show(['Clients']),
    show(w)
  );
  await ctx.close();
}

{
  console.log('\n── le compteur : « 99+ » au-delà, rien à zéro');
  const many = await browser.newContext(DESKTOP);
  await many.route(INBOX, (r) =>
    r.fulfill({ json: { total: 240, items: [] } })
  );
  const p = await signIn(many);
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const n = await nav(p);
  ok('au-delà de 99 : « 99+ »', n?.count === '99+', show(n));
  await many.close();

  const none = await browser.newContext(DESKTOP);
  await none.route(INBOX, (r) => r.fulfill({ json: { total: 0, items: [] } }));
  const q = await signIn(none);
  await q.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(q);
  const z = await nav(q);
  const body = await q
    .locator('main')
    .innerText()
    .catch(() => '');
  ok(
    'rien à lire : pas de pastille, et « Tout est lu »',
    z !== null && z.count === null && /Tout est lu/.test(body),
    `${show(z)} · ${body.slice(0, 80)}`
  );
  await none.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
