/**
 * La série en cours, en grand : sa charge proposée, réglée au pouce, et ce
 * qui s'enregistre quand on la coche.
 *
 * Une charge se tapait dans un champ, à chaque série, mains moites — et rien
 * ne s'enregistrait tant qu'on n'y avait pas tapé. « Tes charges sont déjà
 * enregistrées » n'était vrai que pour qui avait tout ressaisi. Elle est
 * maintenant proposée d'après la dernière fois, corrigée d'un kilo par
 * touche, et enregistrée avec la série.
 *
 * Ce que seul un navigateur montre : ce que la touche − fait au nombre, ce
 * que « Série faite » écrit dans l'appareil, et ce qui revient à l'écran
 * quand on efface une charge.
 *
 * Décor : le dernier bilan de « Goblet Squat » porte 26 kg.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  clean,
} from './common.mjs';

const HERO = '[data-set-hero]';
const GOBLET = '2:1';

/** Le texte de la série en grand, une ligne par morceau. */
const hero = (p) =>
  p
    .locator(HERO)
    .innerText({ timeout: 2000 })
    .then((t) => clean(t).replace(/\n+/g, ' | '))
    .catch(() => '');

/** La charge affichée dans le sélecteur, telle qu'on la lit. */
const shownLoad = (p) =>
  p
    .locator(`${HERO} input`)
    .inputValue({ timeout: 1000 })
    .catch(() => null);

/** Les charges que l'appareil a retenues pour un mouvement. */
const noted = (p, key) =>
  p.evaluate((k) => {
    const raw = localStorage.getItem('kettle-seance-sess2');
    const stored = raw ? JSON.parse(raw) : null;
    return {
      weights: (stored?.performed?.[k]?.sets ?? []).map((s) => s?.weight),
      done: stored?.done ?? [],
      skipped: stored?.skipped ?? [],
    };
  }, key);

const press = async (p, name) => {
  const button = p.getByRole('button', { name, exact: true });
  if (!(await button.count())) return false;
  await button
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForTimeout(250);
  return true;
};

/** La séance 2, au bloc « Renfo » : on passe le Tabata par la pause. */
const reachRenfo = async (p) => {
  await start(p, 'sess2');
  await press(p, 'Mettre la séance en pause');
  await p
    .locator('[role="dialog"][aria-label="Pause"]')
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForTimeout(500);
};

const browser = await launch();

