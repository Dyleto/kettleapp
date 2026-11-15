/**
 * L'écran de fin : fêter avant de demander.
 *
 * L'arc d'une séance était : quarante minutes d'effort, puis « tu veux noter
 * tes charges ? » — devant des charges déjà notées — puis « c'était
 * comment ? », puis un toast, puis l'accueil. On demandait deux fois avant de
 * donner quoi que ce soit. La fin d'une séance menée en mode guidé ouvre
 * maintenant sur un écran de fête : trois chiffres, un vrai record s'il y en
 * a un — mesuré au meilleur de tout l'historique, pas à la dernière fois —
 * et la question du ressenti seulement après « Continuer ».
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  dialogs,
  clean,
  skipRest,
  finishFromPause,
  passBlock,
  advance,
  launchClock,
} from './common.mjs';

const browser = await launch();

/**
 * Mène la séance 2 jusqu'au bout, en notant une charge sur chaque série du
 * bloc classique — ce que fait un client qui se sert du mode guidé comme d'un
 * carnet.
 */
const runSess2 = async (p, goblet, lunges) => {
  await start(p, 'sess2');
  // Le Tabata, passé par la pause : huit tours, rien à noter.
  await passBlock(p);
  // Le bloc classique : sept séries, une charge sur chacune.
  for (let i = 0; i < 7; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé, en kilos"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(i < 4 ? goblet : lunges));
      await p.waitForTimeout(200);
    }
    const done = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (await done.count()) {
      await done.click();
    } else break;
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  // Le bouton principal, au dernier geste de la séance.
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1600);
};

/** L'écran de fin : son nom, ses tuiles telles qu'elles s'annoncent, son
 * texte. Les tuiles se lisent à leur étiquette — le chiffre affiché monte
 * pendant une seconde, l'étiquette dit d'emblée la valeur finale. */
const ending = (p) =>
  p.evaluate(() => {
    const scene = [...document.querySelectorAll('[role="dialog"]')].find((d) =>
      /^Séance (terminée|arrêtée)$/.test(d.getAttribute('aria-label') ?? '')
    );
    return {
      name: scene?.getAttribute('aria-label') ?? null,
      tiles: [...(scene?.querySelectorAll('[role="group"]') ?? [])].map(
        (g) => g.getAttribute('aria-label') ?? ''
      ),
      text: scene?.innerText ?? '',
      confetti: !!scene?.querySelector('[data-confetti]'),
    };
  });
const cleanTiles = (e) => e.tiles.map((x) => clean(x));

// ── L'écran de fête vient avant la question ─────────────────────────
{
  console.log("\n── la fin d'une séance fête avant de demander");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Le décor : au Goblet, 26 kg la dernière fois et au mieux ; aux fentes,
  // 12 la dernière fois mais 16 au mieux. 18 bat donc le meilleur — et 16
  // ne l'aurait pas battu, quoique au-dessus de la dernière fois.
  await runSess2(p, 26, 18);

  const e = await ending(p);
  ok(
    'la fin s’ouvre sur « Séance terminée »',
    e.name === 'Séance terminée',
    e.name ?? '(aucun écran de fin)'
  );
  ok(
    '  → sans redemander des charges déjà notées',
    !/Tu veux noter tes charges/i.test(await dialogs(p))
  );
  ok(
    '  → et nomme la séance',
    /Séance 2\s*—\s*Haut du corps/.test(e.text),
    (e.text.match(/[^\n]*Séance 2[^\n]*/) ?? ['(rien)'])[0]
  );
  ok('  → avec ses confettis', e.confetti);
  const tiles = cleanTiles(e);
  ok(
    'la durée, les séries et tours, et les kilos soulevés',
    tiles.length === 3 &&
      /^\d+ minutes?$/.test(tiles[0]) &&
      tiles[1] === '15 séries et tours',
    tiles.join(' · ')
  );
  // 26 kg × 10 reps × 4 séries + 18 kg × 12 reps × 3 séries.
  ok(
    '  → le tonnage est celui des doses réellement cochées',
    tiles[2] === '1 688 kg soulevés',
    tiles[2]
  );
  ok(
    'un vrai record : les fentes, deux kilos au-dessus du meilleur',
    /Nouveau record/.test(e.text) &&
      /Fentes marchées · 18\s*kg, 2 de plus qu’avant/.test(clean(e.text)),
    (clean(e.text).match(/Nouveau record[\s\S]{0,60}/) ?? ['(aucun)'])[0]
  );
  ok('  → pas le Goblet, tenu à sa charge', !/Goblet Squat ·/.test(e.text));

  await p.getByRole('button', { name: 'Continuer', exact: true }).click();
  await p.waitForTimeout(800);
  const t = await dialogs(p);
  ok(
    '« Continuer » mène au ressenti',
    /Alors, cette séance/.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  const submit = p.getByRole('button', { name: /^Envoyer à ton coach$/ });
  const box = await submit.boundingBox();
  ok(
    "  → et « Envoyer à ton coach » est dans l'écran",
    !!box && box.y + box.height <= 844,
    box ? `bas à ${Math.round(box.y + box.height)} px` : '(introuvable)'
  );
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await submit.click();
  await p.waitForTimeout(2000);
  const leftovers = await p.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('kettle-seance-'))
  );
  ok(
    'une séance envoyée ne laisse rien derrière elle',
    leftovers.length === 0,
    leftovers.join(', ') || '(rien)'
  );
  await ctx.close();
}

