/**
 * Le ressenti, sur un téléphone tenu droit.
 *
 * Retour du terrain, du temps où c'était une boîte de dialogue : « la
 * modale est un poil trop petite, et quand on clique pour mettre une autre
 * date il y a un petit scroll, c'est dommage. » C'est maintenant un écran
 * entier, et ce que la plainte visait se vérifie toujours : déplier la date
 * ne fait rien sauter sous le pouce.
 *
 * Un envoi manqué fermait la boîte avant la réponse, puis un toast disait
 * « Erreur » sur un écran où le ressenti avait disparu. L'écran reste, dit
 * ce qui est sauf, et réessaie d'une touche : c'est ce que vérifie la
 * deuxième partie, en refusant l'envoi une fois.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
  clean,
  settle,
} from './common.mjs';

const browser = await launch();

/** Termine le chipper de la séance 3 et ouvre le ressenti. */
const finishSess3 = async (p) => {
  await start(p, 'sess3');
  for (let i = 0; i < 4; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(10 + i));
      await settle(p);
    }
    const done = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await done.count())) break;
    await done.click();
    await settle(p);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await settle(p);
  // L'écran de fin vient d'abord ; le ressenti, que cette suite éprouve,
  // suit « Continuer ».
  await p.getByRole('button', { name: 'Continuer', exact: true }).click();
  await settle(p);
};

const SEND = /^(Envoyer à Julie|Réessayer)$/;

/** L'écran du ressenti : sa place, et la hauteur de ce qui y défile. */
const measure = (p) =>
  p.evaluate(() => {
    const scene = document.querySelector(
      '[role="dialog"][aria-label="Le ressenti"]'
    );
    if (!scene) return null;
    const body = scene.querySelector('[data-feeling-body]');
    const r = scene.getBoundingClientRect();
    return {
      screen: window.innerHeight,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      content: body?.scrollHeight ?? null,
    };
  });

const sendBox = (p) =>
  p.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((e) =>
      /^(Envoyer à Julie|Réessayer)$/.test(e.innerText.trim())
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      text: el.innerText.trim(),
      disabled: el.disabled,
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  });

const progressKept = (p) =>
  p.evaluate(() => localStorage.getItem('kettle-seance-sess3') !== null);

// ── Un écran entier, et la date qui ne fait rien sauter ─────────────────
{
  console.log('\n── le ressenti, et la date qui se déplie sans rien déplacer');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);

  const before = await measure(p);
  ok(
    'le ressenti prend tout l’écran',
    before && before.top === 0 && before.bottom === before.screen,
    before
      ? `${before.top} → ${before.bottom} sur ${before.screen}`
      : '(absent)'
  );
  const send = await sendBox(p);
  ok(
    "« Envoyer à Julie » est entier et dans l'écran",
    send && send.belowFold === 0 && send.aboveFold === 0,
    JSON.stringify(send)
  );
  ok(
    '  → et attend un visage : rien n’est choisi d’avance',
    send?.disabled === true,
    JSON.stringify(send)
  );

  await p.getByRole('button', { name: /Ce n.était pas aujourd/ }).click();
  await settle(p);
  const after = await measure(p);
  ok(
    'le corps fait exactement la même hauteur une fois la date ouverte',
    before && after && after.content === before.content,
    `${before?.content} → ${after?.content}`
  );
  // Le sélecteur de date de Chakra rend un champ de texte et non un
  // `type="date"` : on le trouve par le nom sous lequel il est annoncé.
  const field = p.getByRole('textbox', {
    name: 'Date de réalisation de la séance',
  });
  ok(
    "  → le champ s'est ouvert, sur la date du jour",
    (await field.count()) === 1 &&
      /\d{2}\/\d{2}\/\d{4}/.test(await field.inputValue()),
    (await field.count()) ? await field.inputValue() : '(absent)'
  );
  await ctx.close();
}

// ── Un envoi manqué ne perd rien ────────────────────────────────────────
{
  console.log("\n── l'envoi échoue une fois : on reste, et on réessaie");
  const ctx = await browser.newContext(MOBILE);
  let refuse = true;
  await ctx.route(/\/api\/client\/sessions\/[^/]+\/complete$/, (r) =>
    refuse
      ? r.fulfill({ status: 500, json: { message: 'panne' } })
      : r.fallback()
  );
  const p = await signIn(ctx);
  await finishSess3(p);
  await p.getByRole('radio', { name: /Juste/ }).click();
  await settle(p);
  await p.getByRole('button', { name: SEND }).click();
  // Une mutation est reprise deux fois avant d'échouer : on attend ce que
  // l'écran dit, pas un délai choisi au hasard.
  await p
    .getByRole('alert')
    .waitFor({ timeout: 8000 })
    .catch(() => {});

  const said = clean(
    await p
      .getByRole('alert')
      .innerText()
      .catch(() => '')
  );
  ok(
    "l'écran reste, et dit que l'envoi n'est pas parti",
    /L’envoi n’est pas parti/.test(said) &&
      (await p.locator('[role="dialog"][aria-label="Le ressenti"]').count()) ===
        1,
    said || '(rien)'
  );
  ok(
    '  → et ce qui est sauf : rien n’est perdu',
    /rien n’est perdu/.test(said) && (await progressKept(p))
  );
  const retry = await sendBox(p);
  ok(
    '  → le bouton redevient actif : « Réessayer »',
    retry?.text === 'Réessayer' && retry.disabled === false,
    JSON.stringify(retry)
  );
  ok(
    '  → le visage choisi est toujours là',
    (await p
      .getByRole('radio', { name: /Juste/ })
      .getAttribute('aria-checked')) === 'true'
  );

  refuse = false;
  await p.getByRole('button', { name: SEND }).click();
  await settle(p);
  ok(
    'la seconde fois, il part : la semaine, et la séance effacée du téléphone',
    (await p.locator('[role="dialog"][aria-label="Ta semaine"]').count()) ===
      1 && !(await progressKept(p)),
    (await p
      .locator('[role="dialog"]')
      .getAttribute('aria-label')
      .catch(() => null)) ?? '(aucun écran)'
  );
  await ctx.close();
}

// ── Quitter sans envoyer garde la séance ────────────────────────────────
{
  console.log('\n── quitter sans envoyer');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);
  await p.getByRole('button', { name: 'Quitter sans envoyer' }).click();
  await settle(p);
  ok(
    'la croix referme le ressenti sans rien envoyer',
    (await p.locator('[role="dialog"]').count()) === 0 &&
      (await progressKept(p))
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
