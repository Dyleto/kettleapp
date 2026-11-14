/**
 * L'ouverture d'une séance : ce qu'elle annonce avant qu'on la commence.
 *
 * Elle comptait ses propres étapes. « 3 blocs · 12 exercices » pour une
 * séance de sept mouvements, « 15 exercices » pour une de trois : le nombre
 * venait de la liste d'écrans que le mode guidé allait dérouler, pas de ce
 * que la personne allait faire. Aucun type ne le voit — un nombre est un
 * nombre — et il faut lire l'écran à côté du programme pour s'en apercevoir.
 *
 * 1. le titre, le rang et le jour conseillé ;
 * 2. les exercices comptés comme on les compte : des mouvements distincts ;
 * 3. chaque bloc avec son repère, dans l'unité de son format ;
 * 4. le mot du coach quand il y en a un, rien quand il n'y en a pas ;
 * 5. la croix revient à la fiche sans rien commencer ;
 * 6. le décompte annonce le premier geste, par son nom.
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

const OPENING = '[role="dialog"][aria-label="Avant de commencer"]';

/** Ouvre la fiche d'une séance et son écran d'ouverture. */
const open = async (p, session) => {
  await p.goto(`${BASE}/client/session/${session}`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
};

/** Tout le texte de l'ouverture. */
const text = (p) =>
  p
    .locator(OPENING)
    .innerText({ timeout: 3000 })
    .then(clean)
    .catch(() => '');

/** Les blocs annoncés : leur nom et leur repère, ligne par ligne. */
const blocks = (p) =>
  p.evaluate(
    (selector) =>
      [
        ...document.querySelectorAll(
          `${selector} [aria-label="Les blocs de la séance"] li`
        ),
      ].map((row) =>
        row.innerText
          .replace(/[\u00A0\u202F\u2009]/g, ' ')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .join(' | ')
      ),
    OPENING
  );

/**
 * Presse un bouton s'il est là et qu'on peut l'atteindre.
 *
 * Un bouton absent ou recouvert est jugé par l'assertion qui suit. Laisser
 * le clic attendre trente secondes ferait planter la suite au lieu de la
 * faire échouer, et un plantage ne dit pas quelle promesse est rompue.
 */
const press = async (p, name) => {
  const button = p.getByRole('button', { name });
  if (!(await button.count())) return;
  await button
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
};

const browser = await launch();

{
  console.log('\n── une séance nommée, avec un mot du coach');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p, 'sess2');
  const screen = await text(p);

  const title = clean(
    await p
      .locator(`${OPENING} h1`)
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok('le titre est le nom de la séance', title === 'Haut du corps', title);
  ok(
    '  → précédé de son rang et du jour conseillé',
    /SÉANCE 2 · CONSEILLÉE LE SAMEDI/i.test(screen),
    screen.split('\n')[0]
  );
  ok(
    'trois exercices sont annoncés, pas quinze',
    /(^|\n)3 exercices(\n|$)/.test(screen),
    screen.match(/\d+ exercices?/)?.[0] ?? '(rien)'
  );
  ok(
    '  → avec le nombre de blocs et une durée approchée',
    /(^|\n)2 blocs(\n|$)/.test(screen) && /≈ \d+ min/.test(screen),
    screen.match(/≈ \d+ min/)?.[0] ?? '(rien)'
  );
  ok(
    'le mot du coach ouvre la séance',
    screen.includes('Focus qualité de mouvement')
  );

  const rows = await blocks(p);
  ok(
    'chaque bloc porte son repère, dans son unité',
    rows.join(' ; ') === 'Tabata | 8 tours · 4 min ; Renfo | 7 séries',
    rows.join(' ; ')
  );
  ok(
    "le son se règle dès l'ouverture",
    (await p
      .locator(OPENING)
      .getByRole('button', { name: 'Couper le son' })
      .count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── une séance sans mot du coach');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await open(p, 'sess1');
  const screen = await text(p);

  ok(
    'sept exercices sont annoncés, pas douze',
    /(^|\n)7 exercices(\n|$)/.test(screen),
    screen.match(/\d+ exercices?/)?.[0] ?? '(rien)'
  );
  ok(
    "aucune bulle quand le coach n'a rien écrit",
    !/Ton coach te dit/.test(screen)
  );
  const rows = await blocks(p);
  ok(
    'les trois blocs sont annoncés dans leur ordre',
    rows.length === 3 &&
      /^Échauffement \| 2 exercices/.test(rows[0]) &&
      rows[1] === 'EMOM | 10 tours · 10 min' &&
      /\| 12 min$/.test(rows[2]),
    rows.join(' ; ')
  );

  // La croix : on est venu voir, on repart sans avoir rien commencé.
  await press(p, 'Revenir à la séance');
  await p.waitForTimeout(600);
  ok(
    'la croix revient à la fiche de séance',
    (await p.locator(OPENING).count()) === 0 &&
      (await p.getByRole('button', { name: /Démarrer la séance/ }).count()) ===
        1
  );
  ok(
    '  → sans que rien ne soit commencé',
    (await p.evaluate(() => localStorage.getItem('kettle-seance-sess1'))) ===
      null
  );

  // Le décompte nomme le premier geste.
  await press(p, /Démarrer la séance/);
  await p.waitForTimeout(800);
  await press(p, /C'est parti/);
  await p.waitForTimeout(300);
  const countdown = clean(
    await p
      .getByRole('button', { name: /^Départ dans/ })
      .innerText({ timeout: 2000 })
      .catch(() => '')
  );
  ok(
    'le décompte annonce le premier geste par son nom',
    countdown.includes('Corde à sauter') &&
      countdown.includes('Exercice 1 sur 2 · 2 min'),
    countdown.replace(/\n/g, ' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
