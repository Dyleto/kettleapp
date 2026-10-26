/**
 * Une pyramide à plusieurs mouvements monte-elle palier par palier ?
 *
 * Retour du terrain : « le Pyramide ne fonctionne pas comme espéré, il marche
 * que pour 1 exo et pas plusieurs ».
 *
 * Elle déroulait toute la pyramide du premier exercice, puis toute celle du
 * second : sur `5·10·15` avec Pompes et Planche, cela donnait 5-10-15 pompes
 * puis 5-10-15 planches. Ce qu'un coach écrit là est 5 pompes + 5 planches,
 * puis 10 + 10, puis 15 + 15 — c'est le principe du format. Et c'est pour
 * cela qu'il semblait ne marcher qu'à un seul mouvement : à un seul, les deux
 * ordres coïncident, et le décor du banc n'avait qu'une pyramide à un
 * exercice.
 *
 * Le repos appartient à la fin du palier et non à la fin de chaque exercice :
 * il n'y a rien à récupérer entre deux mouvements du même palier, c'est
 * justement ce qui les enchaîne.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  clean,
} from './common.mjs';

const browser = await launch();

/** Les mouvements de la liste, dans l'ordre où l'écran les pose. */
const orderOnScreen = (p) =>
  p.evaluate(() => {
    const screen = document.querySelector('[aria-label="Séance guidée"]');
    if (!screen) return [];
    return [...screen.querySelectorAll('*')]
      .filter((el) => el.children.length === 0)
      .map((el) => (el.textContent ?? '').trim())
      .filter((t) => t === 'Pompes' || t === 'Planche');
  });

{
  console.log('\n── la pyramide alterne ses mouvements à chaque palier');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess6');

  const order = await orderOnScreen(p);
  ok(
    'les deux mouvements alternent au lieu de se suivre',
    order.join(' ') === 'Pompes Planche Pompes Planche Pompes Planche',
    order.join(' ') || '(rien lu)'
  );

  // Les doses doivent monter par palier, pas redescendre à 5 au milieu de la
  // liste — ce que l'ancien ordre faisait en repartant sur le second
  // exercice.
  const doses = clean(
    await p
      .locator('[aria-label="Séance guidée"]')
      .innerText()
      .catch(() => '')
  )
    .split('\n')
    .map((l) => l.match(/^(\d+) reps$/)?.[1])
    .filter(Boolean);
  ok(
    'les doses montent une fois, et une seule',
    doses.join(',') === '5,5,10,10,15,15',
    doses.join(',') || '(rien lu)'
  );

  await ctx.close();
}

{
  console.log(
    '\n── le repos tombe à la fin du palier, pas entre deux mouvements'
  );
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess6');

  // Le repos se reconnaît à sa bande, dont le bouton s'appelle « Passer » —
  // et rien d'autre ne porte exactement ce nom. Chercher le mot « repos »
  // dans la page ne marche pas : la prescription du bloc le contient déjà,
  // et ma première version de cette assertion tombait pour cette raison.
  const restStrips = () =>
    p.getByRole('button', { name: 'Passer', exact: true }).count();

  // Premier mouvement du premier palier : aucun repos ne doit suivre, le
  // second mouvement vient tout de suite.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
  const betweenMovements = await restStrips();
  ok(
    "pas de repos entre les deux mouvements d'un même palier",
    betweenMovements === 0,
    `${betweenMovements} bande(s)`
  );

  // Second mouvement du palier : là, le repos est prescrit.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  const afterRung = await restStrips();
  ok(
    'un repos suit la fin du palier',
    afterRung === 1,
    `${afterRung} bande(s)`
  );

  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
