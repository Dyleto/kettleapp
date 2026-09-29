/**
 * Reprendre, ou recommencer.
 *
 * Quitter le mode guidé n'efface rien : on retrouve sa place et ses charges
 * en revenant. Pour repartir de zéro, l'écran de reprise le propose — et
 * « recommencer » doit alors réellement tout remettre à zéro.
 *
 * La suite précédente vérifiait que les charges survivent à « recommencer » —
 * ce qui doit persister — sans jamais vérifier ce qui doit repartir à zéro.
 * C'est exactement par là que le défaut est passé.
 */
import {
  launch,
  BASE,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  where,
  guidedScreen,
  skipRest,
} from './common.mjs';

const browser = await launch();

// L'enregistrement local d'une séance, lu dans la page.
const record = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

/** Quitte la séance, y revient, et clique « Recommencer ». */
const startOver = async (p) => {
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Recommencer depuis le début/ }).click();
  await p.waitForTimeout(800);
};

// ── Un bloc en liste : le cas où « recommencer » ne faisait rien ────────
//
// Un chipper est une étape unique. Réinitialiser l'étape ne changeait donc
// rien, et les mouvements cochés le restaient.
{
  console.log('\n── recommencer décoche ce qui avait été coché');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  for (let i = 0; i < 3; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(20 + i));
      await p.waitForTimeout(150);
    }
    await p.getByRole('button', { name: /^Fait$/ }).click();
    await p.waitForTimeout(280);
    await skipRest(p);
  }
  const before = await record(p, 'sess3');
  ok(
    'trois mouvements sont cochés avant de quitter',
    before.done.length === 3,
    JSON.stringify(before.done)
  );

  await startOver(p);
  const after = await record(p, 'sess3');
  ok(
    "après « recommencer », plus rien n'est coché",
    after.done.length === 0,
    JSON.stringify(after.done)
  );

  const screen = await guidedScreen(p);
  ok(
    '  → et le bloc le dit : zéro sur quatre',
    /0 sur 4 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → le curseur est revenu sur le premier mouvement',
    /Burpee[\s\S]{0,40}21 reps/.test(screen),
    screen.split('\n').filter(Boolean).slice(2, 5).join(' · ')
  );

  // Les charges, elles, restent : c'est la part délibérée.
  ok(
    '  → mais les charges notées sont toujours là',
    Object.keys(after.performed).length === 3,
    JSON.stringify(Object.keys(after.performed))
  );
  const value = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .inputValue();
  ok(
    '  → et la première se relit dans son champ',
    value === '20',
    value || '(vide)'
  );
  await ctx.close();
}

// ── Une boucle : le compteur de tours repart aussi ──────────────────────
{
  console.log('\n── recommencer remet le compteur de tours à zéro');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(160);
    await skipRest(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  const plus = p.getByRole('button', { name: /^\+1 tour$/ });
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(120);
  }
  const before = await record(p, 'sess1');
  ok(
    "six tours sont comptés, et l'étape a avancé",
    before.rounds['3'] === 6 && before.step > 0,
    `étape ${before.step}, tours ${JSON.stringify(before.rounds)}`
  );

  await startOver(p);
  const after = await record(p, 'sess1');
  ok(
    'après « recommencer », tout est à zéro',
    after.step === 0 &&
      after.done.length === 0 &&
      Object.keys(after.rounds).length === 0,
    `étape ${after.step}, faits ${after.done.length}, tours ${JSON.stringify(after.rounds)}`
  );
  ok(
    '  → et la barre de progression le dit',
    /Étape 1 sur/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Et l'on repart réellement à neuf ────────────────────────────────────
//
// Recommencée puis quittée, on proposait encore de la reprendre en revenant :
// la séance se croyait commencée parce qu'elle comptait des séries cochées.
{
  console.log("\n── après avoir recommencé, on repart d'une séance neuve");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(300);
  await skipRest(p);
  await startOver(p);

  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const panel = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return d[d.length - 1]?.innerText ?? '';
  });
  ok(
    'on ne propose plus de reprendre une séance remise à zéro',
    !/Reprendre où tu en étais/i.test(panel),
    panel.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await ctx.close();
}

// ── Un enregistrement d'avant le passage aux noms anglais se relit ──────
//
// Les champs du stockage local portaient des noms français. Un client en
// pleine séance au moment où la version est partie aurait tout perdu : son
// enregistrement est toujours là, mais aucun de ses champs ne répond à son
// nouveau nom.
{
  console.log(
    '\n── une séance commencée avant la mise en production se retrouve'
  );
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.evaluate(() => {
    localStorage.setItem(
      'kettle-seance-sess3',
      JSON.stringify({
        version: 1,
        etape: 0,
        performed: { '1:1': { sets: [{ weight: 37 }] } },
        faits: ['1:1:1', '1:2:1'],
        tours: {},
        debutLe: Date.now() - 20 * 60_000,
        majLe: Date.now(),
      })
    );
  });
  await p.goto(`${BASE}/client/session/sess3`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const panel = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return (d[d.length - 1]?.innerText ?? '').replace(/\u00A0/g, ' ');
  });
  ok(
    "on propose de reprendre une séance rangée à l'ancien format",
    /Reprendre où tu en étais/i.test(panel),
    panel.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  ok(
    '  → et la charge notée avant la mise en production est annoncée',
    /charges sur 1 exercice/i.test(panel),
    (panel.match(/[^\n]*charges[^\n]*/) ?? ['(rien)'])[0]
  );

  await p.getByRole('button', { name: /^Reprendre$/ }).click();
  await p.waitForTimeout(800);
  // On reprend au premier exercice non coché : le troisième. Les deux
  // premiers sont derrière, cochés, avec la charge de l'ancien format.
  const screen = await guidedScreen(p);
  ok(
    '  → on reprend après les deux exercices déjà cochés',
    /2 sur 4 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    "  → et la charge de l'ancien format s'affiche toujours",
    /37 kg/.test(screen),
    (screen.match(/[^\n]*37 kg[^\n]*/) ?? ['(rien)'])[0]
  );

  // La première écriture réécrit l'enregistrement au nouveau format, sans
  // rien perdre de ce qu'il portait.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  const migrated = await record(p, 'sess3');
  ok(
    '  → à la première écriture, il passe au nouveau format',
    migrated.version === 2,
    `version ${migrated.version}`
  );
  ok(
    "  → en gardant ce qu'il portait",
    migrated.done.length === 3 &&
      migrated.performed['1:1'].sets[0].weight === 37,
    `${migrated.done.length} faits, ${JSON.stringify(migrated.performed['1:1'])}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