{
  console.log('\n── la charge proposée, et le pouce qui la corrige');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachRenfo(p);

  const first = await hero(p);
  ok(
    'la série en cours se lit en grand : rang, nom, dose',
    first.startsWith('SÉRIE 1 SUR 4 | Goblet Squat | 10 | reps'),
    first
  );
  ok(
    'la charge de la dernière fois est proposée',
    (await shownLoad(p)) === '26' && first.includes('comme la dernière fois'),
    `${await shownLoad(p)} — ${first}`
  );

  await press(p, 'Un kilo de plus');
  ok(
    '+ ajoute un kilo, et la légende le dit',
    (await shownLoad(p)) === '27' &&
      (await hero(p)).includes('+ 1 kg sur la dernière fois'),
    `${await shownLoad(p)} — ${await hero(p)}`
  );
  await press(p, 'Un kilo de moins');
  await press(p, 'Un kilo de moins');
  ok(
    '− en retire un',
    (await shownLoad(p)) === '25' && (await hero(p)).includes('1 kg de moins'),
    `${await shownLoad(p)} — ${await hero(p)}`
  );

  // Un appui long avance de cinq kilos, et continue tant qu'on tient.
  const plus = p.getByRole('button', { name: 'Un kilo de plus', exact: true });
  const box = await plus.boundingBox();
  if (box) {
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.waitForTimeout(1000);
    await p.mouse.up();
    await p.waitForTimeout(250);
  }
  const afterHold = Number(await shownLoad(p));
  ok(
    'un appui long avance de cinq en cinq',
    afterHold >= 35 && (afterHold - 25) % 5 === 0,
    String(afterHold)
  );
  // 28 et non 26 : une valeur égale à celle de la dernière fois ne dirait
  // pas d'où vient ce que l'écran propose ensuite.
  await p.locator(`${HERO} input`).fill('28');
  await p.waitForTimeout(200);

  await press(p, 'Série faite');
  const once = await noted(p, GOBLET);
  ok(
    '« Série faite » enregistre la charge tapée',
    once.weights[0] === 28 && once.done.length === 1,
    JSON.stringify(once)
  );

  // La série suivante reprend la charge qu'on vient de noter — pas celle de
  // la dernière fois.
  await press(p, 'Passer');
  ok(
    'la série suivante reprend la charge notée juste avant',
    (await hero(p)).startsWith('SÉRIE 2 SUR 4') &&
      (await shownLoad(p)) === '28',
    `${await shownLoad(p)} — ${await hero(p)}`
  );

  // Sans toucher à rien : la charge affichée est celle qui s'enregistre.
  // Comparée à ce qui était à l'écran, et non à une valeur écrite ici :
  // l'assertion juge l'enregistrement, pas la proposition.
  const proposed = Number(await shownLoad(p));
  await press(p, 'Série faite');
  const untouched = await noted(p, GOBLET);
  ok(
    '« Série faite » enregistre aussi la charge proposée, sans saisie',
    proposed > 0 &&
      untouched.weights[1] === proposed &&
      untouched.done.length === 2,
    `${proposed} affiché — ${JSON.stringify(untouched)}`
  );

  // Effacer la charge : une série au poids du corps doit pouvoir se noter.
  await press(p, 'Passer');
  await p.locator(`${HERO} input`).fill('');
  await p.waitForTimeout(250);
  ok(
    'une charge effacée reste effacée',
    (await shownLoad(p)) === '' && !(await hero(p)).includes('dernière fois'),
    `« ${await shownLoad(p)} » — ${await hero(p)}`
  );
  await press(p, 'Série faite');
  const cleared = await noted(p, GOBLET);
  ok(
    '  → et la série cochée n’en enregistre aucune',
    cleared.done.length === 3 && cleared.weights[2] === undefined,
    JSON.stringify(cleared)
  );

  // Revenir sur la série d'avant : elle se décoche, et redevient la série
  // en cours.
  await press(p, 'Passer');
  await press(p, 'Série précédente');
  const back = await noted(p, GOBLET);
  ok(
    '« Série précédente » décoche la dernière série faite',
    back.done.length === 2 && (await hero(p)).startsWith('SÉRIE 3 SUR 4'),
    `${back.done.join(', ')} — ${await hero(p)}`
  );

  // Passer le mouvement : ses séries restent non faites.
  await press(p, 'Passer cet exercice');
  const skipped = await noted(p, GOBLET);
  ok(
    '« Passer cet exercice » mène au mouvement suivant',
    (await hero(p)).includes('Fentes marchées'),
    await hero(p)
  );
  ok(
    '  → sans cocher les séries passées',
    skipped.done.length === back.done.length &&
      skipped.skipped.includes(GOBLET),
    JSON.stringify(skipped)
  );
  await ctx.close();
}

{
  console.log('\n── pas de champ « kg » là où personne n’en a jamais noté');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  const rope = await hero(p);
  ok(
    'la corde à sauter n’a ni charge ni proposition d’en noter',
    rope.includes('Corde à sauter') &&
      (await p.locator(`${HERO} input`).count()) === 0 &&
      !rope.includes('Noter une charge'),
    rope
  );

  await press(p, 'Fait');
  await press(p, 'Passer');
  const climbers = await hero(p);
  ok(
    'un mouvement sans charge connue propose d’en noter une',
    climbers.includes('Mountain Climbers') &&
      climbers.includes('Noter une charge') &&
      (await p.locator(`${HERO} input`).count()) === 0,
    climbers
  );
  await press(p, 'Noter une charge');
  ok(
    '  → et le sélecteur apparaît vide',
    (await shownLoad(p)) === '',
    `« ${await shownLoad(p)} »`
  );
  await ctx.close();
}

{
  console.log('\n── les noms ne sont plus coupés');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachRenfo(p);
  const cut = await p.evaluate(() =>
    [...document.querySelectorAll('[aria-label="Séance guidée"] *')]
      .filter(
        (e) =>
          e.children.length === 0 &&
          /Fentes marchées|Goblet Squat/.test(e.textContent) &&
          e.getClientRects().length > 0
      )
      .filter(
        (e) =>
          e.scrollWidth > e.clientWidth + 1 ||
          e.scrollHeight > e.clientHeight + 1
      )
      .map((e) => e.textContent.trim())
  );
  ok(
    'aucun nom de mouvement n’est rogné dans la liste',
    cut.length === 0,
    cut.join(' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
