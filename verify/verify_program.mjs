/**
 * Le programme du client (F1) : une carte par séance, sa durée, sa
 * composition, ses jours, et une pastille d'état.
 *
 * Retour du terrain, à l'origine de la comparaison du contenu : « j'ai
 * modifié mon programme en changeant les séances plutôt qu'en les
 * supprimant et en les recréant, donc elles ont gardé le même id, et ça me
 * met une séance comme terminée alors que je ne l'ai jamais faite. » Une
 * séance est faite quand son contenu d'aujourd'hui l'a été ; réécrite, elle
 * le dit — « Modifiée depuis ta dernière fois ».
 *
 * La maquette ajoute ce que l'ancien écran n'avait pas : la durée et le
 * compte des mouvements, la barre de composition, « À faire aujourd'hui »
 * et « En cours ». L'horloge de la page est posée au samedi 5 septembre
 * 2026, quand l'état dépend du jour : la séance 1 a été faite le dimanche
 * d'avant, la séance 2 est conseillée le samedi.
 */
import {
  API,
  launch,
  BASE,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
  clean,
  reachFeeling,
  settle,
} from './common.mjs';

const browser = await launch();
const SATURDAY = new Date('2026-09-05T10:00:00+02:00');
const WIDE = { viewport: { width: 1280, height: 900 } };

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .then((t) => t.replace(/\s+/g, ' ').trim())
    .catch(() => '');

/** Le programme, à l'horloge voulue : les cartes, une fois là. */
const open = async (options = MOBILE, now) => {
  const ctx = await browser.newContext(options);
  const p = await signIn(ctx);
  if (now) await p.clock.setFixedTime(now);
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .locator('[data-program-card]')
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p };
};
const card = (p, id) => p.locator(`[data-program-card="${id}"]`);
const stateOf = async (p, id) => {
  const shown = await text(card(p, id));
  // Le titre, puis la pastille : la pastille suit le nom sur la carte.
  return shown;
};

{
  console.log('\n── chaque carte, son état');
  const { ctx, p } = await open(MOBILE, SATURDAY);
  const titles = await p
    .locator('[data-program-card]')
    .evaluateAll((cards) =>
      cards.map((c) => c.querySelector('p')?.textContent?.trim())
    );
  ok(
    'les séances dans l’ordre du coach, nommées, et leur compte en tête',
    titles.join(' | ') ===
      'Full body A | Haut du corps | Séance 3 | Séance 4 | Séance 5 | Échelle à deux' &&
      (await text(p.locator('main h1').locator('..'))) ===
        'Programme 6 séances',
    titles.join(' | ')
  );

  const states = {};
  for (const id of ['sess1', 'sess2', 'sess3', 'sess4']) {
    states[id] = await card(p, id).getAttribute('data-state');
  }
  ok(
    'une séance faite telle qu’elle est porte le jour : « Faite dimanche »',
    (await stateOf(p, 'sess1')).startsWith('Full body A Faite dimanche') &&
      states.sess1 === 'done',
    await stateOf(p, 'sess1')
  );
  ok(
    '  → conseillée ce jour-ci : « À faire aujourd’hui »',
    (await stateOf(p, 'sess2')).startsWith(
      'Haut du corps À faire aujourd’hui'
    ) && states.sess2 === 'today',
    await stateOf(p, 'sess2')
  );
  // La séance 3 a été faite une fois, puis remaniée : l'identifiant
  // correspond, le contenu non.
  ok(
    '  → remaniée depuis qu’elle a été faite : « Modifiée depuis ta dernière fois »',
    (await stateOf(p, 'sess3')).startsWith(
      'Séance 3 Modifiée depuis ta dernière fois'
    ) && !/Terminée|Faite/i.test(await stateOf(p, 'sess3')),
    await stateOf(p, 'sess3')
  );
  ok(
    '  → sans bilan : « Jamais faite »',
    (await stateOf(p, 'sess4')).startsWith('Séance 4 Jamais faite'),
    await stateOf(p, 'sess4')
  );

  const first = card(p, 'sess1');
  ok(
    'une carte dit sa durée, ses blocs et ses mouvements distincts',
    (await stateOf(p, 'sess1')).includes('≈ 30 min · 3 blocs · 7 exercices'),
    await stateOf(p, 'sess1')
  );
  // Les couleurs affichées, et non l'attribut : c'est la couleur qui dit
  // l'échauffement à part.
  const colors = await first
    .locator('[data-composition] > *')
    .evaluateAll((segments) =>
      segments.map((s) => getComputedStyle(s).backgroundColor)
    );
  ok(
    '  → sa composition, un segment par bloc, l’échauffement à part',
    colors.length === 3 && colors[0] !== colors[1] && colors[1] === colors[2],
    colors.join(' · ')
  );
  ok(
    '  → et ses jours conseillés, que le lecteur d’écran entend en entier',
    (await text(first.locator('[data-suggested-days]'))) === 'Lun Jeu' &&
      (await first
        .getByRole('group', { name: 'Conseillée le lundi et le jeudi' })
        .count()) === 1 &&
      (await card(p, 'sess6').locator('[data-suggested-days]').count()) === 0,
    await text(first.locator('[data-suggested-days]'))
  );

  const pageText = clean(await p.evaluate(() => document.body.innerText));
  ok(
    'ni « TERMINÉE », ni « À VENIR », ni proportion du programme',
    !/TERMINÉE|À VENIR|séances? sur \d+ déjà faite/i.test(pageText)
  );

  await first.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    'une carte ouvre la fiche de sa séance',
    new URL(p.url()).pathname === '/client/session/sess1',
    p.url().replace(BASE, '')
  );
  await ctx.close();
}

