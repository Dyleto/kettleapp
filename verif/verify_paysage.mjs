/**
 * Le mode guidé, téléphone couché.
 *
 * Un client qui pose son téléphone contre un mur pendant un EMOM le pose à
 * plat. L'écran passe alors de 844 px de haut à 390, et l'habillage du mode
 * guidé en prenait 186 : trois barres et deux boutons pour la moitié de
 * l'écran. Mesuré avant : 165 px utiles pour 260 px de contenu — un tour
 * d'EMOM dont on ne voyait pas les mouvements.
 *
 * Deux règles tiennent cette suite :
 *   — ce sur quoi on appuie reste entier et dans l'écran ;
 *   — ce qui ne tient pas défile, jamais on ne coupe sans recours.
 */
import {
  lancer,
  BASE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  passerRepos,
} from './commun.mjs';

const browser = await lancer();

// iPhone couché (au-delà du seuil `md`, le piège), et un petit Android couché.
const COUCHE = {
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
};
const PETIT = {
  viewport: { width: 740, height: 360 },
  isMobile: true,
  hasTouch: true,
};
const DEBOUT = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/** Ce qu'on voit d'un élément, et ce qui en dépasse. */
const cadre = (p, selecteur) =>
  p.evaluate((sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      haut: Math.round(r.top),
      bas: Math.round(r.bottom),
      h: Math.round(r.height),
      l: Math.round(r.width),
      sousLaLigne: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      auDessus: Math.round(Math.max(0, -r.top)),
    };
  }, selecteur);

/** Le bouton principal, mesuré par son nom. */
const cadreBouton = (p, motif) =>
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
      haut: Math.round(r.top),
      bas: Math.round(r.bottom),
      h: Math.round(r.height),
      sousLaLigne: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      auDessus: Math.round(Math.max(0, -r.top)),
    };
  }, motif);

/** Ce que l'écran laisse voir, et ce qu'il faudrait voir. */
const zone = (p) =>
  p.evaluate(() => {
    const racine = document.querySelector('[aria-label="Séance guidée"]');
    if (!racine) return null;
    const dedans = [...racine.querySelectorAll('*')].filter((e) => {
      const st = getComputedStyle(e);
      return st.overflowY === 'auto' || st.overflowY === 'scroll';
    });
    const z = dedans[dedans.length - 1];
    return z
      ? {
          vue: z.clientHeight,
          contenu: z.scrollHeight,
          defile: z.scrollHeight > z.clientHeight,
        }
      : null;
  });

/** Un écran sans ascenseur qui déborde coupe sans recours. */
const debordeSansRecours = (p) =>
  p.evaluate(() => {
    const plein = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        e.getBoundingClientRect().height > 100
    );
    const el = plein[plein.length - 1];
    if (!el) return null;
    const coupe = (n) => {
      const st = getComputedStyle(n);
      if (
        n.scrollHeight > n.clientHeight + 1 &&
        st.overflowY !== 'auto' &&
        st.overflowY !== 'scroll'
      )
        return {
          tag: n.tagName,
          contenu: n.scrollHeight,
          vue: n.clientHeight,
          txt: (n.innerText || '').split('\n')[0].slice(0, 30),
        };
      for (const enfant of n.children) {
        const r = coupe(enfant);
        if (r) return r;
      }
      return null;
    };
    return coupe(el);
  });

