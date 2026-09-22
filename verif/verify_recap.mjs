/**
 * The end-of-session recap: state the fact before asking the question.
 *
 * The arc of a session used to be: forty minutes of effort, then "do you
 * want to record your loads?" — in front of loads already recorded — then
 * "how was it?", then a toast, then the home screen. We asked twice before
 * giving anything.
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
 * Runs session 2 to the end, recording a load on every set of the classic
 * block — what a client does who uses guided mode as a working log.
 */
const runSess2 = async (p, goblet, lunges) => {
  await start(p, 'sess2');
  // The Tabata: eight rounds, nothing to record.
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(200);
  }
  // The classic block: seven sets, a weight on each.
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
  // "Terminer la séance" (the escape hatch, at the top) and "Terminer" (the
  // primary button) coexist: the exact name picks the second.
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1400);
};

// ── The statement comes before the question ─────────────────────────────
{
  console.log('\n── the end of a session rewards before it asks');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await runSess2(p, 26, 16);

  const t = await dialogs(p);
  ok(
    'we do not ask again for loads already recorded',
    !/Tu veux noter tes charges/i.test(t),
    (t.match(/[^\n]*noter tes charges[^\n]*/) ?? [
      '(the question no longer arises)',
    ])[0]
  );
  ok(
    'the wrap-up opens on the statement',
    /C'est fait\./.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  ok(
    '  → and names the session',
    /Séance 2\s*—\s*Haut du corps/.test(t),
    (t.match(/[^\n]*Séance 2[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    '  → the question comes after, not before',
    t.indexOf("C'est fait.") < t.indexOf('Cette séance'),
    `statement at ${t.indexOf("C'est fait.")}, question at ${t.indexOf('Cette séance')}`
  );
  ok('  → and it is still asked', /Cette séance, c'était/.test(t));

  ok(
    "the session's duration is stated",
    /\d+ min[\s\S]{0,20}de séance/.test(t),
    (t.match(/[^\n]*de séance[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    'the exercises done are counted',
    /15[\s\S]{0,30}exercices, tous faits/.test(t),
    (t.match(/[^\n]*exercices[^\n]*/) ?? ['(nothing)'])[0]
  );
  // 26 kg × 10 reps × 4 sets + 16 kg × 12 reps × 3 sets.
  ok(
    'the tonnage is that of the doses actually ticked',
    /1 616 kg/.test(t),
    (t.match(/[^\n]*soulevés[^\n]*/) ?? ['(nothing)'])[0]
  );

  // The test data already carries one past session: 26 kg on the Goblet,
  // 12 on the lunges.
  ok(
    'the statement compares with last time',
    /Par rapport à la dernière fois/i.test(t)
  );
  ok(
    '  → what went up is said',
    /Fentes marchées[\s\S]{0,30}\+4 kg/.test(t),
    (t.match(/Fentes marchées[\s\S]{0,30}/) ?? ['(nothing)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    '  → and so is what held, which is not nothing',
    /Goblet Squat[\s\S]{0,20}=/.test(t),
    (t.match(/Goblet Squat[\s\S]{0,20}/) ?? ['(nothing)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    'and we reassure about what is already stored',
    /Tes charges sont déjà enregistrées/.test(t),
    (t.match(/[^\n]*déjà enregistrées[^\n]*/) ?? ['(nothing)'])[0]
  );

  // The submit button stays reachable: the recap made the box taller.
  const submit = p.getByRole('button', { name: /^Valider$/ });
  const box = await submit.boundingBox();
  ok(
    '  → and "Valider" stays within the screen',
    !!box && box.y + box.height <= 844,
    box ? `bottom at ${Math.round(box.y + box.height)} px` : '(not found)'
  );

  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await submit.click();
  await p.waitForTimeout(2000);
  const leftovers = await p.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('kettle-seance-'))
  );
  ok(
    'a session that has been sent leaves nothing behind',
    leftovers.length === 0,
    leftovers.join(', ') || '(nothing)'
  );
  await ctx.close();
}

// ── The second time, the recap has something to compare ────────────────
{
  console.log('\n── on the second session, the gap reads');
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
    'the movement we loaded up comes first',
    /Goblet Squat[\s\S]{0,40}\+4 kg/.test(t),
    (t.match(/Goblet Squat[\s\S]{0,30}/) ?? ['(nothing)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok(
    '  → and the one we held says so too',
    /Fentes marchées[\s\S]{0,30}=/.test(t),
    (t.match(/Fentes marchées[\s\S]{0,20}/) ?? ['(nothing)'])[0].replace(
      /\n+/g,
      ' · '
    )
  );
  ok('  → "1re fois" is gone', !/1re fois/.test(t));
  await ctx.close();
}

// ── A movement never done compares with nothing ────────────────────────
{
  console.log('\n── on a new movement, we invent no progress');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  // A chipper: four movements. Only the Kettlebell Swing has a past.
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
    'a movement with no past says so',
    /1re fois/.test(t),
    (t.match(/[^\n]*1re fois[^\n]*/) ?? ['(none)'])[0]
  );
  ok(
    '  → and no gap is invented in its place',
    !/Burpee[\s\S]{0,24}[+−-]\d/.test(t),
    (t.match(/Burpee[\s\S]{0,24}/) ?? ['(nothing)'])[0].replace(/\n+/g, ' · ')
  );
  await ctx.close();
}

// ── Whoever recorded nothing is still offered the chance ───────────────
{
  console.log('\n── nothing recorded during: the question keeps its point');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(200);
  }
  // Nothing was ticked: the primary button still says "Fait". We leave by
  // the escape hatch, the one that is always there.
  await p
    .getByRole('button', { name: 'Terminer la séance', exact: true })
    .click();
  await p.waitForTimeout(1300);
  const t = await dialogs(p);
  ok(
    'we still offer to record the loads',
    /Tu veux noter tes charges/i.test(t),
    t.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  await p.getByRole('button', { name: /Passer au ressenti/ }).click();
  await p.waitForTimeout(900);
  const t2 = await dialogs(p);
  ok(
    '  → and the statement is there all the same: the session did happen',
    /C'est fait\./.test(t2),
    t2.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  ok('  → with no invented tonnage', !/soulevés en tout/.test(t2));
  ok('  → nor a promise of stored loads', !/déjà enregistrées/.test(t2));
  await ctx.close();
}

// ── The AMRAP's rounds appear in the statement ─────────────────────────
{
  console.log("\n── the AMRAP's score is one of the recap's figures");
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
  ok('we reach the loop', (await plus.count()) > 0);
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(150);
  }
  await p
    .getByRole('button', { name: 'Terminer la séance', exact: true })
    .click();
  await p.waitForTimeout(1400);
  // No weight recorded here: the question keeps its point, we step past it.
  await p.getByRole('button', { name: /Passer au ressenti/ }).click();
  await p.waitForTimeout(900);
  const t = await dialogs(p);
  ok(
    'the completed rounds are in the statement',
    /6 tours[\s\S]{0,20}bouclés/.test(t),
    (t.match(/[^\n]*tours[^\n]*\n?[^\n]*/) ?? ['(nothing)'])[0].replace(
      /\n/g,
      ' · '
    )
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