{
  console.log('\n── pendant le chargement');
  // La lecture du programme est retenue : l'écran doit montrer qu'il
  // charge, et non annoncer qu'il n'y a pas de programme.
  const ctx = await browser.newContext(MOBILE);
  let release;
  const held = new Promise((resolve) => (release = resolve));
  await ctx.route(/\/api\/client\/program(\?|$)/, async (route) => {
    await held;
    return route.fallback();
  });
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  const busy = p.locator('[aria-busy="true"]');
  await busy
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  const ghosts = await busy.locator('.chakra-skeleton').count();
  const saysEmpty = await p.getByText('Ton programme arrive').count();
  release();
  await settle(p);
  ok(
    'six cartes fantômes, et pas « Ton programme arrive »',
    ghosts === 6 && saysEmpty === 0,
    `${ghosts} fantôme(s) · ${saysEmpty ? '« Ton programme arrive »' : 'rien d’autre'}`
  );
  await ctx.close();
}

{
  console.log('\n── une séance laissée en cours');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // L'échelle de la séance 5 : un palier coché, et l'on s'en va.
  await start(p, 'sess5');
  await p
    .getByRole('button', { name: /^(Fait|Série faite|Palier fait)$/ })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await card(p, 'sess5')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  ok(
    'une séance commencée sur ce téléphone dit « En cours »',
    (await stateOf(p, 'sess5')).startsWith('Séance 5 En cours') &&
      (await card(p, 'sess5').getAttribute('data-state')) === 'local',
    await stateOf(p, 'sess5')
  );
  await ctx.close();
}

{
  console.log('\n── sur grand écran');
  const { ctx, p } = await open(WIDE, SATURDAY);
  const boxes = await p
    .locator('[data-program-card]')
    .evaluateAll((cards) =>
      cards.slice(0, 2).map((c) => c.getBoundingClientRect().top)
    );
  ok(
    'les cartes passent sur deux colonnes',
    boxes.length === 2 && Math.abs(boxes[0] - boxes[1]) < 2,
    boxes.join(' · ')
  );
  await ctx.close();
}

// ── Faire une séance fait apparaître son état ───────────────────────────
//
// L'aller-retour qui compte : une séance « Jamais faite » est faite, et sa
// carte le dit. Si la comparaison était trop stricte — si elle comparait la
// note du coach, par exemple — elle resterait « Jamais faite » pour
// toujours, et rien d'autre ne le révélerait.
{
  console.log('\n── terminer une séance met à jour sa propre carte');
  const { ctx, p } = await open(MOBILE);
  ok(
    'la séance 5 n’a jamais été faite',
    (await stateOf(p, 'sess5')).startsWith('Séance 5 Jamais faite'),
    await stateOf(p, 'sess5')
  );

  // La séance 5 est une échelle : un bloc, sept paliers.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await f.count())) break;
    await f.click();
    await settle(p);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await settle(p);
  await reachFeeling(p);
  await p.getByRole('radio', { name: /Juste/ }).click();
  await settle(p);
  await p.getByRole('button', { name: /^Envoyer à Julie$/ }).click();
  await settle(p);

  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await card(p, 'sess5')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  ok(
    '  → et dit maintenant qu’elle est faite',
    (await stateOf(p, 'sess5')).startsWith('Séance 5 Faite aujourd’hui'),
    await stateOf(p, 'sess5')
  );
  ok(
    '  → sans déranger les autres',
    (await stateOf(p, 'sess4')).startsWith('Séance 4 Jamais faite'),
    await stateOf(p, 'sess4')
  );
  await ctx.close();
}

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
await browser.close();
process.exit(failureCount() ? 1 : 0);
