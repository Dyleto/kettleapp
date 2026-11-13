/**
 * L'échelle de ressenti : cinq visages, un seul sens.
 *
 * Elle se lisait à l'envers de ce qu'elle enregistrait. Le client voyait
 * cinq cases numérotées de 1 à 5 où « 1 » voulait dire « Trop dure » ; la
 * valeur envoyée pour ce cran était 5 ; et le coach lisait la même réponse
 * sur une échelle allant de « Trop facile » à « Trop dure ». Trois
 * conventions pour une seule touche.
 *
 * Le sens d'une échelle ne se lit pas dans le code : chaque morceau y est
 * cohérent avec lui-même. Il faut toucher le visage de droite et regarder ce
 * qui part vers le serveur.
 *
 * 1. cinq visages, du plus facile au plus dur, de gauche à droite ;
 * 2. plus aucun numéro ;
 * 3. rien n'est choisi d'avance, et l'envoi attend un choix ;
 * 4. le visage touché se nomme, et les flèches vont vers le plus dur ;
 * 5. le visage de droite envoie 5 — la valeur que portent les bilans déjà
 *    enregistrés pour « Trop dure » — et c'est ce mot que l'accueil relit.
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

const ORDER = ['Trop facile', 'Facile', 'Juste', 'Dure', 'Trop dure'];
const SCALE = '[role="radiogroup"][aria-label="Difficulté de la séance"]';

/** Les crans tels qu'ils sont posés : leur nom, leur position, leur état. */
const steps = (p) =>
  p.evaluate(
    (selector) =>
      [...document.querySelectorAll(`${selector} [role="radio"]`)].map(
        (radio) => ({
          name: (radio.getAttribute('aria-label') ?? '').split(' — ')[0],
          x: Math.round(radio.getBoundingClientRect().x),
          checked: radio.getAttribute('aria-checked') === 'true',
        })
      ),
    SCALE
  );

/** Ce qui est écrit dans l'échelle et sous elle : le nom du cran choisi, sa
 * description, ou la ligne qui dit dans quel sens elle se lit. */
const caption = (p) =>
  p
    .evaluate(
      (selector) =>
        document.querySelector(selector)?.parentElement?.innerText ?? '',
      SCALE
    )
    .then(clean);

const press = async (p, name) => {
  const button = p.getByRole('button', { name });
  if (await button.count()) await button.first().click();
};

const browser = await launch();

{
  console.log('\n── cinq visages, du plus facile au plus dur');
  const ctx = await browser.newContext(MOBILE);

  // Ce que le formulaire envoie, relevé à la source : c'est la seule preuve
  // du sens de l'échelle.
  let sent;
  ctx.on('request', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      sent = r.postDataJSON();
  });

  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/session/sess2`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await press(p, /J'ai terminé cette séance/);
  await p.waitForTimeout(900);
  await press(p, /Passer au ressenti/);
  await p.waitForTimeout(900);

  const initial = await steps(p);
  ok(
    'les crans vont de « Trop facile » à « Trop dure »',
    initial.map((s) => s.name).join(' · ') === ORDER.join(' · '),
    initial.map((s) => s.name).join(' · ')
  );
  ok(
    '  → de gauche à droite',
    initial.length === 5 &&
      initial.every((s, i) => i === 0 || s.x > initial[i - 1].x),
    initial.map((s) => s.x).join(' < ')
  );

  const empty = await caption(p);
  ok(
    'aucun numéro ne les accompagne',
    initial.length === 5 && !/\d/.test(empty),
    empty
  );
  ok(
    "rien n'est choisi d'avance",
    initial.length === 5 && initial.every((s) => !s.checked)
  );
  ok(
    '  → une ligne dit dans quel sens lire',
    empty.includes('Du plus facile au plus dur')
  );
  ok(
    "  → et l'envoi attend un choix",
    await p
      .getByRole('button', { name: /^Valider$/ })
      .isDisabled()
      .catch(() => false)
  );

  // Le cran de gauche, puis une flèche vers la droite : on doit aller vers
  // plus dur, pas vers plus facile.
  await p.locator(`${SCALE} [role="radio"]`).first().click();
  await p.waitForTimeout(250);
  ok(
    'le visage de gauche se nomme « Trop facile »',
    (await caption(p)).includes('Trop facile'),
    await caption(p)
  );
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(250);
  const afterArrow = (await steps(p)).find((s) => s.checked)?.name ?? '';
  ok(
    'la flèche droite mène au cran plus dur',
    afterArrow === 'Facile',
    afterArrow
  );

  await p.locator(`${SCALE} [role="radio"]`).last().click();
  await p.waitForTimeout(250);
  const picked = await caption(p);
  ok(
    'le visage de droite se nomme « Trop dure »',
    picked.includes('Trop dure') &&
      picked.includes("je n'ai pas pu tout faire"),
    picked
  );

  await press(p, /^Valider$/);
  await p.waitForTimeout(2200);
  ok(
    'il envoie 5, la valeur enregistrée pour « Trop dure »',
    sent?.feedback?.effort === 5,
    JSON.stringify(sent?.feedback ?? null)
  );

  // Le même bilan, relu : le mot affiché doit être celui qu'on a touché. On
  // lit la carte de la séance 2 et elle seule — le décor porte déjà une
  // séance 1 « Trop dure », qui ferait passer l'assertion sans rien prouver.
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1700);
  const card = clean(
    await p
      .getByRole('button')
      .filter({ hasText: /Séance 2/ })
      .filter({ hasText: /Voir le détail/ })
      .first()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok(
    "l'accueil relit « Trop dure » sur la séance qu'on vient d'envoyer",
    card.includes('Trop dure'),
    card.replace(/\n/g, ' · ').slice(0, 100)
  );

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
