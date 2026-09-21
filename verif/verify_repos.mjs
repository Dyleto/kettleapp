/**
 * Le repos entre deux séries, posé dans la liste.
 *
 * Il occupait tout l'écran : on cochait « Fait », et le bloc qu'on était en
 * train de lire disparaissait derrière un mur de teal. Retour du terrain :
 * « pas agréable d'avoir d'un coup une full page REPOS ».
 *
 * Un repos n'est pas un événement, c'est un intervalle entre deux séries —
 * et il appartient à l'endroit où cet intervalle se trouve.
 */
import {
  lancer,
  MOBILE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  ecranGuide,
} from './commun.mjs';

const browser = await lancer();

/** Mène jusqu'au bloc classique de la séance 2 et coche la première série. */
const cocherUneSerie = async (p) => {
  await demarrer(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .fill('26');
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
};

// ── Le repos ne cache plus le bloc ───────────────────────────────────────
{
  console.log('\n── le repos se pose dans la liste, il ne la couvre plus');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherUneSerie(p);

  const ecran = await ecranGuide(p);
  const lignes = ecran.split('\n').filter(Boolean);

  const bande = await p
    .getByRole('button', { name: 'Passer', exact: true })
    .count();
  ok(
    'une bande de repos apparaît dans la liste',
    bande === 1,
    `${bande} bande(s)`
  );
  ok(
    '  → avec ce qui vient après',
    /ensuite Goblet Squat/i.test(ecran),
    (lignes.find((l) => /ensuite/i.test(l)) ?? '(rien)').slice(0, 60)
  );

  // Le cœur du sujet : tout le bloc reste lisible pendant le repos.
  // `innerText` lit aussi ce qui est caché derrière un panneau : il faut
  // demander au navigateur ce qu'on toucherait réellement à cet endroit.
  const vraimentVisible = await p.evaluate(() => {
    const racine = document.querySelector('[aria-label="Séance guidée"]');
    const cible = [...racine.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /Fentes marchées/.test(e.textContent)
    );
    if (!cible) return { trouve: false };
    const r = cible.getBoundingClientRect();
    const dessus = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
    return {
      trouve: true,
      couvert: dessus !== cible && !cible.contains(dessus),
    };
  });
  ok(
    'le bloc reste entièrement lisible pendant le repos',
    vraimentVisible.trouve && !vraimentVisible.couvert,
    JSON.stringify(vraimentVisible)
  );
  ok(
    '  → et ses dernières lignes aussi',
    /Fentes marchées/.test(ecran) && /série 4 \/ 4/.test(ecran),
    lignes.filter((l) => /Fentes/.test(l)).length + ' ligne(s) de fentes'
  );
  ok(
    '  → y compris l’en-tête du bloc et son avancement',
    /CLASSIQUE/.test(ecran) && /1 sur 7 faits/.test(ecran),
    lignes.find((l) => /faits dans ce bloc/.test(l)) ?? '(rien)'
  );

  // Il se pose entre la série cochée et celle qui suit.
  const iFaite = lignes.findIndex((l) => /^26 kg$/.test(l.trim()));
  const iRepos = lignes.findIndex((l) => /REPOS/i.test(l));
  const iSuivante = lignes.findIndex((l) => /série 2 \/ 4/.test(l));
  ok(
    '  → exactement entre la série faite et la suivante',
    iFaite >= 0 && iFaite < iRepos && iRepos < iSuivante,
    `faite ${iFaite}, repos ${iRepos}, suivante ${iSuivante}`
  );

  // Aucun panneau ne recouvre le bloc.
  const recouvre = await p.evaluate(() => {
    const racine = document.querySelector('[aria-label="Séance guidée"]');
    return [...racine.querySelectorAll('div')].some((e) => {
      const st = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return (
        st.position === 'absolute' &&
        r.height > 300 &&
        /repos/i.test(e.innerText || '')
      );
    });
  });
  ok('  → et rien ne se superpose au bloc', !recouvre);
  await ctx.close();
}

// ── On peut travailler pendant le repos ─────────────────────────────────
//
// C'est ce que l'intégration achète : corriger une charge, relire la dose du
// mouvement suivant, rouvrir une consigne — ce qu'on fait vraiment en
// attendant.
{
  console.log('\n── pendant le repos, la séance reste utilisable');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherUneSerie(p);

  const champ = p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first();
  ok('la série en cours porte toujours son champ', (await champ.count()) > 0);
  await champ.fill('28');
  await p.waitForTimeout(300);
  ok(
    '  → et on peut y noter une charge sans attendre la fin du repos',
    (await champ.inputValue()) === '28',
    await champ.inputValue()
  );
  ok(
    '  → la bande de repos, elle, court toujours',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 1
  );
  await ctx.close();
}

// ── « Passer » rend la main, sans rien défaire ──────────────────────────
{
  console.log('\n── passer le repos ne défait rien');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await cocherUneSerie(p);
  await p.getByRole('button', { name: 'Passer', exact: true }).click();
  await p.waitForTimeout(400);
  const ecran = await ecranGuide(p);
  ok(
    'la bande de repos disparaît',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  ok(
    '  → la série cochée le reste',
    /1 sur 7 faits/.test(ecran),
    (ecran.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok('  → et la charge notée est toujours là', /26 kg/.test(ecran));
  await ctx.close();
}

// ── Pas de repos là où le coach n'en a pas prescrit ─────────────────────
{
  console.log('\n── aucun repos inventé après le dernier exercice');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  // Le chipper de la séance 3 ne prescrit aucun repos entre ses mouvements.
  await demarrer(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
  ok(
    'un bloc sans repos prescrit n’affiche aucune bande',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
