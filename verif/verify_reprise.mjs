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
  BASE,
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
    avant.done.length === 3,
    JSON.stringify(avant.done)
  );

  await recommencer(p, 'sess3');
  const apres = await garde(p, 'sess3');
  ok(
    'après « recommencer », plus rien n’est coché',
    apres.done.length === 0,
    JSON.stringify(apres.done)
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
    avant.rounds['3'] === 6 && avant.step > 0,
    `étape ${avant.step}, tours ${JSON.stringify(avant.rounds)}`
  );

  await recommencer(p, 'sess1');
  const apres = await garde(p, 'sess1');
  ok(
    'après « recommencer », tout est à zéro',
    apres.step === 0 &&
      apres.done.length === 0 &&
      Object.keys(apres.rounds).length === 0,
    `étape ${apres.step}, faits ${apres.done.length}, tours ${JSON.stringify(apres.rounds)}`
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

// ── Un enregistrement d'avant le passage à l'anglais se relit ───────────
//
// Les champs du stockage local portaient des noms français. Un client en
// pleine séance au moment de la livraison aurait tout perdu : son
// enregistrement est toujours là, mais aucun de ses champs ne répond à son
// nouveau nom.
{
  console.log('\n── une séance commencée avant la livraison se retrouve');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
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
  const plein = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return (d[d.length - 1]?.innerText ?? '').replace(/\u00A0/g, ' ');
  });
  ok(
    'on propose de reprendre une séance enregistrée à l’ancien format',
    /Reprendre où tu en étais/i.test(plein),
    plein.split('\n').filter(Boolean)[0] ?? '(rien)'
  );
  ok(
    '  → et la charge notée avant la livraison est annoncée',
    /charges sur 1 exercice/i.test(plein),
    (plein.match(/[^\n]*charges[^\n]*/) ?? ['(rien)'])[0]
  );

  await p.getByRole('button', { name: /^Reprendre$/ }).click();
  await p.waitForTimeout(800);
  // On reprend au premier exercice non coché : le troisième. Les deux
  // premiers sont derrière, cochés, avec la charge de l'ancien format.
  const ecran = await ecranGuide(p);
  ok(
    '  → on reprend après les deux exercices déjà cochés',
    /2 sur 4 faits/.test(ecran),
    (ecran.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok(
    '  → et la charge de l’ancien format est toujours affichée',
    /37 kg/.test(ecran),
    (ecran.match(/[^\n]*37 kg[^\n]*/) ?? ['(rien)'])[0]
  );

  // La première écriture réécrit l'enregistrement au nouveau format, sans
  // rien perdre de ce qui y était.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  const migre = await garde(p, 'sess3');
  ok(
    '  → à la première écriture, il passe au nouveau format',
    migre.version === 2,
    `version ${migre.version}`
  );
  ok(
    '  → en gardant ce qu’il portait',
    migre.done.length === 3 && migre.performed['1:1'].sets[0].weight === 37,
    `${migre.done.length} faits, ${JSON.stringify(migre.performed['1:1'])}`
  );
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