// ── Le record se mesure au meilleur, et un seul s'affiche ───────────────
{
  console.log('\n── à la deuxième séance, le record a monté d’un cran');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await runSess2(p, 26, 18);
  await p.getByRole('button', { name: 'Continuer', exact: true }).click();
  await p.waitForTimeout(600);
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Envoyer à ton coach$/ }).click();
  await p.waitForTimeout(2200);

  // Les fentes à 18 ne battent plus rien : 18 est désormais le meilleur.
  await runSess2(p, 30, 18);
  const e = await ending(p);
  ok(
    'le Goblet à 30 bat son meilleur de 4 kg',
    /Goblet Squat · 30\s*kg, 4 de plus qu’avant/.test(clean(e.text)),
    (clean(e.text).match(/Nouveau record[\s\S]{0,60}/) ?? ['(aucun)'])[0]
  );
  ok(
    '  → et les fentes, égales à leur meilleur, ne sont pas un record',
    !/Fentes marchées ·/.test(e.text) && !/autre/.test(e.text)
  );
  await ctx.close();
}

// ── La régularité, quand rien ne bat rien ──────────────────────────────
{
  console.log('\n── les mêmes charges que la dernière fois : la régularité');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await runSess2(p, 26, 12);
  const e = await ending(p);
  ok(
    '« Régularité tenue », sans record inventé',
    /Régularité tenue/.test(e.text) && !/Nouveau record/.test(e.text),
    (e.text.match(/[^\n]*(Régularité|record)[^\n]*/) ?? ['(rien)'])[0]
  );
  await ctx.close();
}

// ── Un mouvement jamais fait ne bat aucun record ────────────────────────
{
  console.log("\n── sur un mouvement neuf, on n'invente aucun record");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  // Un chipper : quatre mouvements, chargés lourd. Seul le Kettlebell Swing
  // a un passé, et 40 kg le dépasse.
  for (let i = 0; i < 4; i++) {
    const ask = p.getByRole('button', { name: 'Noter une charge' });
    if (await ask.count()) {
      await ask.click();
      await p.waitForTimeout(200);
    }
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé, en kilos"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill('40');
      await p.waitForTimeout(200);
    }
    const done = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(280);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1600);
  const e = await ending(p);
  ok(
    'le seul mouvement qui a un passé fait le record',
    /Kettlebell Swing · 40\s*kg/.test(clean(e.text)),
    (clean(e.text).match(/Nouveau record[\s\S]{0,60}/) ?? ['(aucun)'])[0]
  );
  ok(
    "  → aucun des trois autres n'est compté parmi les records",
    !/autre/.test(e.text),
    (clean(e.text).match(/Nouveau record[\s\S]{0,80}/) ?? ['(aucun)'])[0]
  );
  await ctx.close();
}

// ── Arrêtée en route, la séance dit ce qui est vrai ─────────────────────
{
  console.log('\n── une séance arrêtée en route');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  await passBlock(p);
  // Le Tabata passé, rien coché : on sort par la pause.
  await finishFromPause(p);
  const e = await ending(p);
  ok(
    '« Séance arrêtée », sans confettis',
    e.name === 'Séance arrêtée' && !e.confetti,
    `${e.name} · confettis : ${e.confetti}`
  );
  ok(
    '  → les séries et tours sur le total, sans tonnage inventé',
    cleanTiles(e).includes('8 sur 15 séries et tours') &&
      !cleanTiles(e).some((x) => /kg soulevés/.test(x)),
    cleanTiles(e).join(' · ')
  );
  ok(
    '  → « Ce qui est fait est fait », et pas de record',
    /Ce qui est fait est fait/.test(e.text) && !/Nouveau record/.test(e.text)
  );
  await ctx.close();
}

// ── Les tours de l'AMRAP figurent parmi les chiffres ────────────────────
{
  console.log("\n── le score de l'AMRAP est l'un des chiffres de la fin");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    if (await p.getByRole('button', { name: /^Ajouter un tour/ }).count())
      break;
    await advance(p);
    await skipRest(p);
  }
  // Le rond ne compte qu'une fois l'horloge lancée : rien ne part sans un
  // geste, pas plus dans un AMRAP qu'ailleurs.
  await launchClock(p);
  const plus = p.getByRole('button', { name: /^Ajouter un tour/ });
  ok('on atteint la boucle', (await plus.count()) > 0);
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(150);
  }
  await finishFromPause(p);
  await p.waitForTimeout(600);
  const e = await ending(p);
  ok(
    'aucune charge notée : la troisième tuile compte les tours bouclés',
    cleanTiles(e).includes('6 tours bouclés'),
    cleanTiles(e).join(' · ')
  );

  // « Compléter mes charges » ouvre la saisie, et « OK » ramène ici.
  await p
    .getByRole('button', { name: 'Compléter mes charges', exact: true })
    .click();
  await p.waitForTimeout(800);
  ok(
    '« Compléter mes charges » ouvre la saisie',
    /Mes charges/.test(await dialogs(p)),
    (await dialogs(p)).split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await p.getByRole('button', { name: 'OK', exact: true }).click();
  await p.waitForTimeout(800);
  ok(
    '  → et « OK » ramène à l’écran de fin',
    (await ending(p)).name !== null,
    (await ending(p)).name ?? '(fermé)'
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
