/**
 * Déplacer sans glisser, et le dire en français (G7).
 *
 * Les trois glisser de l'atelier — le rail, la bande, les blocs — parlaient
 * anglais aux lecteurs d'écran, et leur consigne promettait Espace et les
 * flèches à un clavier qu'aucun capteur n'écoutait. La voie du clavier est
 * le menu : « Monter », « Descendre », pour une séance comme pour un bloc.
 *
 * Ce qu'entend un lecteur d'écran se lit dans la page : la consigne est le
 * texte que désigne `aria-describedby`, les annonces celui de la région
 * vivante que la bibliothèque pose dans le document.
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
  autosaved,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };
const SESSION_LINE =
  'Pour déplacer cette séance sans la glisser : « Monter » ou « Descendre », dans son menu.';
const BLOCK_LINE =
  'Pour déplacer ce bloc sans le glisser : « Monter » ou « Descendre », dans son menu.';

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions;
};
// Par identifiant : une séance sans nom s'appelle « Séance 3 » d'après son
// rang, et change donc de nom en changeant de place.
const sessionIds = async () => (await serverSessions()).map((s) => s._id);
/** Le nom de la séance ouverte au rang `rank`, lu sur son en-tête. */
const openName = (p, rank) =>
  p
    .getByRole('button', { name: `Nom de la séance ${rank}` })
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const blockTypes = async (rank) =>
  (await serverSessions())[rank - 1]?.blocks.map((b) => b.type) ?? [];

/** Ce qu'un lecteur d'écran entend d'un élément : son rôle décrit, son état,
 * et le texte que désigne `aria-describedby`. */
const spoken = (locator) =>
  locator
    .evaluate((el) => ({
      roleDescription: el.getAttribute('aria-roledescription'),
      disabled: el.getAttribute('aria-disabled'),
      tabIndex: el.tabIndex,
      hidden: el.closest('[aria-hidden="true"]') !== null,
      description: (el.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ')
        .trim(),
    }))
    .catch(() => null);
/** Ce que la région vivante de la bibliothèque vient de dire. */
const announced = (p) =>
  p
    .locator('[id^="DndLiveRegion"]')
    .allTextContents()
    .then((all) => clean(all.join(' ').trim()))
    .catch(() => '');

/** Glisser à la souris le centre de `from` jusqu'au centre de `to`. */
const mouseDrag = async (p, from, to) => {
  const a = await from.boundingBox().catch(() => null);
  const b = await to.boundingBox().catch(() => null);
  if (!a || !b) return false;
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++)
    await p.mouse.move(
      a.x + a.width / 2 + ((b.x - a.x) * i) / steps,
      a.y +
        a.height / 2 +
        ((b.y + b.height * 0.7 - a.y - a.height / 2) * i) / steps
    );
  await p.mouse.up();
  return true;
};
/** Ouvre un menu par son bouton et touche une entrée ; le menu parti. */
const pick = async (p, trigger, entry) => {
  await trigger.click({ timeout: 2000 }).catch(() => {});
  const item = p.getByRole('menuitem', { name: entry, exact: true });
  const offered = (await item.count()) > 0;
  if (offered) {
    await item.click({ timeout: 2000 }).catch(() => {});
    await gone(p.getByRole('menu'));
  } else await p.keyboard.press('Escape');
  await settle(p);
  return offered;
};
const menuEntries = async (p, trigger) => {
  await trigger.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  const entries = await p
    .getByRole('menuitem')
    .allInnerTexts()
    .then((all) => all.map(clean))
    .catch(() => []);
  await p.keyboard.press('Escape');
  await gone(p.getByRole('menu'));
  return entries;
};

const browser = await launch();

