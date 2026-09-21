/**
 * L'horloge attend qu'on la lance.
 *
 * Elle partait seule. Sur un tour, cela voulait dire que le décompte tournait
 * déjà avant que le client ait ramassé sa kettlebell : on ouvre la séance, on
 * arrive au tour 1 d'un EMOM, et on est déjà en retard.
 *
 * Partir est une décision, et elle appartient à celui qui va faire l'effort.
 * L'enchaînement, lui, reste le format : demander un toucher à chaque tour
 * détruirait l'EMOM — « every minute on the minute » veut dire que les
 * minutes se suivent, pas qu'on les relance.
 */
import {
  lancer,
  MOBILE,
  ok,
  bilanDesEchecs,
  connecter,
  demarrer,
  ecranGuide,
  ou,
  passerRepos,
} from './commun.mjs';

const browser = await lancer();

/** Ce que dit l'horloge du tour : son temps, et ce que son bouton propose. */
const horloge = (p) =>
  p.evaluate(() => {
    const r = document.querySelector('[aria-label="Séance guidée"]');
    const t = [...r.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && !e.children.length
    );
    const btn = [...r.querySelectorAll('button')].find((e) =>
      /décompte|pause/i.test(e.getAttribute('aria-label') || '')
    );
    const net = (x) => (x ?? '').replace(/[\u00A0\u202F\u2009]/g, ' ');
    return {
      temps: net(t?.textContent.trim()) || null,
      nom: net(btn?.getAttribute('aria-label')) || null,
    };
  });

/** Franchit l'échauffement de la séance 1 pour arriver sur l'EMOM. */
const allerALEmom = async (p) => {
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
};

// ── Elle ne part pas sans nous ──────────────────────────────────────────
{
  console.log('\n── le décompte d’un tour attend un toucher');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await allerALEmom(p);
  ok('on est bien sur l’EMOM', /— EMOM$/.test(await ou(p)), await ou(p));

  const debut = await horloge(p);
  ok('l’horloge affiche le temps entier', debut.temps === '1:00', debut.temps);
  ok(
    '  → et propose de le lancer, pas de le mettre en pause',
    /^Lancer le décompte/.test(debut.nom ?? ''),
    debut.nom
  );
  ok(
    '  → l’écran le dit aussi',
    /Toucher pour lancer/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(rien)'
  );

  // Le point qui compte : attendre ne coûte pas de temps.
  await p.waitForTimeout(3000);
  const apres = await horloge(p);
  ok(
    'trois secondes d’attente n’entament pas le tour',
    apres.temps === '1:00',
    apres.temps
  );

  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(2500);
  const lance = await horloge(p);
  ok(
    'un toucher le lance',
    /^Mettre en pause/.test(lance.nom ?? ''),
    lance.nom
  );
  ok('  → et il court', /5[0-9] s restant/.test(lance.nom ?? ''), lance.nom);
  await ctx.close();
}

// ── Une fois lancé, l'EMOM enchaîne ────────────────────────────────────
//
// C'est le format : les minutes se suivent. Redemander un toucher à chaque
// tour reviendrait à ne plus faire d'EMOM du tout.
{
  console.log('\n── une fois lancé, les tours suivants partent seuls');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await allerALEmom(p);
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(800);

  await p.getByRole('button', { name: /^Suivant$/ }).click();
  await p.waitForTimeout(1200);
  const tour2 = await horloge(p);
  ok(
    'le tour suivant du même bloc ne redemande rien',
    /^Mettre en pause/.test(tour2.nom ?? ''),
    tour2.nom
  );
  ok(
    '  → et on est bien au tour 2',
    /Tour 2/.test(await ecranGuide(p)),
    (await ecranGuide(p)).match(/Tour \d+[^\n]*/)?.[0] ?? '(rien)'
  );
  await ctx.close();
}

// ── Changer de bloc remet l'horloge en attente ─────────────────────────
{
  console.log('\n── un autre bloc, une autre décision');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess4');
  // La séance 4 enchaîne un On-Off de 8 tours puis un bloc « Every ».
  ok('on démarre sur le On-Off', /— On/i.test(await ou(p)), await ou(p));
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(600);
  for (let i = 0; i < 8; i++) {
    const b = p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ });
    if (!(await b.count())) break;
    await b.click();
    await p.waitForTimeout(220);
    if (/— Every/i.test(await ou(p))) break;
  }
  ok('on atteint le bloc suivant', /— Every/i.test(await ou(p)), await ou(p));
  const neuf = await horloge(p);
  ok(
    '  → son horloge attend à son tour',
    /^Lancer le décompte/.test(neuf.nom ?? ''),
    neuf.nom
  );
  await ctx.close();
}

// ── Le repos, lui, part tout seul ──────────────────────────────────────
//
// Il a été déclenché par le geste qui a fini la série : redemander un
// toucher juste après en serait un de trop.
{
  console.log('\n── le repos entre deux séries n’attend pas, lui');
  const ctx = await browser.newContext(MOBILE);
  const p = await connecter(ctx);
  await demarrer(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(2200);
  const r = await horloge(p);
  ok(
    'le décompte du repos court dès qu’il apparaît',
    /^Mettre en pause/.test(r.nom ?? ''),
    r.nom
  );
  ok('  → et il a bien entamé', /5[0-9] s restant/.test(r.nom ?? ''), r.nom);
  await ctx.close();
}

await browser.close();
process.exit(bilanDesEchecs() ? 1 : 0);
