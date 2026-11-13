/**
 * Les fondations du nouveau design : deux polices, servies par l'application,
 * et plus aucune police de code.
 *
 * Rien de cela ne se lit dans le code. Une famille déclarée dans le thème
 * mais dont le fichier n'arrive pas donne une page qui compile, qui passe
 * `typecheck`, et qui s'affiche dans la police du système : seul un
 * navigateur sait quelle police il a réellement chargée, et laquelle il a
 * posée sur un texte.
 *
 * Trois promesses, donc trois groupes d'assertions :
 *
 * 1. les deux polices sont chargées, et chacune est posée là où le thème
 *    l'annonce — le texte courant pour l'une, les titres pour l'autre ;
 * 2. aucune police ni aucune feuille de style ne vient d'ailleurs : une
 *    police chargée chez un tiers lui transmet l'adresse du visiteur, et ne
 *    s'affiche pas sans réseau ;
 * 3. plus rien ne s'écrit en chasse fixe. Les doses l'étaient toutes, ce qui
 *    donnait à un programme de sport l'allure d'un fichier de configuration.
 *    On lit le style calculé et non le code : un composant qui apporterait sa
 *    propre police de code passerait à travers une recherche de texte.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const BODY_FONT = 'Figtree Variable';
const HEADING_FONT = 'Bricolage Grotesque Variable';

/**
 * Une famille est-elle réellement chargée ?
 *
 * On lit l'état de chaque `FontFace` plutôt que d'appeler
 * `document.fonts.check()` : celui-ci répond « oui » pour une famille que
 * personne n'a déclarée, puisqu'il n'y a alors rien à attendre. L'assertion
 * serait restée verte une fois l'import retiré.
 */
const loaded = (p, family) =>
  p.evaluate(async (wanted) => {
    await document.fonts.ready;
    return [...document.fonts].some(
      (face) =>
        face.family.replace(/["']/g, '') === wanted && face.status === 'loaded'
    );
  }, family);

/** La première famille de la pile calculée d'un élément : celle que le
 * navigateur essaie d'abord. */
const firstFamily = (p, selector) =>
  p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return '';
    return getComputedStyle(el)
      .fontFamily.split(',')[0]
      .replace(/["']/g, '')
      .trim();
  }, selector);

/**
 * Les textes visibles d'une page, et ceux qui s'écrivent en chasse fixe.
 *
 * Un élément compte s'il porte lui-même du texte — pas seulement par ses
 * enfants — ou si c'est un champ de saisie : la charge se tapait elle aussi
 * en police de code.
 */
const readFonts = (p) =>
  p.evaluate(() => {
    const MONO = /mono|menlo|consolas|courier/i;
    let read = 0;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('script, style, noscript')) continue;
      if (el.getClientRects().length === 0) continue;
      const isField = el.matches('input, textarea');
      const ownText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ''
      );
      if (!ownText && !isField) continue;
      read++;
      if (MONO.test(getComputedStyle(el).fontFamily)) {
        offenders.push(
          (isField ? el.getAttribute('aria-label') : el.textContent)
            ?.trim()
            .slice(0, 24) ?? ''
        );
      }
    }
    return { read, offenders };
  });

/**
 * L'assertion d'une page : elle a été lue, et rien n'y est en chasse fixe.
 *
 * Le plancher de dix textes n'est pas décoratif. Une page qui ne s'affiche
 * pas ne porte aucune police de code, et l'assertion la déclarerait
 * conforme : c'est ce que le plancher refuse.
 */
const noCodeFont = async (p, label) => {
  const { read, offenders } = await readFonts(p);
  ok(
    `aucune police de code (${label})`,
    read >= 10 && offenders.length === 0,
    offenders.length > 0
      ? `en chasse fixe : ${offenders.slice(0, 4).join(' · ')}`
      : `${read} textes lus`
  );
};

const browser = await launch();

{
  console.log('\n── les deux polices sont chargées et posées');
  const ctx = await browser.newContext(MOBILE);

  // Tout ce que la page demande, relevé avant la première navigation : une
  // police tierce se demande au chargement, pas après.
  const requested = [];
  ctx.on('request', (r) => {
    if (['font', 'stylesheet'].includes(r.resourceType())) {
      requested.push({ type: r.resourceType(), url: r.url() });
    }
  });

  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  ok('la police de texte est chargée', await loaded(p, BODY_FONT));
  ok('la police de titre est chargée', await loaded(p, HEADING_FONT));

  const bodyFamily = await firstFamily(p, 'body');
  ok(
    'le texte courant est dans la police de texte',
    bodyFamily === BODY_FONT,
    bodyFamily
  );
  const headingFamily = await firstFamily(p, 'h1, h2, h3');
  ok(
    'un titre est dans la police de titre',
    headingFamily === HEADING_FONT,
    headingFamily
  );

  console.log("\n── rien ne vient d'ailleurs");
  const fonts = requested.filter((r) => r.type === 'font');
  ok(
    "des polices ont bien été demandées à l'application",
    fonts.length >= 1 && fonts.every((r) => r.url.startsWith(BASE)),
    `${fonts.length} demandées`
  );
  const foreign = requested.filter((r) => !r.url.startsWith(BASE));
  ok(
    'aucune police ni feuille de style demandée à un tiers',
    foreign.length === 0,
    foreign.map((r) => new URL(r.url).host).join(' · ')
  );

  console.log('\n── plus rien en chasse fixe, côté client');
  await noCodeFont(p, "l'accueil");

  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await noCodeFont(p, 'le programme');

  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await noCodeFont(p, "l'historique");

  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await noCodeFont(p, 'le compte');

  await p.goto(`${BASE}/client/session/sess2`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await noCodeFont(p, 'la fiche de séance');

  // La séance guidée portait le plus de chasse fixe : chaque dose, chaque
  // chrono, et le champ où se tape la charge.
  await start(p, 'sess2');
  await noCodeFont(p, 'la séance guidée, premier bloc');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await noCodeFont(p, 'la séance guidée, saisie des charges');

  await ctx.close();
}

{
  console.log('\n── plus rien en chasse fixe, côté coach');
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const p = await signIn(ctx);

  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await noCodeFont(p, 'les clients');

  await p.goto(`${BASE}/coach/clients/${CLIENT}`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1800);
  await noCodeFont(p, "l'atelier");

  await p.goto(`${BASE}/coach/clients/${CLIENT}/journal`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1500);
  await noCodeFont(p, 'les ressentis');

  await p.goto(`${BASE}/coach/exercises`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await noCodeFont(p, 'les exercices');

  await p.goto(`${BASE}/confidentialite`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await noCodeFont(p, 'la politique de confidentialité');

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