{
  console.log('\n── les séances, sur grand écran');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const rows = p.locator('[data-session-row]');
  const first = await spoken(rows.first());
  ok(
    'une séance du rail se dit bouton, et sa consigne renvoie au menu, en français',
    first?.roleDescription === null &&
      first?.disabled === null &&
      first?.description === SESSION_LINE,
    JSON.stringify(first)
  );

  const header = p.getByRole('button', { name: 'Menu de la séance 1' });
  const offered = await menuEntries(p, header);
  ok(
    'la première séance propose « Descendre », pas « Monter »',
    offered.includes('Descendre') && !offered.includes('Monter'),
    offered.join(' · ')
  );

  const before = await sessionIds();
  const name = await openName(p, 1);
  await pick(p, header, 'Descendre');
  await autosaved(p);
  const after = await sessionIds();
  ok(
    '« Descendre » la déplace d’un cran, et elle reste ouverte à son nouveau rang',
    after[0] === before[1] &&
      after[1] === before[0] &&
      p.url().endsWith('/s/2') &&
      name !== '' &&
      (await openName(p, 2)) === name,
    `${name} · ${new URL(p.url()).pathname} · « ${await openName(p, 2)} »`
  );

  // Le clic droit sur une autre séance du rail : la séance lue reste celle
  // qu'on lisait.
  await rows
    .nth(2)
    .click({ button: 'right', timeout: 2000 })
    .catch(() => {});
  const up = p.getByRole('menuitem', { name: 'Monter', exact: true });
  const fromRail = (await up.count()) > 0;
  if (fromRail) {
    await up.click({ timeout: 2000 }).catch(() => {});
    await gone(p.getByRole('menu'));
  } else await p.keyboard.press('Escape');
  await autosaved(p);
  const again = await sessionIds();
  ok(
    '  → au clic droit sur une autre séance, « Monter » l’échange avec celle qu’on lit, qui reste ouverte',
    fromRail &&
      again[1] === after[2] &&
      again[2] === after[1] &&
      p.url().endsWith('/s/3') &&
      (await openName(p, 3)) === name,
    `${new URL(p.url()).pathname} · « ${await openName(p, 3)} »`
  );

  // Glissée à la souris : ce que dit la région vivante.
  const moved = await mouseDrag(p, rows.nth(3), rows.nth(4));
  await settle(p);
  const said = await announced(p);
  ok(
    'glissée à la souris, la séance s’annonce en français à sa nouvelle place',
    moved && /^Séance 4( — .+)? : désormais en position 5 sur 6\.$/.test(said),
    said || '(rien)'
  );
  await autosaved(p);
  await ctx.close();
}

{
  console.log('\n── les blocs, sur grand écran');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const handles = p.getByRole('button', { name: /^Réorganiser le bloc / });
  const handle = await spoken(handles.first());
  ok(
    'la poignée d’un bloc sort de la tabulation, et dit que le menu déplace',
    handle?.tabIndex === -1 &&
      handle?.roleDescription === null &&
      !handle?.hidden &&
      handle?.description === BLOCK_LINE,
    JSON.stringify(handle)
  );

  const menus = p.getByRole('button', { name: /^Menu du bloc / });
  const count = await menus.count();
  const firstOffers = await menuEntries(p, menus.first());
  const lastOffers = await menuEntries(p, menus.nth(count - 1));
  ok(
    'le premier bloc ne monte pas, le dernier ne descend pas',
    count >= 3 &&
      firstOffers.includes('Descendre') &&
      !firstOffers.includes('Monter') &&
      lastOffers.includes('Monter') &&
      !lastOffers.includes('Descendre'),
    `${firstOffers.join(' · ')} | ${lastOffers.join(' · ')}`
  );

  const before = await blockTypes(1);
  await pick(p, menus.nth(1), 'Monter');
  await autosaved(p);
  const after = await blockTypes(1);
  ok(
    '« Monter » dans le menu d’un bloc l’échange avec celui d’au-dessus',
    after[0] === before[1] && after[1] === before[0] && after[2] === before[2],
    `${before.join(', ')} → ${after.join(', ')}`
  );

  const moved = await mouseDrag(p, handles.nth(0), handles.nth(1));
  await settle(p);
  const said = await announced(p);
  ok(
    'glissé à la souris, le bloc s’annonce en français à sa nouvelle place',
    moved && /^Bloc 1 — .+ : désormais en position 2 sur 3\.$/.test(said),
    said || '(rien)'
  );
  await autosaved(p);
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const card = await spoken(p.locator('[data-session-band] > button').first());
  ok(
    'une carte de la bande se dit bouton, avec la même consigne',
    card?.roleDescription === null && card?.description === SESSION_LINE,
    JSON.stringify(card)
  );

  // L'en-tête d'un bloc ouvre sa feuille de réglages.
  const before = await blockTypes(1);
  await p
    .getByRole('button', { name: /^Régler le bloc / })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const down = p.getByRole('button', { name: /^Descendre le bloc / });
  const offered = (await down.count()) === 1;
  const noUp =
    (await p.getByRole('button', { name: /^Monter le bloc / }).count()) === 0;
  await down.click({ timeout: 2000 }).catch(() => {});
  await autosaved(p);
  const after = await blockTypes(1);
  ok(
    'la feuille d’un bloc propose « Descendre » au premier, et le déplace',
    offered && noUp && after[0] === before[1] && after[1] === before[0],
    `${offered ? 'proposé' : 'absent'} · ${before.join(', ')} → ${after.join(', ')}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
