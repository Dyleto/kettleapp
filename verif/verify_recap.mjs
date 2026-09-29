/**
 * Le récapitulatif de fin de séance : constater avant de demander.
 *
 * L'arc d'une séance était : quarante minutes d'effort, puis « tu veux noter
 * tes charges ? » — devant des charges déjà notées — puis « c'était
 * comment ? », puis un toast, puis l'accueil. On demandait deux fois avant de
 * donner quoi que ce soit.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  dialogs,
  skipRest,
} from './common.mjs';

const browser = await launch();

/**
 * Mène la séance 2 jusqu'au bout, en notant une charge sur chaque série du
 * bloc classique — ce que fait un client qui se sert du mode guidé comme d'un
 * carnet.
 */
const runSess2 = async (p, goblet, lunges) => {
  await start(p, 'sess2');
  // Le Tabata : huit tours, rien à noter.
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(200);
  }
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
    const done = p.getByRole('button', { name: /^Fait$/ });
    if (await done.count()) {
      await done.click();
    } else break;
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  // « Terminer la séance » (la sortie de secours, en haut) et « Terminer »
  // (le bouton principal) coexistent : le nom exact désigne le second.
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1400);
};

// ── Le constat vient avant la question ──────────────────────────────────
{
  console.log("\n── la fin d'une séance récompense avant de demander");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await runSess2(p, 26, 16);

  const t = await dialogs(p);
  ok(
    'on ne redemande pas des charges déjà notées',
    !/Tu veux noter tes charges/i.test(t),
    (t.match(/[^\n]*noter tes charges[^\n]*/) ?? [
      '(la question ne se pose plus)',
    ])[0]
  );
  ok(
    "le bilan s'ouvre sur le constat",
    /C'est fait\./.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  ok(
    '  → et nomme la séance',
    /Séance 2\s*—\s*Haut du corps/.test(t),
    (t.match(/[^\n]*Séance 2[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → la question vient après, pas avant',
    t.indexOf("C'est fait.") < t.indexOf('Cette séance'),
    `constat en ${t.indexOf("C'est fait.")}, question en ${t.indexOf('Cette séance')}`
  );
  ok('  → et elle est toujours posée', /Cette séance, c'était/.test(t));

  ok(
    'la durée de la séance est annoncée',
    /\d+ min[\s\S]{0,20}de séance/.test(t),
    (t.match(/[^\n]*de séance[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    'les exercices faits sont comptés',
    /15[\s\S]{0,30}exercices, tous faits/.test(t),
    (t.match(/[^\n]*exercices[^\n]*/) ?? ['(rien)'])[0]
  );
  // 26 kg × 10 reps × 4 séries + 16 kg × 12 reps × 3 séries.
  ok(
    'le tonnage est celui des doses réellement cochées',
    /1 616 kg/.test(t),
    (t.match(/[^\n]*soulevés[^\n]*/) ?? ['(rien)'])[0]
  );

  // Le jeu de données porte déjà une séance passée : 26 kg au Goblet, 12 aux
  // fentes.
  ok(
    'le constat compare avec la dernière fois',
    /Par rapport à la dernière fois/i.test(t)
  );
  ok(
    '  → ce qui a monté est dit',
    /Fentes marchées[\s\S]{0,30}\+4 kg/.test(t),
    (t.match(/Fentes marchées[\s\S]{0,30}/) ?? ['(rien)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    "  → et ce qui a tenu aussi, ce qui n'est pas rien",
    /Goblet Squat[\s\S]{0,20}=/.test(t),
    (t.match(/Goblet Squat[\s\S]{0,20}/) ?? ['(rien)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    'et on rassure sur ce qui est déjà enregistré',
    /Tes charges sont déjà enregistrées/.test(t),
    (t.match(/[^\n]*déjà enregistrées[^\n]*/) ?? ['(rien)'])[0]
  );

  // Le bouton de validation reste atteignable : le récapitulatif a grandi la
  // boîte.
  const submit = p.getByRole('button', { name: /^Valider$/ });
  const box = await submit.boundingBox();
  ok(
    "  → et « Valider » reste dans l'écran",
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

// ── La seconde fois, le récapitulatif a de quoi comparer ────────────────
{
  console.log("\n── à la deuxième séance, l'écart se lit");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await runSess2(p, 26, 16);
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Valider$/ }).click();
  await p.waitForTimeout(2200);

  await runSess2(p, 30, 16);
  const t = await dialogs(p);
  ok(
    'le mouvement chargé en plus vient en premier',
    /Goblet Squat[\s\S]{0,40}\+4 kg/.test(t),
    (t.match(/Goblet Squat[\s\S]{0,30}/) ?? ['(rien)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    "  → et celui qu'on a tenu le dit aussi",
    /Fentes marchées[\s\S]{0,30}=/.test(t),
    (t.match(/Fentes marchées[\s\S]{0,20}/) ?? ['(rien)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok('  → « 1re fois » a disparu', !/1re fois/.test(t));
  await ctx.close();
}

// ── Un mouvement jamais fait ne se compare à rien ───────────────────────
{
  console.log("\n── sur un mouvement neuf, on n'invente aucune progression");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  // Un chipper : quatre mouvements. Seul le Kettlebell Swing a un passé.
  for (let i = 0; i < 4; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé, en kilos"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(10 + i));
      await p.waitForTimeout(200);
    }
    const done = p.getByRole('button', { name: /^Fait$/ });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(280);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1400);
  const t = await dialogs(p);
  ok(
    'un mouvement sans passé le dit',
    /1re fois/.test(t),
    (t.match(/[^\n]*1re fois[^\n]*/) ?? ['(aucune)'])[0]
  );
  ok(
    "  → et aucun écart n'est inventé à sa place",
    !/Burpee[\s\S]{0,24}[+−-]\d/.test(t),
    (t.match(/Burpee[\s\S]{0,24}/) ?? ['(rien)'])[0].replace(/\n+/g, ' · ')
  );
  await ctx.close();
}

// ── À qui n'a rien noté, on le propose encore ───────────────────────────
{
  console.log('\n── rien noté pendant : la question garde son sens');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(200);
  }
  // Rien n'a été coché : le bouton principal dit encore « Fait ». On sort
  // par la sortie de secours, celle qui est toujours là.
  await p
    .getByRole('button', { name: 'Terminer la séance', exact: true })
    .click();
  await p.waitForTimeout(1300);
  const t = await dialogs(p);
  ok(
    'on propose encore de noter les charges',
    /Tu veux noter tes charges/i.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await p.getByRole('button', { name: /Passer au ressenti/ }).click();
  await p.waitForTimeout(900);
  const t2 = await dialogs(p);
  ok(
    '  → et le constat est là quand même : la séance a bien eu lieu',
    /C'est fait\./.test(t2),
    t2.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  ok('  → sans tonnage inventé', !/soulevés en tout/.test(t2));
  ok('  → ni promesse de charges enregistrées', !/déjà enregistrées/.test(t2));
  await ctx.close();
}

// ── Les tours de l'AMRAP figurent dans le constat ───────────────────────
{
  console.log("\n── le score de l'AMRAP est l'un des chiffres du constat");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant|Passer)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(180);
    await skipRest(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  const plus = p.getByRole('button', { name: /^\+1 tour$/ });
  ok('on atteint la boucle', (await plus.count()) > 0);
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(150);
  }
  await p
    .getByRole('button', { name: 'Terminer la séance', exact: true })
    .click();
  await p.waitForTimeout(1400);
  // Aucune charge notée ici : la question garde son sens, on la franchit.
  await p.getByRole('button', { name: /Passer au ressenti/ }).click();
  await p.waitForTimeout(900);
  const t = await dialogs(p);
  ok(
    'les tours bouclés figurent dans le constat',
    /6 tours[\s\S]{0,20}bouclés/.test(t),
    (t.match(/[^\n]*tours[^\n]*\n?[^\n]*/) ?? ['(rien)'])[0].replace(
      /\n/g,
      ' · '
    )
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
