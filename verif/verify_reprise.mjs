/**
 * Reprendre, ou recommencer.
 *
 * Quitter le mode guidé n'efface rien : on retrouve sa place et ses charges
 * en revenant. Pour repartir de zéro, l'écran de reprise le propose — et
 * « recommencer » doit alors vraiment tout remettre à zéro.
 *
 * La suite précédente vérifiait que les charges survivent à « recommencer »
 * — ce qui doit persister — sans jamais vérifier ce qui doit se remettre à
 * zéro. C'est exactement par là que le défaut est passé.
 */
import {
  lancer,
  MOBILE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  ou,
  ecranGuide,
  passerRepos,
} from './commun.mjs';

const browser = await lancer();

const garde = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

/** Quitte la séance, revient dessus, et clique « Recommencer ». */
const recommencer = async (p, sess) => {
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Recommencer depuis le début/ }).click();
  await p.waitForTimeout(800);
};

// ── Un bloc-liste : le cas où « recommencer » ne faisait rien ────────────
//
// Un chipper est une étape unique. Remettre l'étape à zéro ne changeait donc
// rien, et les mouvements cochés restaient cochés.
{
  console.log('\n── recommencer décoche ce qui avait été coché');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess3');
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
    await passerRepos(p);
  }
  const avant = await garde(p, 'sess3');
  ok(
    'trois mouvements sont cochés avant de quitter',
    avant.faits.length === 3,
    JSON.stringify(avant.faits)
  );

  await recommencer(p, 'sess3');
  const apres = await garde(p, 'sess3');
  ok(
    'après « recommencer », plus rien n’est coché',
    apres.faits.length === 0,
    JSON.stringify(apres.faits)
  );

  const ecran = await ecranGuide(p);
  ok(
    '  → et le bloc le dit : zéro sur quatre',
    /0 sur 4 faits/.test(ecran),
    (ecran.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → le curseur est revenu au premier mouvement',
    /Burpee[\s\S]{0,40}21 reps/.test(ecran),
    ecran.split('\n').filter(Boolean).slice(2, 5).join(' · ')
  );

  // Les charges, elles, restent : c'est la partie délibérée.
  ok(
    '  → mais les charges notées sont toujours là',
    Object.keys(apres.performed).length === 3,
    JSON.stringify(Object.keys(apres.performed))
  );
  const valeur = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .inputValue();
  ok(
    '  → et la première se relit dans son champ',
    valeur === '20',
    valeur || '(vide)'
  );
  await ctx.close();
}

// ── Une boucle : le compteur de tours repart aussi ───────────────────────
{
  console.log('\n── recommencer remet le compteur de tours à zéro');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(160);
    await passerRepos(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  const plus = p.getByRole('button', { name: /^\+1 tour$/ });
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(120);
  }
  const avant = await garde(p, 'sess1');
  ok(
    'six tours sont comptés, et l’étape a avancé',
    avant.tours['3'] === 6 && avant.etape > 0,
    `étape ${avant.etape}, tours ${JSON.stringify(avant.tours)}`
  );

  await recommencer(p, 'sess1');
  const apres = await garde(p, 'sess1');
  ok(
    'après « recommencer », tout est à zéro',
    apres.etape === 0 &&
      apres.faits.length === 0 &&
      Object.keys(apres.tours).length === 0,
    `étape ${apres.etape}, faits ${apres.faits.length}, tours ${JSON.stringify(apres.tours)}`
  );
  ok(
    '  → et la barre d’avancement le dit',
    /Étape 1 sur/.test(await ou(p)),
    await ou(p)
  );
  await ctx.close();
}

// ── Et l'on repart vraiment propre ───────────────────────────────────────
//
// « Recommencé » puis quitté, revenir proposait encore de reprendre : la
// séance se croyait commencée parce qu'elle comptait des efforts cochés.
{
  console.log('\n── après avoir recommencé, on repart d’une séance neuve');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(300);
  await passerRepos(p);
  await recommencer(p, 'sess3');

  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const plein = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return d[d.length - 1]?.innerText ?? '';
  });
  ok(
    'on ne propose plus de reprendre une séance remise à zéro',
    !/Reprendre où tu en étais/i.test(plein),
    plein.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
