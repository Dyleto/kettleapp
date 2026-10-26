/**
 * Créer un exercice depuis le programme, et le renseigner sur place.
 *
 * Retour du terrain : « ça serait bien qu'à la création d'un exercice via le
 * programme on puisse directement rentrer les infos de l'exercice, c'est
 * quelque chose qu'il avait avant et qu'il a plus. »
 *
 * Il l'avait : un écran de saisie séparé, supprimé quand la fiche est devenue
 * éditable là où elle se lit. Le remplacement n'a jamais été branché côté
 * programme — créer en tapant un nom n'envoyait que ce nom, et la vidéo comme
 * la consigne demandaient d'aller dans la bibliothèque, donc de quitter la
 * séance en cours d'écriture.
 *
 * La fiche s'ouvre maintenant par-dessus le sélecteur. Cette suite éprouve le
 * geste entier : créer, remplir, fermer, et vérifier que le serveur porte ce
 * qui a été tapé — un champ rempli dans un tiroir qui n'arrive pas à l'API ne
 * vaut pas mieux qu'un champ absent.
 */
import { BASE, launch, ok, failureCount, signIn, clean } from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WORKSHOP = `${BASE}/coach/clients/${CLIENT}/s/1`;
const NAME = 'Swing lesté témoin';
const VIDEO = 'https://www.youtube.com/watch?v=sswzD1Q7dTk';
const NOTE = 'Dos plat, la poussée vient des hanches.';

/** La bibliothèque telle que le serveur la porte, lue hors du navigateur. */
const library = async () => {
  const r = await fetch('http://localhost:3001/api/coach/exercises');
  return r.json();
};

const main = async () => {
  await fetch('http://localhost:3001/api/mock/reset', { method: 'POST' });

  const browser = await launch();
  const ctx = await browser.newContext();
  const p = await signIn(ctx);

  await p.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  // ── Créer en tapant un nom ───────────────────────────────────────────────
  await p
    .getByRole('button', { name: /^exercice$/ })
    .first()
    .click();
  await p.waitForTimeout(600);

  const search = p.getByRole('textbox', { name: 'Chercher un exercice' });
  ok('le sélecteur s’ouvre', (await search.count()) >= 1);
  await search.first().fill(NAME);
  await p.waitForTimeout(500);

  const createButton = p.getByRole('button', { name: new RegExp('Créer') });
  ok('il propose de créer ce nom', (await createButton.count()) >= 1);
  await createButton.first().click();
  await p.waitForTimeout(1200);

  // ── La fiche s'ouvre sur place ───────────────────────────────────────────
  //
  // Les champs de la fiche se lisent comme du texte et ne deviennent des
  // champs qu'au clic : on les désigne donc par leur libellé et non par leur
  // rôle, qui change selon qu'on les a ouverts ou non. Ma première version
  // cherchait un `textbox` et ne trouvait rien alors que la fiche était bien
  // là.
  // Le sélecteur se referme en s'animant : on attend qu'il soit parti plutôt
  // que de forcer le clic, ce qui masquerait un vrai recouvrement si l'un
  // apparaissait.
  await p
    .getByRole('textbox', { name: 'Chercher un exercice' })
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => {});
  await p.waitForTimeout(600);

  // Cadré sur la fiche, et en correspondance exacte. `getByLabel` cherche
  // par défaut une sous-chaîne : « Consigne — X » attrapait aussi « Ajouter
  // une consigne — X », le bouton de l'atelier *derrière* le tiroir, et le
  // clic partait sur lui — intercepté, donc, puisqu'il est recouvert.
  const sheet = p.getByRole('dialog');
  const note = sheet.getByLabel(`Consigne — ${NAME}`, { exact: true });
  const video = sheet.getByLabel(`Lien vidéo — ${NAME}`, { exact: true });

  ok(
    'la fiche du nouvel exercice s’ouvre sans quitter la séance',
    (await note.count()) === 1,
    `${await note.count()} champ(s) de consigne dans la fiche`
  );
  ok(
    'elle porte le champ de lien vidéo',
    (await video.count()) === 1,
    `${await video.count()} champ(s)`
  );

  // Sans la fiche, la suite n'a plus rien à éprouver : elle le dit et
  // s'arrête, au lieu de mourir sur un clic impossible. Sous sabotage, la
  // première version remontait une exception Playwright à la place de ce
  // qu'elle avait constaté.
  if ((await note.count()) !== 1) {
    ok('la consigne arrive au serveur', false, 'fiche absente, non éprouvé');
    ok('le lien vidéo arrive au serveur', false, 'fiche absente, non éprouvé');
    await browser.close();
    process.exit(1);
  }

  // ── Remplir, et vérifier que cela arrive au serveur ──────────────────────
  await note.click();
  await p.waitForTimeout(300);
  await sheet
    .getByRole('textbox', { name: `Consigne — ${NAME}`, exact: true })
    .fill(NOTE);
  await p.keyboard.press('Tab');
  await p.waitForTimeout(800);

  await video.click();
  await p.waitForTimeout(300);
  await sheet
    .getByRole('textbox', { name: `Lien vidéo — ${NAME}`, exact: true })
    .fill(VIDEO);
  await p.keyboard.press('Tab');
  await p.waitForTimeout(1000);

  const created = (await library()).find((e) => e.name === NAME);
  ok('le serveur porte le nouvel exercice', !!created, JSON.stringify(created));
  ok(
    '  → avec sa consigne',
    created?.description === NOTE,
    clean(created?.description ?? '(vide)')
  );
  ok(
    '  → et son lien vidéo',
    created?.videoUrl === VIDEO,
    created?.videoUrl ?? '(vide)'
  );

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
