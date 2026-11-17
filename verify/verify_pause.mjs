/**
 * La pause : ce qu'on peut faire d'une séance sans la continuer.
 *
 * Elle remplace « Quitter », et répare trois choses que seul un navigateur
 * montre.
 *
 * L'ancienne question de sortie remplaçait la scène tout entière : ses
 * horloges étaient démontées, et répondre « Continuer la séance » faisait
 * repartir de zéro un tour d'EMOM entamé. La pause se pose par-dessus la
 * scène, qui reste montée et se fige.
 *
 * Le retour du téléphone quittait la page, donc la séance, sans un mot : il
 * ouvre maintenant la pause, et la referme.
 *
 * Et l'emphase était inversée : le bouton ambre disait « Quitter » à
 * quelqu'un qui l'avait le plus souvent touché par mégarde.
 *
 * Le temps est mené à la main : une pause de quarante secondes ne doit rien
 * coûter au tour, et ne rien lui offrir non plus — c'est à la seconde près
 * qu'on le vérifie.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  where,
  skipRest,
  MOBILE,
  skipCountdown,
  settle,
} from './common.mjs';

const SHEET = '[role="dialog"][aria-label="Pause"]';

const sheetOpen = (p) =>
  p
    .locator(SHEET)
    .count()
    .then((n) => n === 1);

/** Les secondes que l'horloge du tour annonce, lues sur son nom. */
const secondsLeft = (p) =>
  p.evaluate(() => {
    const label =
      document.querySelector('[role="timer"]')?.getAttribute('aria-label') ??
      '';
    // L'anneau d'un tour dit « Tour 1 sur 10 — 40 secondes restantes » ;
    // `\s` parce que l'espace y est insécable.
    const m = label.match(/(\d+)\s*secondes? restantes?/);
    return m ? Number(m[1]) : null;
  });

/** Presse un bouton s'il est là ; son absence est jugée par l'assertion. */
const press = async (p, name, options = {}) => {
  const button = p.getByRole('button', { name, ...options });
  if (!(await button.count())) return;
  await button
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
};

/** Franchit l'échauffement de la séance 1 jusqu'à l'EMOM. */
const reachEmom = async (p) => {
  for (let i = 0; i < 6; i++) {
    if (/— EMOM$/.test(await where(p))) return;
    const next = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait|Suivant|Bloc suivant)$/,
    });
    if (!(await next.count())) return;
    await next.first().click();
    await settle(p);
    await skipRest(p);
  }
};

const browser = await launch();

{
  console.log('\n── un tour d’EMOM, mis en pause quarante secondes');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess1');
  await reachEmom(p);
  ok("on est bien sur l'EMOM", /— EMOM$/.test(await where(p)), await where(p));

  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 1000);
  await press(p, 'Lancer', { exact: true });
  await settle(p);
  await skipCountdown(p);
  await settle(p);
  await p.clock.runFor(20_000);
  await settle(p);
  const before = await secondsLeft(p);

  await press(p, 'Mettre la séance en pause');
  await settle(p);
  ok('le bouton du haut ouvre la pause', await sheetOpen(p));
  const sheet = (
    await p
      .locator(SHEET)
      .innerText()
      .catch(() => '')
  )
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\n+/g, ' | ');
  ok(
    'la pause dit où l’on en est, en blocs et en tours',
    sheet.includes('Bloc 2 sur 3 · tour 1 sur 10'),
    sheet.slice(0, 90)
  );
  ok(
    '  → et non en étapes',
    !/étape/i.test(sheet),
    sheet.match(/[^|]*étape[^|]*/i)?.[0] ?? ''
  );

  await p.clock.runFor(40_000);
  await settle(p);
  ok(
    "l'horloge du tour s'est figée pendant la pause",
    before !== null && (await secondsLeft(p)) === before,
    `${before} s avant, ${await secondsLeft(p)} s après 40 s de pause`
  );
  ok(
    '  → et la scène est restée sur le même tour',
    /tour 1 sur 10/.test(await where(p)),
    await where(p)
  );

  // Reprendre : l'horloge menait, donc trois secondes d'abord.
  await press(p, 'Reprendre', { exact: true });
  await settle(p);
  ok(
    'reprendre un bloc chronométré passe par le décompte',
    (await p.getByRole('button', { name: /^Départ dans/ }).count()) === 1
  );
  await p.clock.runFor(1000);
  await settle(p);
  ok(
    "  → pendant lequel l'horloge reste figée",
    (await secondsLeft(p)) === before,
    `${await secondsLeft(p)} s`
  );
  await p.clock.runFor(2000);
  await settle(p);
  await p.clock.runFor(5000);
  await settle(p);
  ok(
    'puis le tour repart d’où il était, sans rien perdre ni gagner',
    before !== null && (await secondsLeft(p)) === before - 5,
    `${before} s → ${await secondsLeft(p)} s après 5 s de reprise`
  );
  ok('  → et la feuille est fermée', !(await sheetOpen(p)));
  await ctx.close();
}

