/**
 * Le mode guidé, téléphone posé à plat.
 *
 * Un client qui cale son téléphone contre un mur pendant un EMOM le couche.
 * L'écran passe alors de 844 px de haut à 390, et le décor du mode guidé en
 * prenait 186 : trois barres et deux boutons pour la moitié de l'écran.
 * Mesuré avant : 165 px utiles pour 260 px de contenu — un tour d'EMOM dont
 * on ne voyait pas les mouvements.
 *
 * Deux règles tiennent cette suite :
 *   — ce qu'on presse reste entier et dans l'écran ;
 *   — ce qui ne tient pas défile, et rien n'est jamais coupé sans recours.
 */
import {
  launch,
  BASE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
} from './common.mjs';

const browser = await launch();

// iPhone posé à plat (au-delà du seuil `md`, c'est le piège), et un petit
// Android posé à plat.
const LANDSCAPE = {
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
};
const SMALL = {
  viewport: { width: 740, height: 360 },
  isMobile: true,
  hasTouch: true,
};
const PORTRAIT = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/** Ce qu'on voit d'un élément, et ce qui dépasse de l'écran. */
const boxOf = (p, selector) =>
  p.evaluate((sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      w: Math.round(r.width),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, selector);

/** Le bouton principal, mesuré par son nom. */
const buttonBox = (p, pattern) =>
  p.evaluate((m) => {
    const el = [...document.querySelectorAll('button')]
      .filter(
        (e) =>
          e.offsetParent !== null || getComputedStyle(e).position === 'fixed'
      )
      .find((e) => new RegExp(m).test(e.innerText.trim()));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      txt: el.innerText.trim(),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, pattern);

/** Ce que l'écran montre, et ce qu'il y aurait à montrer. */
const viewport = (p) =>
  p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    if (!root) return null;
    const inside = [...root.querySelectorAll('*')].filter((e) => {
      const st = getComputedStyle(e);
      return st.overflowY === 'auto' || st.overflowY === 'scroll';
    });
    const z = inside[inside.length - 1];
    return z
      ? {
          seen: z.clientHeight,
          content: z.scrollHeight,
          scrolls: z.scrollHeight > z.clientHeight,
        }
      : null;
  });

/**
 * Un écran sans barre de défilement qui déborde coupe sans recours.
 *
 * C'est la seule chose qu'on ne peut pas rattraper : un contenu plus haut que
 * sa boîte, et aucun moyen d'atteindre le reste. On descend l'arbre jusqu'au
 * premier coupable et on le nomme.
 */
const cutWithNoRecourse = (p) =>
  p.evaluate(() => {
    const panels = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        e.getBoundingClientRect().height > 100
    );
    const el = panels[panels.length - 1];
    if (!el) return null;
    const cuts = (n) => {
      const st = getComputedStyle(n);
      if (
        n.scrollHeight > n.clientHeight + 1 &&
        st.overflowY !== 'auto' &&
        st.overflowY !== 'scroll'
      )
        return {
          tag: n.tagName,
          content: n.scrollHeight,
          seen: n.clientHeight,
          txt: (n.innerText || '').split('\n')[0].slice(0, 30),
        };
      for (const child of n.children) {
        const r = cuts(child);
        if (r) return r;
      }
      return null;
    };
    return cuts(el);
  });

// ── Les pleins écrans : aucun ne coupe sans barre de défilement ─────────
{
  console.log('\n── paysage : les pleins écrans ne coupent pas en silence');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);

  // 1. L'écran d'ouverture. La séance 2 est le cas qui compte : son coach y
  //    a écrit une note, et c'est elle qui fait déborder l'écran.
  for (const [what, sess] of [
    ['sans la note du coach', 'sess1'],
    ['avec la note du coach', 'sess2'],
  ]) {
    await p.goto(`${BASE}/client/session/${sess}`, {
      waitUntil: 'domcontentloaded',
    });
    await p.waitForTimeout(1700);
    await p.getByRole('button', { name: /Démarrer la séance/ }).click();
    await p.waitForTimeout(900);
    const overflow = await cutWithNoRecourse(p);
    ok(
      `l'écran d'ouverture ne coupe rien sans recours (${what})`,
      overflow === null,
      overflow
        ? `${overflow.tag} : ${overflow.seen} px vus sur ${overflow.content} — « ${overflow.txt} »`
        : ''
    );
    const begin = await buttonBox(p, '^Commencer$');
    ok(
      "  → et « Commencer » est dans l'écran",
      begin && begin.belowFold === 0 && begin.aboveFold === 0,
      begin ? `de ${begin.top} à ${begin.bottom} sur 390` : '(introuvable)'
    );
  }

  // On repart de la séance 1 pour la suite : son premier bloc se coche.
  await p.goto(`${BASE}/client/session/sess1`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(800);
  await p
    .getByRole('button', { name: /^(Commencer|Reprendre)$/ })
    .first()
    .click();
  await p.waitForTimeout(600);

  // 2. Le repos déclenché par « Fait ».
  const kg = p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first();
  if (await kg.count()) {
    await kg.fill('20');
    await p.waitForTimeout(200);
  }
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(500);
  const skip = await buttonBox(p, 'Passer le repos');
  if (skip) {
    ok(
      "le repos garde son bouton entier et dans l'écran",
      skip.belowFold === 0 && skip.aboveFold === 0 && skip.h >= 44,
      `${skip.h} px, bas à ${skip.bottom}`
    );
    await p.getByRole('button', { name: /^Passer le repos$/ }).click();
    await p.waitForTimeout(300);
  } else {
    ok(
      "le repos garde son bouton entier et dans l'écran",
      true,
      '(aucun repos ici)'
    );
  }

  // 3. La confirmation de sortie.
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(500);
  const leaving = await cutWithNoRecourse(p);
  ok(
    'la confirmation de sortie ne coupe rien',
    leaving === null,
    leaving
      ? `${leaving.tag} : ${leaving.seen} px vus sur ${leaving.content} — « ${leaving.txt} »`
      : ''
  );
  const quit = await buttonBox(p, '^Quitter$');
  ok(
    "  → et ses deux réponses sont dans l'écran",
    quit && quit.belowFold === 0 && quit.aboveFold === 0,
    quit ? `bas à ${quit.bottom} sur 390` : '(introuvable)'
  );
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(700);

  // 4. L'écran de reprise.
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const resume = await cutWithNoRecourse(p);
  ok(
    "l'écran de reprise ne coupe rien",
    resume === null,
    resume
      ? `${resume.tag} : ${resume.seen} px vus sur ${resume.content} — « ${resume.txt} »`
      : ''
  );
  const resumeBtn = await buttonBox(p, '^Reprendre$');
  ok(
    "  → « Reprendre » est dans l'écran",
    resumeBtn && resumeBtn.belowFold === 0 && resumeBtn.aboveFold === 0,
    resumeBtn ? `bas à ${resumeBtn.bottom} sur 390` : '(introuvable)'
  );
  await ctx.close();
}