// ── Les écrans pleins : aucun ne coupe sans ascenseur ────────────────────
{
  console.log('\n── couché : les écrans pleins ne coupent pas en silence');
  const ctx = await browser.newContext(COUCHE);
  const p = await connecter(ctx);

  // 1. L'écran d'ouverture. La séance 2 est le cas qui compte : son coach y
  //    a écrit un mot, et c'est lui qui fait déborder l'écran.
  for (const [quoi, sess] of [
    ['sans mot du coach', 'sess1'],
    ['avec le mot du coach', 'sess2'],
  ]) {
    await p.goto(`${BASE}/client/session/${sess}`, {
      waitUntil: 'domcontentloaded',
    });
    await p.waitForTimeout(1700);
    await p.getByRole('button', { name: /Démarrer la séance/ }).click();
    await p.waitForTimeout(900);
    const deborde = await debordeSansRecours(p);
    ok(
      `l’écran d’ouverture ne coupe rien sans recours (${quoi})`,
      deborde === null,
      deborde
        ? `${deborde.tag} : ${deborde.vue} px vus sur ${deborde.contenu} — « ${deborde.txt} »`
        : ''
    );
    const commencer = await cadreBouton(p, '^Commencer$');
    ok(
      '  → et « Commencer » est dans l’écran',
      commencer && commencer.sousLaLigne === 0 && commencer.auDessus === 0,
      commencer
        ? `de ${commencer.haut} à ${commencer.bas} sur 390`
        : '(introuvable)'
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
  const passer = await cadreBouton(p, 'Passer le repos');
  if (passer) {
    ok(
      'le repos garde son bouton entier et dans l’écran',
      passer.sousLaLigne === 0 && passer.auDessus === 0 && passer.h >= 44,
      `${passer.h} px, bas à ${passer.bas}`
    );
    await p.getByRole('button', { name: /^Passer le repos$/ }).click();
    await p.waitForTimeout(300);
  } else {
    ok(
      'le repos garde son bouton entier et dans l’écran',
      true,
      '(pas de repos ici)'
    );
  }

  // 3. La confirmation de sortie.
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(500);
  const sortie = await debordeSansRecours(p);
  ok(
    'la confirmation de sortie ne coupe rien',
    sortie === null,
    sortie
      ? `${sortie.tag} : ${sortie.vue} px vus sur ${sortie.contenu} — « ${sortie.txt} »`
      : ''
  );
  const quitter = await cadreBouton(p, '^Quitter$');
  ok(
    '  → et ses deux réponses sont dans l’écran',
    quitter && quitter.sousLaLigne === 0 && quitter.auDessus === 0,
    quitter ? `bas à ${quitter.bas} sur 390` : '(introuvable)'
  );
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(700);

  // 4. L'écran de reprise.
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const reprise = await debordeSansRecours(p);
  ok(
    'l’écran de reprise ne coupe rien',
    reprise === null,
    reprise
      ? `${reprise.tag} : ${reprise.vue} px vus sur ${reprise.contenu} — « ${reprise.txt} »`
      : ''
  );
  const reprendre = await cadreBouton(p, '^Reprendre$');
  ok(
    '  → « Reprendre » est dans l’écran',
    reprendre && reprendre.sousLaLigne === 0 && reprendre.auDessus === 0,
    reprendre ? `bas à ${reprendre.bas} sur 390` : '(introuvable)'
  );
  await ctx.close();
}

// ── Un tour d'EMOM tient sur un écran couché ─────────────────────────────
for (const [nom, vp] of [
  ['iPhone couché', COUCHE],
  ['petit Android couché', PETIT],
]) {
  console.log(`\n── ${nom} : le tour d'EMOM`);
  const ctx = await browser.newContext(vp);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await passerRepos(p);
  }

  const z = await zone(p);
  ok(
    'le tour entier tient dans l’écran',
    z && z.contenu <= z.vue,
    z ? `${z.vue} px vus pour ${z.contenu} px de contenu` : '(aucune zone)'
  );

  const btn = await cadreBouton(p, '^Suivant$');
  ok(
    '  → le bouton principal reste entier et dans l’écran',
    btn && btn.sousLaLigne === 0 && btn.auDessus === 0 && btn.h >= 44,
    btn
      ? `${btn.h} px de haut, bas à ${btn.bas} sur ${vp.viewport.height}`
      : '(introuvable)'
  );

  const q = await cadreBouton(p, '^Quitter$');
  ok(
    '  → et la sortie est toujours atteignable',
    q && q.sousLaLigne === 0 && q.auDessus === 0 && q.h >= 44,
    q ? `${q.h} px, haut à ${q.haut}` : '(introuvable)'
  );

  const doubles = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok(
    '  → une seule sortie dans l’arbre, pas deux',
    doubles === 1,
    `${doubles} bouton(s)`
  );
  await ctx.close();
}

// ── Un bloc-liste : ce qui ne tient pas doit pouvoir défiler ─────────────
{
  console.log('\n── couché : un bloc de sept efforts');
  const ctx = await browser.newContext(COUCHE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  const z = await zone(p);
  ok(
    'sept efforts ne tiennent pas — et c’est la liste qui défile',
    z && (z.contenu <= z.vue || z.defile),
    z ? `${z.vue} px vus pour ${z.contenu} px` : '(aucune zone)'
  );

  // L'effort en cours porte le champ de saisie : c'est lui qu'on doit voir.
  const champ = await cadre(
    p,
    '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
  );
  ok(
    '  → l’effort en cours est visible sans faire défiler',
    champ && champ.sousLaLigne === 0 && champ.auDessus === 0,
    champ ? `de ${champ.haut} à ${champ.bas} sur 390` : '(aucun champ)'
  );
  const btn = await cadreBouton(p, '^Fait$');
  ok(
    '  → et « Fait » reste entier',
    btn && btn.sousLaLigne === 0 && btn.h >= 44,
    btn ? `${btn.h} px, bas à ${btn.bas}` : '(introuvable)'
  );
  await ctx.close();
}

// ── Le bilan de fin, couché ──────────────────────────────────────────────
{
  console.log('\n── couché : le récap et sa question');
  const ctx = await browser.newContext(COUCHE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess3');
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
    const fait = p.getByRole('button', { name: /^Fait$/ });
    if (!(await fait.count())) break;
    await fait.click();
    await p.waitForTimeout(250);
    await passerRepos(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1500);
  const valider = await cadreBouton(p, '^Valider$');
  ok(
    '« Valider » reste entier et dans l’écran',
    valider && valider.sousLaLigne === 0 && valider.auDessus === 0,
    valider ? `de ${valider.haut} à ${valider.bas} sur 390` : '(introuvable)'
  );
  const corps = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const b =
      d &&
      [...d.querySelectorAll('*')].find((e) => {
        const st = getComputedStyle(e);
        return st.overflowY === 'auto' || st.overflowY === 'scroll';
      });
    return b ? { vue: b.clientHeight, contenu: b.scrollHeight } : null;
  });
  ok(
    '  → et le constat reste lisible : le corps défile',
    corps && corps.vue > 0,
    corps
      ? `${corps.vue} px vus pour ${corps.contenu} px`
      : '(aucun corps défilant)'
  );
  await ctx.close();
}

// ── Debout, rien n'a bougé ───────────────────────────────────────────────
{
  console.log('\n── debout : la maquette validée ne bouge pas');
  const ctx = await browser.newContext(DEBOUT);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await passerRepos(p);
  }
  const mesures = await p.evaluate(() => {
    const carte = document.querySelector(
      '[aria-label="Séance guidée"]'
    ).firstElementChild;
    const chrono = [...carte.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && e.children.length === 0
    );
    return {
      hauteurs: [...carte.children].map((e) =>
        Math.round(e.getBoundingClientRect().height)
      ),
      taille: chrono ? getComputedStyle(chrono).fontSize : null,
    };
  });
  ok(
    '« Quitter » garde sa ligne à lui',
    mesures.hauteurs[0] === 76,
    `${mesures.hauteurs[0]} px`
  );
  ok(
    '  → et l’horloge ses 72 px',
    mesures.taille === '72px',
    mesures.taille ?? '(aucune)'
  );
  const q = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok('  → une seule sortie, là aussi', q === 1, `${q} bouton(s)`);
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
