/**
 * Le repos entre deux séries, posé à l'intérieur de la liste.
 *
 * Il prenait tout l'écran : on cochait « Fait », et le bloc qu'on était en
 * train de lire disparaissait derrière un mur turquoise. Retour du terrain :
 * « pas agréable de se retrouver d'un coup avec un REPOS en pleine page ».
 *
 * Un repos n'est pas un événement, c'est un intervalle entre deux séries — et
 * il appartient là où cet intervalle se trouve.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  guidedScreen,
} from './common.mjs';

const browser = await launch();

/** Marche jusqu'au bloc classique de la séance 2 et coche la première
 * série. */
const tickOneSet = async (p) => {
  await start(p, 'sess2');
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

// ── Le repos ne cache plus le bloc ──────────────────────────────────────
{
  console.log('\n── le repos se pose dans la liste, il ne la couvre plus');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  const screen = await guidedScreen(p);
  const lines = screen.split('\n').filter(Boolean);

  const strips = await p
    .getByRole('button', { name: 'Passer', exact: true })
    .count();
  ok(
    'une bande de repos apparaît dans la liste',
    strips === 1,
    `${strips} bande(s)`
  );
  ok(
    '  → portant ce qui vient ensuite',
    /ensuite Goblet Squat/i.test(screen),
    (lines.find((l) => /ensuite/i.test(l)) ?? '(rien)').slice(0, 60)
  );

  // Le cœur du sujet : tout le bloc reste lisible pendant le repos.
  // `innerText` lit aussi ce qui est caché derrière un panneau : il faut donc
  // demander au navigateur sur quoi un doigt tomberait réellement à cet
  // endroit.
  const trulyVisible = await p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    const target = [...root.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /Fentes marchées/.test(e.textContent)
    );
    if (!target) return { found: false };
    const r = target.getBoundingClientRect();
    const onTop = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
    return {
      found: true,
      covered: onTop !== target && !target.contains(onTop),
    };
  });
  ok(
    'le bloc reste entièrement lisible pendant le repos',
    trulyVisible.found && !trulyVisible.covered,
    JSON.stringify(trulyVisible)
  );
  ok(
    '  → et ses dernières lignes aussi',
    /Fentes marchées/.test(screen) && /série 4 \/ 4/.test(screen),
    lines.filter((l) => /Fentes/.test(l)).length + ' ligne(s) de fentes'
  );
  ok(
    "  → y compris l'en-tête du bloc et sa progression",
    /CLASSIQUE/.test(screen) && /1 sur 7 faits/.test(screen),
    lines.find((l) => /faits dans ce bloc/.test(l)) ?? '(rien)'
  );

  // Il se place entre la série cochée et celle qui suit.
  const iDone = lines.findIndex((l) => /^26 kg$/.test(l.trim()));
  const iRest = lines.findIndex((l) => /REPOS/i.test(l));
  const iNext = lines.findIndex((l) => /série 2 \/ 4/.test(l));
  ok(
    "  → exactement entre la série qui vient d'être faite et la suivante",
    iDone >= 0 && iDone < iRest && iRest < iNext,
    `faite ${iDone}, repos ${iRest}, suivante ${iNext}`
  );

  // Aucun panneau ne recouvre le bloc.
  const overlays = await p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    return [...root.querySelectorAll('div')].some((e) => {
      const st = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return (
        st.position === 'absolute' &&
        r.height > 300 &&
        /repos/i.test(e.innerText || '')
      );
    });
  });
  ok('  → et rien ne se superpose au bloc', !overlays);
  await ctx.close();
}

// ── On peut travailler pendant le repos ─────────────────────────────────
//
// C'est ce que paie le fait de l'avoir posé dans la liste : corriger une
// charge, relire la dose du mouvement suivant, rouvrir une consigne — ce
// qu'on fait réellement en attendant.
{
  console.log('\n── pendant le repos, la séance reste utilisable');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  const field = p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first();
  ok('la série en cours porte toujours son champ', (await field.count()) > 0);
  await field.fill('28');
  await p.waitForTimeout(300);
  ok(
    '  → et une charge se saisit sans attendre la fin du repos',
    (await field.inputValue()) === '28',
    await field.inputValue()
  );
  ok(
    '  → pendant que la bande de repos continue de tourner',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 1
  );
  await ctx.close();
}

// ── « Passer » rend la main sans rien défaire ───────────────────────────
{
  console.log('\n── passer le repos ne défait rien');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);
  await p.getByRole('button', { name: 'Passer', exact: true }).click();
  await p.waitForTimeout(400);
  const screen = await guidedScreen(p);
  ok(
    'la bande de repos disparaît',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  ok(
    '  → la série cochée le reste',
    /1 sur 7 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(rien)'])[0]
  );
  ok('  → et la charge notée est toujours là', /26 kg/.test(screen));
  await ctx.close();
}

// ── Aucun repos là où le coach n'en a prescrit aucun ────────────────────
{
  console.log('\n── aucun repos inventé après le dernier exercice');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Le chipper de la séance 3 ne prescrit aucun repos entre ses
  // mouvements.
  await start(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
  ok(
    "un bloc sans repos prescrit n'affiche aucune bande",
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