// ── Un tour d'EMOM tient sur un écran posé à plat ───────────────────────
for (const [name, vp] of [
  ['iPhone à plat', LANDSCAPE],
  ['petit Android à plat', SMALL],
]) {
  console.log(`\n── ${name} : le tour d'EMOM`);
  const ctx = await browser.newContext(vp);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await skipRest(p);
  }

  const z = await viewport(p);
  ok(
    "tout le tour tient dans l'écran",
    z && z.content <= z.seen,
    z ? `${z.seen} px vus pour ${z.content} px de contenu` : '(aucune zone)'
  );

  const btn = await buttonBox(p, '^Suivant$');
  ok(
    "  → le bouton principal reste entier et dans l'écran",
    btn && btn.belowFold === 0 && btn.aboveFold === 0 && btn.h >= 44,
    btn
      ? `${btn.h} px de haut, bas à ${btn.bottom} sur ${vp.viewport.height}`
      : '(introuvable)'
  );

  const q = await buttonBox(p, '^Quitter$');
  ok(
    '  → et la sortie reste atteignable',
    q && q.belowFold === 0 && q.aboveFold === 0 && q.h >= 44,
    q ? `${q.h} px, haut à ${q.top}` : '(introuvable)'
  );

  const duplicates = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok(
    "  → une sortie dans l'arbre, pas deux",
    duplicates === 1,
    `${duplicates} bouton(s)`
  );
  await ctx.close();
}

// ── Un bloc en liste : ce qui ne tient pas doit pouvoir défiler ─────────
{
  console.log('\n── paysage : un bloc de sept séries');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  const z = await viewport(p);
  ok(
    "sept séries ne tiennent pas — et c'est la liste qui défile",
    z && (z.content <= z.seen || z.scrolls),
    z ? `${z.seen} px vus pour ${z.content} px` : '(aucune zone)'
  );

  // La série en cours porte le champ de saisie : c'est elle qui doit être
  // visible.
  const field = await boxOf(
    p,
    '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
  );
  ok(
    '  → la série en cours est visible sans défiler',
    field && field.belowFold === 0 && field.aboveFold === 0,
    field ? `de ${field.top} à ${field.bottom} sur 390` : '(aucun champ)'
  );
  const btn = await buttonBox(p, '^Fait$');
  ok(
    '  → et « Fait » reste entier',
    btn && btn.belowFold === 0 && btn.h >= 44,
    btn ? `${btn.h} px, bas à ${btn.bottom}` : '(introuvable)'
  );
  await ctx.close();
}

// ── Le bilan de fin de séance, à plat ───────────────────────────────────
{
  console.log('\n── paysage : le récapitulatif et sa question');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);
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
  const submit = await buttonBox(p, '^Valider$');
  ok(
    "« Valider » reste entier et dans l'écran",
    submit && submit.belowFold === 0 && submit.aboveFold === 0,
    submit ? `de ${submit.top} à ${submit.bottom} sur 390` : '(introuvable)'
  );
  const body = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const b =
      d &&
      [...d.querySelectorAll('*')].find((e) => {
        const st = getComputedStyle(e);
        return st.overflowY === 'auto' || st.overflowY === 'scroll';
      });
    return b ? { seen: b.clientHeight, content: b.scrollHeight } : null;
  });
  ok(
    '  → et le constat reste lisible : le corps défile',
    body && body.seen > 0,
    body
      ? `${body.seen} px vus pour ${body.content} px`
      : '(aucun corps qui défile)'
  );
  await ctx.close();
}

// ── En portrait, rien n'a bougé ─────────────────────────────────────────
{
  console.log('\n── portrait : la maquette validée ne bouge pas');
  const ctx = await browser.newContext(PORTRAIT);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await skipRest(p);
  }
  const measures = await p.evaluate(() => {
    const card = document.querySelector(
      '[aria-label="Séance guidée"]'
    ).firstElementChild;
    const clock = [...card.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && e.children.length === 0
    );
    return {
      heights: [...card.children].map((e) =>
        Math.round(e.getBoundingClientRect().height)
      ),
      size: clock ? getComputedStyle(clock).fontSize : null,
    };
  });
  ok(
    '« Quitter » garde une ligne à lui',
    measures.heights[0] === 76,
    `${measures.heights[0]} px`
  );
  ok(
    "  → et l'horloge ses 72 px",
    measures.size === '72px',
    measures.size ?? '(aucune)'
  );
  const q = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok('  → une sortie ici aussi', q === 1, `${q} bouton(s)`);
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
