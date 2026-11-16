/**
 * La fiche d'une séance : ce qu'on lit avant de partir.
 *
 * Elle montrait le rendu de l'atelier du coach, doses en fin de ligne, et
 * deux gros boutons côte à côte — « Démarrer la séance » et « J'ai terminé
 * cette séance » — présentés comme deux chemins égaux. La dose passe devant
 * le nom, les réglages d'un bloc deviennent des pastilles, la consigne d'un
 * mouvement s'ouvre en feuille, et déclarer une séance faite ailleurs
 * devient un lien discret qui commence par demander quand.
 *
 * Le décor : la séance 2, « Haut du corps », un Tabata de pompes puis un
 * bloc classique « Renfo » (Goblet Squat 4 × 10, fentes 3 × 12).
 */
import {
  BASE,
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  clean,
  START,
  start,
  skipRest,
  passBlock,
  leaveSession,
} from './common.mjs';

const DESKTOP = { viewport: { width: 1280, height: 800 } };
const browser = await launch();
const settle = (p, ms = 600) => p.waitForTimeout(ms);
const open = async (p, sess = 'sess2') => {
  await p.goto(`${BASE}/client/session/${sess}`, {
    waitUntil: 'domcontentloaded',
  });
  await p
    .locator('[data-exercise-line]')
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => {});
};

/** Ce que la fiche affiche : l'en-tête, puis chaque bloc et ses lignes. */
const sheet = (p) =>
  p.evaluate(() => {
    const main = document.querySelector('main');
    const text = (el) => (el?.innerText ?? '').replace(/\u00a0/g, ' ');
    return {
      title: text(main?.querySelector('h1')),
      head: text(main).split('TABATA')[0],
      blocks: [...document.querySelectorAll('main section[aria-label]')].map(
        (s) => ({
          name: s.getAttribute('aria-label'),
          head: text(s.querySelector('h2')?.parentElement),
          bars: [...s.querySelectorAll('[data-bar]')].map((b) => ({
            kind: b.dataset.bar,
            h: Math.round(b.getBoundingClientRect().height),
          })),
          lines: [...s.querySelectorAll('[data-exercise-line]')].map((l) => {
            const dose = l.querySelector('[data-dose]');
            const name = l.querySelector('p:not([data-dose])');
            return {
              text: text(l).replace(/\n+/g, ' | '),
              dose: text(dose),
              doseFirst:
                !!dose &&
                !!name &&
                dose.getBoundingClientRect().left <
                  name.getBoundingClientRect().left,
              info: !!l.querySelector('[data-info]'),
            };
          }),
        })
      ),
    };
  });

{
  console.log('\n── la fiche se lit : un en-tête, des blocs, la dose devant');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p);
  const s = await sheet(p);
  ok('le titre est le nom de la séance', s.title === 'Haut du corps', s.title);
  ok(
    'trois repères : la durée, le jour conseillé, blocs et exercices',
    /≈ \d+ min/.test(s.head) &&
      /Conseillée le samedi/.test(s.head) &&
      /2 blocs · 3 exercices/.test(s.head),
    clean(s.head).split('\n').filter(Boolean).slice(1, 5).join(' | ')
  );
  ok('le mot du coach, en bulle', /Focus qualité de mouvement/.test(s.head));

  const [tabata, classic] = s.blocks;
  ok(
    'le Tabata : son format, puis ses réglages en pastilles',
    tabata?.name === 'Tabata' &&
      /8 tours/.test(tabata.head) &&
      /20 s \/ 10 s/.test(tabata.head),
    clean(tabata?.head ?? '').replace(/\n+/g, ' | ')
  );
  ok(
    '  → son dessin alterne huit efforts et huit repos, plus bas',
    tabata?.bars.filter((b) => b.kind === 'work').length === 8 &&
      tabata.bars.filter((b) => b.kind === 'rest').length === 8 &&
      tabata.bars.find((b) => b.kind === 'rest').h <
        tabata.bars.find((b) => b.kind === 'work').h,
    `${tabata?.bars.length} traits`
  );
  ok(
    'le bloc classique porte son nom libre',
    classic?.name === 'Classique — Renfo',
    classic?.name
  );
  const goblet = classic?.lines[0];
  ok(
    'une ligne : la dose devant le nom',
    goblet?.dose === '4 × 10' && goblet.doseFirst,
    goblet?.text
  );
  ok(
    '  → dessous, le repos et la plus lourde série de la dernière fois',
    /repos 1 min · la dernière fois 26 kg/.test(goblet?.text ?? ''),
    goblet?.text
  );
  ok(
    'un Tabata sans répétitions se dose au temps de travail',
    tabata?.lines[0]?.dose === '20 s',
    tabata?.lines[0]?.text
  );
  ok(
    'l’icône d’information seulement là où il y a quelque chose à lire',
    goblet?.info === true && tabata?.lines[0]?.info === false,
    `Goblet ${goblet?.info} · Pompes ${tabata?.lines[0]?.info}`
  );

  // Le pied reste sous le pouce. Jugé sur la séance 1, dont la fiche est
  // plus haute que l'écran : sur une fiche courte, un pied simplement posé
  // à la fin de la page tiendrait dans l'écran lui aussi, et l'assertion ne
  // verrait pas qu'il n'est plus collé — c'est le sabotage qui l'a montré.
  await open(p, 'sess1');
  const pageHeight = await p.evaluate(() => document.body.scrollHeight);
  const foot = await p.getByRole('button', { name: START }).boundingBox();
  const viewport = p.viewportSize();
  ok(
    '« Démarrer » reste dans l’écran quand la fiche défile',
    pageHeight > viewport.height &&
      !!foot &&
      foot.y > viewport.height / 2 &&
      foot.y + foot.height <= viewport.height,
    foot
      ? `${Math.round(foot.y)} → ${Math.round(foot.y + foot.height)}`
      : '(absent)'
  );
  await ctx.close();
}