{
  console.log('\n── le retour du téléphone et Échap ouvrent la pause');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  const at = new URL(p.url()).pathname;

  await p.goBack();
  await settle(p);
  const openedByBack = await sheetOpen(p);
  ok('le retour ouvre la pause', openedByBack);
  ok(
    '  → sans quitter la séance',
    new URL(p.url()).pathname === at &&
      (await p.locator('[aria-label="Séance guidée"]').count()) === 1,
    new URL(p.url()).pathname
  );
  await p.goBack();
  await settle(p);
  // « Referme » suppose qu'elle était ouverte : une feuille jamais ouverte
  // donnerait le même état sans que le retour ait rien refermé.
  ok('un second retour la referme', openedByBack && !(await sheetOpen(p)));
  await p.goBack();
  await settle(p);
  ok(
    '  → et un troisième la rouvre, sans jamais quitter',
    (await sheetOpen(p)) && new URL(p.url()).pathname === at
  );

  await p.keyboard.press('Escape');
  await settle(p);
  ok('Échap la referme', !(await sheetOpen(p)));
  await p.keyboard.press('Escape');
  await settle(p);
  ok('  → et la rouvre', await sheetOpen(p));

  // Toucher le fond assombri reprend : c'est le geste de qui veut
  // continuer.
  await p.mouse.click(195, 60);
  await settle(p);
  ok('toucher le fond reprend la séance', !(await sheetOpen(p)));
  await ctx.close();
}

{
  console.log('\n── les sorties de la pause');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');

  await press(p, 'Mettre la séance en pause');
  await settle(p);
  const resume = p
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Reprendre', exact: true });
  const resumeColor = await resume
    .evaluate((b) => getComputedStyle(b).backgroundColor)
    .catch(() => '');
  ok(
    '« Reprendre » est le bouton principal, en ambre',
    resumeColor === 'rgb(207, 159, 63)',
    resumeColor
  );

  await p
    .locator(SHEET)
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Passer ce bloc » mène au bloc suivant',
    /— EMOM$/.test(await where(p)) && !(await sheetOpen(p)),
    await where(p)
  );

  await press(p, 'Mettre la séance en pause');
  await settle(p);
  await press(p, 'Arrêter et reprendre plus tard');
  await settle(p);
  ok(
    '« Arrêter et reprendre plus tard » ferme la séance',
    (await p.locator('[aria-label="Séance guidée"]').count()) === 0
  );
  ok(
    '  → en la gardant sur l’appareil',
    (await p.evaluate(() => localStorage.getItem('kettle-seance-sess1'))) !==
      null
  );
  await ctx.close();
}

{
  console.log('\n── terminer en route, et le dernier bloc');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // La séance 5 n'a qu'un bloc : il n'y a rien après à quoi passer.
  await start(p, 'sess5');
  await press(p, 'Mettre la séance en pause');
  await settle(p);
  ok(
    'au dernier bloc, la pause ne propose pas de le passer',
    (await sheetOpen(p)) &&
      (await p.getByRole('button', { name: 'Passer ce bloc' }).count()) === 0
  );
  await press(p, 'Terminer la séance maintenant');
  await settle(p);
  const dialogs = await p.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"]')]
      .map((d) => d.innerText)
      .join(' ')
  );
  ok(
    '« Terminer la séance maintenant » mène au bilan',
    (await p.locator('[aria-label="Séance guidée"]').count()) === 0 &&
      /charges|ressenti|c'était/i.test(dialogs),
    dialogs.replace(/\s+/g, ' ').slice(0, 80)
  );
  await ctx.close();
}

// ── Un repos mis en pause ───────────────────────────────────────────────
//
// Le repos entre deux séries a sa propre horloge, distincte de celle d'un
// tour. Rien ne vérifiait qu'elle se fige : un sabotage de son dégel ne
// faisait rien tomber.
{
  console.log('\n── un repos mis en pause trente secondes');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess2');
  // Le Tabata passé : le bloc « Renfo », une minute de repos entre ses
  // séries.
  await press(p, 'Mettre la séance en pause');
  await settle(p);
  await p
    .locator(SHEET)
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await press(p, 'Série faite', { exact: true });
  await settle(p);
  const before = await secondsLeft(p);
  await press(p, 'Mettre la séance en pause');
  await settle(p);
  await p.clock.runFor(30_000);
  await p
    .locator(SHEET)
    .getByRole('button', { name: 'Reprendre', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  // Une seconde de plus : l'horloge du repos ne relit l'heure que toutes les
  // 250 ms, et lue aussitôt après la reprise, elle montrait encore la valeur
  // d'avant la pause, qu'elle ait perdu les trente secondes ou non.
  await p.clock.runFor(1_000);
  await settle(p);
  const after = await secondsLeft(p);
  ok(
    'un repos mis en pause reprend où il était',
    before !== null && after !== null && Math.abs(before - after) <= 2,
    `${before} s → ${after} s`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
