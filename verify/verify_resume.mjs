/**
 * Reprendre, ou recommencer.
 *
 * Arrêter le mode guidé n'efface rien : on retrouve sa place et ses charges
 * en revenant, sans ouverture ni question — « Reprise au bloc 2 » le dit
 * trois secondes. Pour repartir de zéro, l'accueil le propose, et le demande
 * d'abord ; « recommencer » doit alors réellement tout remettre à zéro.
 *
 * La question « Reprendre où tu en étais ? » vivait dans la séance guidée :
 * elle se posait à qui venait de toucher « Reprendre » sur la fiche.
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
  leaveSession,
  advance,
  launchClock,
  START,
  skipCountdown,
  settle,
} from './common.mjs';

const browser = await launch();

// L'enregistrement local d'une séance, lu dans la page.
const record = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

/** Le bandeau de reprise, s'il est là. */
const notice = (p) =>
  p
    .locator('[data-resume-notice]')
    .innerText({ timeout: 500 })
    .then((text) => text.replace(/\u00A0/g, ' ').trim())
    .catch(() => null);

/**
 * Quitte la séance et recommence depuis l'accueil : le lien, la feuille qui
 * le demande, puis l'ouverture et son décompte.
 */
const startOver = async (p) => {
  await leaveSession(p);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .getByRole('button', { name: 'Recommencer depuis le début' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  await p
    .getByRole('dialog', { name: 'Recommencer la séance ?' })
    .getByRole('button', { name: 'Recommencer', exact: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  await p
    .getByRole('button', { name: /C'est parti/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  await skipCountdown(p);
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
    // Un mouvement qui n'a jamais porté de charge n'affiche pas de champ,
    // seulement « Noter une charge » : on le demande d'abord.
    const ask = p.getByRole('button', { name: 'Noter une charge' });
    if (await ask.count()) {
      await ask.click({ timeout: 3000 }).catch(() => {});
      await settle(p);
    }
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(20 + i));
      await settle(p);
    }
    await p
      .getByRole('button', {
        name: /^(Fait|Série faite|Palier fait)$/,
      })
      .click({ timeout: 3000 })
      .catch(() => {});
    await settle(p);
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
    .inputValue({ timeout: 2000 })
    .catch(() => '');
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
    if (await p.getByRole('button', { name: /^Ajouter un tour/ }).count())
      break;
    await advance(p);
    await skipRest(p);
  }
  // Le rond ne compte qu'une fois l'horloge lancée : rien ne part sans un
  // geste, pas plus dans un AMRAP qu'ailleurs.
  await launchClock(p);
  const plus = p.getByRole('button', { name: /^Ajouter un tour/ });
  for (let i = 0; i < 6; i++) {
    await plus.click({ timeout: 3000 }).catch(() => {});
    await settle(p);
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
    /^Bloc 1 sur 3 · exercice 1 sur 2/.test(await where(p)),
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
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  await skipRest(p);
  await startOver(p);

  await leaveSession(p);
  const label = await p
    .getByRole('button', { name: START })
    .innerText({ timeout: 2000 })
    .catch(() => '(absent)');
  await p
    .getByRole('button', { name: START })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const opening = await p.getByRole('button', { name: /C'est parti/ }).count();
  ok(
    'on ne propose plus de reprendre une séance remise à zéro',
    label.trim() === 'Démarrer' && opening === 1 && (await notice(p)) === null,
    `« ${label.trim()} », ${opening} ouverture`
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
  await settle(p);
  await p
    .getByRole('button', { name: START })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    "une séance rangée à l'ancien format reprend où elle en était",
    (await notice(p)) === 'Reprise au bloc 1' &&
      (await p.getByRole('button', { name: /C'est parti/ }).count()) === 0,
    (await notice(p)) ?? '(aucun bandeau)'
  );
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
  await p
    .getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const migrated = await record(p, 'sess3');
  ok(
    '  → à la première écriture, il passe au nouveau format',
    migrated.version === 2,
    `version ${migrated.version}`
  );
  ok(
    "  → en gardant ce qu'il portait",
    migrated.done?.length === 3 &&
      migrated.performed?.['1:1']?.sets?.[0]?.weight === 37,
    `${migrated.done?.length} faits, ${JSON.stringify(migrated.performed?.['1:1'])}`
  );
  await ctx.close();
}

// ── Reprendre depuis la fiche, sans question ────────────────────────────
//
// « Reprendre » sur la fiche ouvrait une question — « Reprendre où tu en
// étais ? » — à qui venait de répondre. On arrive maintenant sur la série,
// et le haut le dit trois secondes.
{
  console.log('\n── « Reprendre » mène droit à la série');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess3');
  for (let i = 0; i < 2; i++) {
    await p
      .getByRole('button', { name: /^(Fait|Série faite|Palier fait)$/ })
      .click({ timeout: 3000 })
      .catch(() => {});
    await settle(p);
    await skipRest(p);
  }
  await leaveSession(p);
  await p
    .getByRole('button', { name: START })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const screen = await guidedScreen(p);
  ok(
    '« Reprendre » mène droit à la série, sans ouverture ni question',
    /2 sur 4 faits/.test(screen) &&
      (await p.getByRole('button', { name: /C'est parti/ }).count()) === 0 &&
      (await p.getByRole('dialog', { name: /Reprendre où/ }).count()) === 0,
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '→ le haut dit « Reprise au bloc 1 »',
    (await notice(p)) === 'Reprise au bloc 1',
    (await notice(p)) ?? '(aucun bandeau)'
  );
  await p.clock.runFor(3_100);
  await settle(p);
  ok(
    '→ trois secondes, puis le bandeau s’efface',
    (await notice(p)) === null,
    (await notice(p)) ?? ''
  );
  ok(
    '→ et la séance n’a pas bougé',
    /2 sur 4 faits/.test(await guidedScreen(p))
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
