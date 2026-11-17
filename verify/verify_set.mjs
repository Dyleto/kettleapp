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
  settle,
  hold,
  pastInterlude,
} from './common.mjs';

const HERO = '[data-set-hero]';
/** Le champ de la charge, par son nom : le sélecteur des répétitions, ouvert,
 * est lui aussi un champ de la série, et il vient avant. */
const LOAD = `${HERO} input[aria-label^="Poids utilisé"]`;
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
    .locator(LOAD)
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
  await settle(p);
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
  await settle(p);
  await pastInterlude(p);
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
    await hold(p, 1000, 'un appui long : on tient le bouton');
    await p.mouse.up();
    await settle(p);
  }
  const afterHold = Number(await shownLoad(p));
  ok(
    'un appui long avance de cinq en cinq',
    afterHold >= 35 && (afterHold - 25) % 5 === 0,
    String(afterHold)
  );
  // 28 et non 26 : une valeur égale à celle de la dernière fois ne dirait
  // pas d'où vient ce que l'écran propose ensuite.
  await p.locator(LOAD).fill('28');
  await settle(p);

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
  await p.locator(LOAD).fill('');
  await settle(p);
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
      (await p.locator(LOAD).count()) === 0 &&
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
      (await p.locator(LOAD).count()) === 0,
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
  console.log('\n── un exercice à durée se fait dans un anneau');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess1');
  const ring = () =>
    p.evaluate(
      () =>
        [...document.querySelectorAll('[data-set-hero] button')]
          .map((b) => b.getAttribute('aria-label') ?? '')
          .find((l) => /décompte|en pause —/.test(l)) ?? ''
    );

  ok(
    'la corde à sauter attend une touche, anneau plein',
    /^Lancer le décompte — 2:00$/.test(clean(await ring())) &&
      (await hero(p)).includes('Toucher pour lancer'),
    clean(await ring())
  );
  ok(
    '  → sans proposer de remettre ce qui n’a pas bougé',
    !(await hero(p)).includes('Remettre à')
  );

  await p
    .getByRole('button', { name: /^Lancer le décompte/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 500);
  await p.clock.runFor(30_000);
  await settle(p);
  ok(
    'une touche le lance, et il décompte',
    /^Mettre en pause — 1:3\d restant$/.test(clean(await ring())),
    clean(await ring())
  );

  await press(p, 'Remettre à 2 min');
  ok(
    '« Remettre à 2 min » repart d’un anneau plein',
    /^Lancer le décompte — 2:00$/.test(clean(await ring())),
    clean(await ring())
  );

  await p
    .getByRole('button', { name: /^Lancer le décompte/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p.clock.runFor(121_000);
  await settle(p);
  const done = await p.evaluate(
    () => JSON.parse(localStorage.getItem('kettle-seance-sess1') || '{}').done
  );
  ok(
    'à zéro, la série se coche seule',
    Array.isArray(done) && done.includes('1:1:1'),
    JSON.stringify(done)
  );
  ok(
    '  → et le mouvement suivant prend sa place',
    (await hero(p)).includes('Mountain Climbers'),
    await hero(p)
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

// ── Un autre nombre de répétitions que le prescrit ───────────────────────
//
// Retour du terrain : « j'en ai fait 8 au lieu de 10, je le mets où ? ».
// Nulle part : la dose prescrite était la seule chose à l'écran.
{
  console.log('\n── noter un autre nombre de répétitions');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await reachRenfo(p);
  const field = p.getByLabel(/^Répétitions faites — /);
  const number = p.getByRole('button', {
    name: /^Noter un autre nombre de répétitions/,
  });
  ok(
    'le nombre prescrit se touche, et rien ne s’ouvre avant',
    (await number.count()) === 1 && (await field.count()) === 0
  );
  await number.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    '  → il ouvre son sélecteur, au prescrit',
    (await field.inputValue({ timeout: 1000 }).catch(() => null)) === '10' &&
      /comme prescrit/.test(await hero(p)),
    await hero(p)
  );
  await press(p, 'Une répétition de moins');
  await press(p, 'Une répétition de moins');
  const reps = await p.evaluate(
    (k) =>
      JSON.parse(localStorage.getItem('kettle-seance-sess2') || '{}')
        .performed?.[k]?.sets?.[0]?.reps,
    GOBLET
  );
  ok(
    '  → deux de moins : 8, et l’écart se lit',
    reps === 8 && /2 de moins que prescrit/.test(await hero(p)),
    `${reps} · ${await hero(p)}`
  );

  await press(p, 'Série faite');
  await p
    .getByRole('button', { name: 'Passer', exact: true })
    .click({ timeout: 1000 })
    .catch(() => {});
  await settle(p);
  const row = clean(
    await p
      .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
      .innerText({ timeout: 1000 })
      .catch(() => '')
  );
  ok(
    'la série faite dit ce qui a été fait : 8 reps',
    /8 reps/.test(row),
    row.replace(/\n+/g, ' | ')
  );
  ok(
    '  → la série suivante repart du prescrit, sélecteur fermé',
    (await number.count()) === 1 &&
      (await field.count()) === 0 &&
      /\| 10 \| reps/.test(await hero(p)),
    await hero(p)
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