{
  console.log('\n── une échelle : le dessin suit ses paliers');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p, 'sess6');
  const ladder = (await sheet(p)).blocks.find((b) => /^Échelle/.test(b.name));
  const heights = (ladder?.bars ?? []).map((b) => b.h);
  ok(
    'trois paliers, trois traits qui montent',
    heights.length === 3 && heights[0] < heights[1] && heights[1] < heights[2],
    heights.join(' · ')
  );
  ok(
    '  → et les paliers en pastille',
    /5-10-15/.test(ladder?.head ?? ''),
    clean(ladder?.head ?? '').replace(/\n+/g, ' | ')
  );
  await ctx.close();
}

{
  console.log('\n── la consigne d’un mouvement, en feuille');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p);
  await p
    .getByRole('button', { name: /^Goblet Squat/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const goblet = clean(
    await p
      .getByRole('dialog', { name: 'Goblet Squat' })
      .innerText()
      .catch(() => '')
  );
  ok(
    'la description de la bibliothèque',
    /Kettlebell contre la poitrine/.test(goblet),
    goblet.split('\n')[1] ?? '(feuille absente)'
  );
  ok(
    '  → la dernière fois, et le record',
    /La dernière fois : 12 reps · 26 kg/.test(goblet) &&
      /Record : 26 kg/.test(goblet),
    goblet.split('\n').slice(-2).join(' | ')
  );
  // Toucher le fond referme : la séance est restée dessous.
  await p.mouse.click(195, 60);
  await settle(p);
  ok('toucher le fond la referme', (await p.getByRole('dialog').count()) === 0);

  await p
    .getByRole('button', { name: /^Pompes/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    'un mouvement sans rien à lire s’ouvre quand même, et le dit',
    /Pas de consigne pour ce mouvement/.test(
      await p
        .getByRole('dialog', { name: 'Pompes' })
        .innerText()
        .catch(() => '')
    )
  );
  await ctx.close();
}

{
  console.log('\n── « Démarrer », puis « Reprendre »');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p);
  ok(
    'une séance neuve dit « Démarrer »',
    (await p.getByRole('button', { name: 'Démarrer', exact: true }).count()) ===
      1
  );
  await start(p, 'sess2');
  await passBlock(p);
  await p
    .getByRole('button', { name: /^(Fait|Série faite)$/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p, 300);
  await skipRest(p);
  await leaveSession(p);
  await settle(p);
  ok(
    'commencée sur ce téléphone, elle dit « Reprendre »',
    (await p
      .getByRole('button', { name: 'Reprendre', exact: true })
      .count()) === 1 &&
      (await p
        .getByRole('button', { name: 'Démarrer', exact: true })
        .count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── « Je l’ai déjà faite » : quand, les charges, le ressenti');
  const ctx = await browser.newContext(MOBILE);
  let sent = null;
  ctx.on('request', (r) => {
    if (/\/sessions\/[^/]+\/complete$/.test(r.url())) sent = r.postDataJSON();
  });
  const p = await signIn(ctx);
  // Un jeudi : l'avant-veille est un mardi de la même semaine.
  await p.clock.install({ time: new Date(2026, 10, 12, 10) });
  await open(p);
  await p.getByRole('button', { name: /^Je l.ai déjà faite$/ }).click();
  await settle(p);
  const declare = p.getByRole('dialog', { name: /sans l.application/ });
  const field = declare.getByRole('textbox', { name: 'Date de la séance' });
  ok(
    'la feuille dit à quoi elle sert, et propose aujourd’hui',
    /Pas besoin de la rejouer/.test(
      await declare.innerText().catch(() => '')
    ) && (await field.inputValue().catch(() => '')) === '12/11/2026',
    await field.inputValue().catch(() => '(champ absent)')
  );
  await declare.getByRole('button', { name: 'Annuler' }).click();
  await settle(p);
  ok(
    '« Annuler » referme sans rien ouvrir',
    (await p.getByRole('dialog').count()) === 0
  );

  // Sans attendre si la feuille est restée ouverte : c'est l'assertion du
  // dessus qui le dit, la suite doit pouvoir continuer.
  await p
    .getByRole('button', { name: /^Je l.ai déjà faite$/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await field.fill('10/11/2026');
  await field.press('Enter');
  await settle(p, 400);
  await declare.getByRole('button', { name: 'Continuer', exact: true }).click();
  await settle(p, 800);
  ok(
    '« Continuer » mène à « Mes charges »',
    (await p.getByRole('dialog', { name: 'Mes charges' }).count()) === 1
  );
  await p
    .getByRole('button', { name: 'Continuer', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p, 800);
  const feelingDate = p.getByRole('textbox', {
    name: 'Date de réalisation de la séance',
  });
  ok(
    'le ressenti garde la date choisie, déjà dépliée',
    (await feelingDate.inputValue().catch(() => '')) === '10/11/2026',
    await feelingDate.inputValue().catch(() => '(ligne de date repliée)')
  );
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.getByRole('button', { name: 'Envoyer à ton coach' }).click();
  await settle(p, 2500);
  ok(
    '  → et c’est elle qui part avec le bilan',
    sent?.completedAt === '2026-11-10',
    JSON.stringify(sent?.completedAt ?? null)
  );
  await ctx.close();
}

{
  console.log('\n── le retour ramène d’où l’on vient');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p);
  await p
    .getByRole('button', { name: 'Revenir à Programme' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    'ouverte par son adresse : « Programme »',
    new URL(p.url()).pathname === '/client/program',
    new URL(p.url()).pathname
  );

  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .getByRole('region', { name: 'Ta semaine' })
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  // Selon le jour où le banc tourne, la fiche s'ouvre par « Voir le détail
  // de la séance » ou par « La faire aujourd'hui » ; une semaine pleine
  // n'offre ni l'un ni l'autre, et un jour conseillé de la bande y mène.
  const link = p.getByRole('button', {
    name: /^(Voir le détail de la séance|La faire aujourd.hui)$/,
  });
  if (await link.count()) await link.first().click();
  else
    await p
      .getByRole('button', { name: /— conseillée :/ })
      .first()
      .click();
  await settle(p, 900);
  ok(
    'ouverte depuis l’accueil : « Aujourd’hui »',
    (await p.getByRole('button', { name: "Revenir à Aujourd'hui" }).count()) ===
      1,
    new URL(p.url()).pathname
  );
  await p
    .getByRole('button', { name: "Revenir à Aujourd'hui" })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → et le lien y ramène',
    new URL(p.url()).pathname === '/client',
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── sur grand écran : les blocs à gauche, le résumé à droite');
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await open(p, 'sess1');
  const box = async (locator) => locator.boundingBox().catch(() => null);
  const title = await box(p.locator('main h1'));
  const firstBlock = await box(p.locator('main section[aria-label]').first());
  const starts = p.getByRole('button', { name: START });
  const startBox = await box(starts.first());
  ok(
    'le résumé est à droite des blocs',
    !!title && !!firstBlock && title.x > firstBlock.x + firstBlock.width - 1,
    `titre à ${Math.round(title?.x ?? -1)}, blocs jusqu’à ${Math.round((firstBlock?.x ?? 0) + (firstBlock?.width ?? 0))}`
  );
  ok(
    '« Démarrer » est dans le résumé, une seule fois',
    (await starts.count()) === 1 &&
      !!startBox &&
      !!title &&
      Math.abs(startBox.x - title.x) < 40,
    `${await starts.count()} bouton(s)`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
