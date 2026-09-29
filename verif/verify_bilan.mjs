/**
 * Le bilan de fin de séance, sur un téléphone tenu droit.
 *
 * Retour du terrain : « la modale est un poil trop petite, et quand on clique
 * pour mettre une autre date il y a un petit scroll, c'est dommage. »
 *
 * Mesuré, la plainte portait sur deux choses, et c'est la seconde qui se
 * voit. Le corps débordait déjà de 261 px avant qu'on ne touche à quoi que ce
 * soit — un récapitulatif, une échelle, les étiquettes, un commentaire et une
 * date ne tiennent pas dans 610 px. Mais déplier la date ajoutait ensuite
 * 48 px, et ce qu'on remarque n'est pas une barre de défilement qui était
 * déjà là : c'est tout le bilan qui saute sous le pouce à l'instant précis où
 * on le vise.
 *
 * La rangée garde donc sa hauteur, ouverte ou fermée, et le pied cesse de
 * prendre des lignes au corps — un pied ne défile pas, chaque ligne sur
 * laquelle il se replie est donc une ligne que le corps perd, à chaque
 * séance.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
} from './common.mjs';

const browser = await launch();

/** Termine le chipper de la séance 3 et ouvre le bilan. */
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
      await p.waitForTimeout(150);
    }
    const done = p.getByRole('button', { name: /^Fait$/ });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(250);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1500);
};

/** La boîte, son corps qui défile, et ce qui dépasse de l'écran. */
const measure = (p) =>
  p.evaluate(() => {
    const content = document.querySelector('[role="dialog"]');
    if (!content) return null;
    const body = [...content.querySelectorAll('*')].find((e) => {
      const st = getComputedStyle(e);
      return st.overflowY === 'auto' || st.overflowY === 'scroll';
    });
    const r = content.getBoundingClientRect();
    const cs = getComputedStyle(content);
    return {
      screen: window.innerHeight,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      marginTop: Math.round(parseFloat(cs.marginTop)),
      marginBottom: Math.round(parseFloat(cs.marginBottom)),
      seen: body?.clientHeight ?? null,
      content: body?.scrollHeight ?? null,
    };
  });

/** La géométrie d'un bouton visible, et de combien il sort de l'écran —
 * en haut comme en bas. */
const buttonBox = (p, name) =>
  p.evaluate((n) => {
    const el = [...document.querySelectorAll('button')].find(
      (e) => e.offsetParent !== null && e.innerText.trim() === n
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      h: Math.round(r.height),
      bottom: Math.round(r.bottom),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, name);

// ── Déplier la date ne doit rien déplacer ───────────────────────────────
{
  console.log('\n── mettre une autre date ne coûte aucune hauteur');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);

  const before = await measure(p);
  ok('le bilan est ouvert', before !== null);
  ok(
    "  → et tient dans l'écran",
    before && before.bottom <= before.screen && before.top >= 0,
    before
      ? `${before.top} → ${before.bottom} sur ${before.screen}`
      : '(aucune)'
  );

  // La hauteur doit être ce qu'il reste une fois retirée la marge propre de
  // la boîte, et non une fraction de tout l'écran. `maxH="90dvh"` ignorait
  // 64 px de marge à chaque bout et laissait la boîte dépasser — invisible en
  // portrait, fatal en paysage, où « Valider » sortait de la fenêtre. On
  // vérifie ici que la boîte prend la place qu'elle a sans déborder de sa
  // marge.
  const room = before.screen - before.marginTop - before.marginBottom;
  const used = before.bottom - before.top;
  ok(
    '  → elle remplit la place que sa marge lui laisse, et pas plus',
    used <= room + 1,
    `${used} px occupés pour ${room} px de place ` +
      `(marge ${before.marginTop}/${before.marginBottom})`
  );
  ok(
    '  → et elle prend bien cette place, au lieu de la laisser vide',
    used >= room - 1 || before.content <= before.seen,
    `${used} px occupés pour ${room} px de place`
  );

  await p.getByRole('button', { name: /Ce n.était pas aujourd/ }).click();
  await p.waitForTimeout(500);
  const after = await measure(p);

  // Tout l'enjeu de la correction : le contenu fait la même taille avant et
  // après, donc rien ne bouge sous le pouce.
  ok(
    'le corps fait exactement la même hauteur une fois la date ouverte',
    before && after && after.content === before.content,
    `${before?.content} → ${after?.content}`
  );
  // Le sélecteur de date de Chakra rend un champ de texte et non un
  // `type="date"` : on le trouve par le nom sous lequel il est annoncé, qui
  // est aussi celui qu'emploie un lecteur d'écran.
  const field = p.getByRole('textbox', {
    name: 'Date de réalisation de la séance',
  });
  ok(
    "  → et le champ s'est bien ouvert",
    (await field.count()) === 1,
    `${await field.count()} champ(s)`
  );
  ok(
    '  → portant la date du jour',
    /\d{2}\/\d{2}\/\d{4}/.test(await field.inputValue()),
    await field.inputValue()
  );
  ok(
    "  → la boîte tient toujours dans l'écran",
    after && after.bottom <= after.screen && after.top >= 0,
    after ? `${after.top} → ${after.bottom} sur ${after.screen}` : '(aucune)'
  );
  await ctx.close();
}

// ── Le pied tient sur une rangée, le corps garde sa hauteur ─────────────
{
  console.log('\n── le pied ne prend pas de lignes au corps');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);

  const submit = await buttonBox(p, 'Valider');
  const cancel = await buttonBox(p, 'Annuler');
  ok(
    "« Valider » est entier et dans l'écran",
    submit && submit.belowFold === 0 && submit.aboveFold === 0,
    submit ? `bas à ${submit.bottom}` : '(introuvable)'
  );
  ok(
    "  → « Annuler » partage sa rangée plutôt que d'en prendre une",
    submit && cancel && Math.abs(submit.bottom - cancel.bottom) < 4,
    submit && cancel ? `${cancel.bottom} vs ${submit.bottom}` : '(introuvable)'
  );

  // Rien n'a encore été choisi, l'indication est donc à l'écran. Elle doit
  // tenir sur la rangée des boutons : sur une rangée à elle, elle coûte 30 px
  // au corps, à chaque séance.
  const hint = await p.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /Choisis un cran/.test(e.textContent)
    );
    return el ? Math.round(el.getBoundingClientRect().bottom) : null;
  });
  ok(
    "  → et l'indication la partage aussi",
    hint !== null && submit && Math.abs(hint - submit.bottom) < 24,
    hint === null ? '(aucune indication)' : `${hint} vs ${submit?.bottom}`
  );
  await ctx.close();
}

// ── Ce qui a quitté le pied se dit toujours ─────────────────────────────
{
  console.log('\n── déplacer une phrase ne doit pas la perdre');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);
  const text = await p.evaluate(
    () =>
      document
        .querySelector('[role="dialog"]')
        ?.innerText.replace(/\u00A0/g, ' ') ?? ''
  );
  ok(
    'les charges déjà enregistrées sont toujours annoncées',
    /Tes charges sont déjà enregistrées/.test(text),
    (text.match(/[^\n]*déjà enregistrées[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → et le constat ouvre toujours le bilan',
    /C'est fait\./.test(text),
    text.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
