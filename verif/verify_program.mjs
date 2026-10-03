/**
 * « Mon programme » : quand ai-je fait cette séance pour la dernière fois ?
 *
 * Retour du terrain : « j'ai modifié mon programme en changeant les séances
 * plutôt qu'en les supprimant et en les recréant, donc elles ont gardé le même
 * id, et ça me met une séance comme terminée alors que je ne l'ai jamais
 * faite. Je pense pas que ça soit pertinent comme info, ça serait plus utile
 * d'avoir la dernière fois qu'on a fait la séance, mais que ça compare le
 * contenu aussi, pas juste l'id. »
 *
 * Les pastilles se fondaient sur `originalSessionId`, et un identifiant
 * survit à une modification. Il annonçait « TERMINÉE » d'une séance réécrite
 * de fond en comble. Le même identifiant alimentait aussi « 7 séances sur 2
 * déjà faites » — un compte de bilans dont les séances n'existent plus toutes,
 * rapporté à un programme qui a rétréci depuis.
 *
 * La carte porte donc une date, et cette date se gagne en comparant ce qu'il
 * y a à faire — pas en faisant correspondre un identifiant.
 */
import {
  launch,
  BASE,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
  clean,
} from './common.mjs';

const browser = await launch();

/** Chaque carte de séance, par son titre, avec la ligne qu'elle porte à
 * droite. */
const cards = async (p) => {
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  return p.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 2) continue;
      const [left, right] = el.children;
      const title = (left.textContent || '').trim();
      if (!/^Séance \d/.test(title)) continue;
      out[title.split(/\s*—\s*/)[0]] = (right.textContent || '').trim();
    }
    return out;
  });
};

// ── Les trois réponses ──────────────────────────────────────────────────
{
  console.log(
    '\n── chaque séance dit quand elle a été faite pour la dernière fois'
  );
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  const rows = await cards(p);
  const line = (n) => clean(rows[`Séance ${n}`] ?? '(absente)');

  ok(
    'le programme liste ses séances',
    Object.keys(rows).length >= 5,
    Object.keys(rows).join(' · ')
  );

  // Les séances 1 et 2 ont été faites avec le contenu qu'elles portent
  // encore.
  ok(
    "une séance faite telle qu'elle est aujourd'hui porte sa date",
    /^Faite le \d+ \S+$/.test(line(1)),
    line(1)
  );
  ok("  → et l'autre aussi", /^Faite le /.test(line(2)), line(2));

  // La séance 3 a été faite une fois, puis remaniée. L'identifiant
  // correspond, le contenu non — et c'est exactement le cas que la pastille
  // fondée sur l'identifiant se trompait à traiter.
  ok(
    "une séance remaniée depuis qu'elle a été faite le dit",
    line(3) === 'Modifiée depuis',
    line(3)
  );
  ok(
    "  → et ne s'appelle jamais « Terminée »",
    !/Terminée/i.test(line(3)),
    line(3)
  );

  // Les séances 4 et 5 ne portent aucun bilan.
  ok(
    'une séance jamais faite le dit simplement',
    line(4) === 'Jamais faite',
    line(4)
  );
  ok('  → et la dernière aussi', line(5) === 'Jamais faite', line(5));
  await ctx.close();
}

// ── Ce que les pastilles disaient a disparu ─────────────────────────────
{
  console.log("\n── les pastilles d'état et la proportion ont disparu");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  const text = clean(await p.evaluate(() => document.body.innerText));

  ok('aucune pastille « TERMINÉE »', !/TERMINÉE/i.test(text));
  ok('  → aucune « À VENIR » non plus', !/À VENIR/i.test(text));
  ok(
    '  → et aucune proportion du programme',
    !/séances? sur \d+ déjà faite/i.test(text),
    (text.match(/[^\n]*déjà faite[^\n]*/) ?? ['(rien)'])[0]
  );

  // La prochaine séance se distingue toujours — c'est elle qui porte une
  // action. Elle le fait simplement par la carte plutôt que par une
  // pastille.
  const nextIsMarked = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('*')].filter((e) =>
      /^Séance \d/.test((e.children[0]?.textContent || '').trim())
    );
    const surfaces = cards.map((e) => {
      const box = e.closest('[class]');
      return box ? getComputedStyle(box).backgroundColor : '';
    });
    return new Set(surfaces).size > 1;
  });
  ok(
    'la prochaine séance se distingue toujours des autres',
    nextIsMarked,
    nextIsMarked ? '' : 'toutes les cartes ont le même fond'
  );
  await ctx.close();
}

// ── Faire une séance fait apparaître sa date ────────────────────────────
//
// L'aller-retour qui compte : une séance en « Jamais faite » est faite, et la
// carte qui se taisait porte maintenant la date du jour. Si la comparaison
// était trop stricte — si elle comparait la note du coach, par exemple — elle
// resterait « Jamais faite » pour toujours, et rien d'autre ne le
// révélerait.
{
  console.log('\n── terminer une séance met à jour sa propre carte');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);

  const before = await cards(p);
  ok(
    "la séance 5 n'a jamais été faite",
    clean(before['Séance 5'] ?? '') === 'Jamais faite',
    clean(before['Séance 5'] ?? '(absente)')
  );

  // La séance 5 est une pyramide : un bloc, sept paliers.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', { name: /^Fait$/ });
    if (!(await f.count())) break;
    await f.click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1400);
  // Aucune charge n'a été notée, le bilan commence donc par en demander. On
  // le franchit : ce qui est éprouvé ici est la carte, pas le formulaire.
  const toFeeling = p.getByRole('button', { name: /Passer au ressenti/ });
  if (await toFeeling.count()) {
    await toFeeling.click();
    await p.waitForTimeout(900);
  }
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Valider$/ }).click();
  await p.waitForTimeout(2200);

  const after = await cards(p);
  ok(
    '  → et porte maintenant la date à laquelle elle a été faite',
    /^Faite le /.test(clean(after['Séance 5'] ?? '')),
    clean(after['Séance 5'] ?? '(absente)')
  );
  ok(
    '  → sans déranger les autres',
    clean(after['Séance 4'] ?? '') === 'Jamais faite',
    clean(after['Séance 4'] ?? '(absente)')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
