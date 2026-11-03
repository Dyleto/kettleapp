/**
 * Supprimer une séance au clic droit, depuis le rail.
 *
 * Retour du terrain : « pouvoir faire clic droit supprimer sur la séance ».
 *
 * Il fallait l'ouvrir d'abord : le seul chemin était un bouton au pied de la
 * séance affichée. Supprimer la quatrième demandait donc de la lire, puis de
 * descendre — trois gestes pour en défaire un.
 *
 * Le clic droit est un geste de bureau, et c'est délibérément là qu'il
 * s'arrête : sur un écran tactile, l'appui long sert déjà à réordonner le
 * rail par glissement. Lui donner un second sens aurait retiré le
 * réordonnancement pour ajouter un raccourci dont le bouton du bas tient
 * déjà lieu.
 */
import { BASE, launch, ok, failureCount, signIn, clean } from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
// On lit la séance 2 et on supprime la 3. Lire la 1 ne prouverait rien :
// la suppression renvoie vers `/s/1`, donc là où l'on est déjà, et
// l'assertion « sans déplacer le coach » resterait verte même sans le
// garde qui la retient — mesuré, elle l'était.
const WORKSHOP = `${BASE}/coach/clients/${CLIENT}/s/2`;

/** Ce que le serveur d'essai porte vraiment comme séances. */
const serverSessions = async () => {
  const r = await fetch(`http://localhost:3001/api/coach/clients/${CLIENT}`);
  const { program } = await r.json();
  return program.sessions;
};

const main = async () => {
  await fetch('http://localhost:3001/api/mock/reset', { method: 'POST' });

  const browser = await launch();
  const p = await signIn(await browser.newContext());
  await p.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  const rows = () => p.getByRole('button', { name: /^Séance \d/ });
  const before = await serverSessions();
  ok(
    'le rail liste les séances du programme',
    before.length >= 3,
    `${before.length} séances`
  );

  // On vise la séance 3, qui n'est pas celle qui est ouverte : c'est tout
  // l'intérêt du geste, et c'est aussi ce qui vérifie que l'écran ne saute
  // pas sous les yeux du coach.
  const target = p.getByRole('button', { name: /^Séance 3/ }).first();
  ok('la séance 3 est dans le rail', (await target.count()) === 1);

  await target.click({ button: 'right' });
  await p.waitForTimeout(600);

  const entry = p.getByRole('menuitem', { name: /Supprimer la séance 3/ });
  ok(
    'le clic droit propose de supprimer cette séance',
    (await entry.count()) === 1,
    `${await entry.count()} entrée(s)`
  );

  if ((await entry.count()) !== 1) {
    ok('la séance part du rail', false, 'aucune entrée de menu, non éprouvé');
    ok('  → sans déplacer le coach', false, 'non éprouvé');
    ok('  → et le serveur en porte une de moins', false, 'non éprouvé');
    ok('une bannière offre de revenir en arrière', false, 'non éprouvé');
    await browser.close();
    process.exit(1);
  }

  await entry.click();
  await p.waitForTimeout(1500);

  ok(
    'la séance part du rail',
    (await p.getByRole('button', { name: /^Séance 3 —/ }).count()) === 0 ||
      (await rows().count()) < before.length,
    `${await rows().count()} rangée(s)`
  );

  // L'écran ne doit pas avoir changé : on supprimait une autre séance que
  // celle qu'on lisait.
  ok(
    '  → sans déplacer le coach, qui lisait la séance 2',
    p.url().endsWith('/s/2'),
    p.url()
  );

  const after = await serverSessions();
  ok(
    '  → et le serveur en porte une de moins',
    after.length === before.length - 1,
    `${before.length} → ${after.length}`
  );

  // ── Le filet d'annulation ────────────────────────────────────────────────
  //
  // Une séance emporte tous ses blocs : c'est la plus grande perte possible
  // en un geste, et le projet a choisi le rattrapage plutôt que la question.
  const undo = p.getByRole('button', { name: 'Annuler' });
  ok(
    'une bannière offre de revenir en arrière',
    (await undo.count()) >= 1,
    clean(
      (await p.locator('body').innerText()).match(
        /[^\n]*supprimée[^\n]*/
      )?.[0] ?? '(rien lu)'
    )
  );

  if (await undo.count()) {
    await undo.first().click();
    await p.waitForTimeout(1800);
    const restored = await serverSessions();
    ok(
      '  → et « Annuler » la remet, à sa place',
      restored.length === before.length,
      `${restored.length} séances`
    );
  }

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
