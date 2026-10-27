/**
 * Créer ou modifier un exercice depuis le programme, sans quitter la séance.
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
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  clean,
  MOBILE,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WORKSHOP = `${BASE}/coach/clients/${CLIENT}/s/1`;
const NAME = 'Swing lesté témoin';
const VIDEO = 'https://www.youtube.com/watch?v=sswzD1Q7dTk';
const NOTE = 'Dos plat, la poussée vient des hanches.';
const EDIT = 'Consigne corrigée depuis le programme.';
const PLACED = 'Corrigée depuis la ligne du programme.';
const MOBILE_NAME = 'Swing témoin mobile';

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

  // ── Remplir, et vérifier que cela arrive au serveur ──────────────────────
  //
  // Sans la fiche il n'y a rien à remplir : on le dit et on passe à la suite,
  // au lieu de mourir sur un clic impossible ou de s'arrêter là. Deux
  // versions de ce garde se sont trompées : la première remontait une
  // exception Playwright, la seconde sortait du programme et laissait le
  // second geste — la modification — jamais éprouvé.
  if ((await note.count()) === 1) {
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
    ok(
      'le serveur porte le nouvel exercice',
      !!created,
      JSON.stringify(created)
    );
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
  } else {
    ok('la consigne arrive au serveur', false, 'fiche absente, non éprouvé');
    ok('le lien vidéo arrive au serveur', false, 'fiche absente, non éprouvé');
  }

  // ── Modifier un exercice existant, depuis le même sélecteur ──────────────
  await p.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  // Ce que la page porte déjà, avant d'ouvrir le sélecteur : les lignes du
  // programme.
  const placedBefore = await p
    .getByRole('button', { name: /^Ouvrir la fiche de / })
    .count();

  await p
    .getByRole('button', { name: /^exercice$/ })
    .first()
    .click();
  await p.waitForTimeout(700);

  // L'écart avant/après ouverture, et non un compte absolu.
  //
  // Deux raisons. D'abord les lignes du programme portent elles aussi un
  // « Ouvrir la fiche de… » depuis ce commit : un compte pris sur toute la
  // page additionnait les deux — 19 là où le sélecteur en porte 11 — et
  // serait resté vert même si le sélecteur n'en portait plus aucun. Ensuite
  // le sélecteur n'a pas la même forme selon la largeur : un tiroir sur
  // desktop, une liste posée dans le bloc sur mobile. Cadrer sur `dialog`
  // ne voyait donc que la première, et comptait zéro sur la seconde.
  const allOpeners = () =>
    p.getByRole('button', { name: /^Ouvrir la fiche de / }).count();
  const inSelector = (await allOpeners()) - placedBefore;
  ok(
    'chaque exercice du sélecteur ouvre sa fiche',
    inSelector > 0,
    `${inSelector} bouton(s) apportés par le sélecteur`
  );
  const openers = p.getByRole('button', { name: /^Ouvrir la fiche de / });

  if (inSelector > 0) {
    const label = await openers.first().getAttribute('aria-label');
    const existing = (label ?? '').replace('Ouvrir la fiche de ', '');
    await openers.first().click();
    await p.waitForTimeout(1200);

    const openSheet = p.getByRole('dialog');
    const existingNote = openSheet.getByLabel(`Consigne — ${existing}`, {
      exact: true,
    });
    ok(
      `la fiche de « ${existing} » s’ouvre sur place`,
      (await existingNote.count()) === 1,
      `${await existingNote.count()} champ(s)`
    );

    if ((await existingNote.count()) === 1) {
      await existingNote.click();
      await p.waitForTimeout(300);
      await openSheet
        .getByRole('textbox', { name: `Consigne — ${existing}`, exact: true })
        .fill(EDIT);
      await p.keyboard.press('Tab');
      await p.waitForTimeout(900);

      const edited = (await library()).find((e) => e.name === existing);
      ok(
        '  → et la correction arrive au serveur',
        edited?.description === EDIT,
        clean(edited?.description ?? '(vide)')
      );
    }
  }

  // ── Ouvrir la fiche depuis une ligne déjà posée dans le programme ────────
  //
  // Le geste que le sélecteur ne couvre pas : l'exercice est déjà dans le
  // bloc, et le coach veut corriger sa vidéo. Il n'y avait aucun chemin — il
  // fallait rechercher le mouvement comme pour l'ajouter, ou quitter le
  // programme pour la bibliothèque.
  await p.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  const inProgram = p
    .locator('main')
    .getByRole('button', { name: /^Ouvrir la fiche de / });
  const placed = await inProgram.count();
  ok(
    'un exercice posé dans le programme ouvre sa fiche',
    placed > 0,
    `${placed} mouvement(s) cliquable(s)`
  );

  if (placed > 0) {
    const label = await inProgram.first().getAttribute('aria-label');
    const name = (label ?? '').replace('Ouvrir la fiche de ', '');
    await inProgram.first().click();
    await p.waitForTimeout(1200);

    const placedSheet = p.getByRole('dialog');
    const field = placedSheet.getByLabel(`Consigne — ${name}`, {
      exact: true,
    });
    ok(
      `la fiche de « ${name} » s’ouvre par-dessus le programme`,
      (await field.count()) === 1,
      `${await field.count()} champ(s)`
    );

    // ── Valider sans quitter le champ ──────────────────────────────────────
    //
    // Le vrai risque de ce bouton : les champs partent à la perte du focus,
    // donc cliquer « Retour au programme » alors qu'on tape encore doit
    // d'abord retirer le focus — sinon la frappe est perdue au moment précis
    // où le coach croit valider.
    if ((await field.count()) === 1) {
      await field.click();
      await p.waitForTimeout(300);
      await placedSheet
        .getByRole('textbox', { name: `Consigne — ${name}`, exact: true })
        .fill(PLACED);

      const done = placedSheet.getByRole('button', {
        name: 'Retour au programme',
      });
      ok('la fiche porte une validation nommée', (await done.count()) === 1);

      if (await done.count()) {
        await done.click();
        await p.waitForTimeout(1200);

        ok(
          '  → elle referme la fiche et rend le programme',
          (await p.getByRole('dialog').count()) === 0 &&
            (await p
              .locator('main')
              .getByRole('button', { name: /^Ouvrir la fiche de / })
              .count()) > 0
        );

        const kept = (await library()).find((e) => e.name === name);
        ok(
          '  → et la frappe en cours est enregistrée, pas perdue',
          kept?.description === PLACED,
          clean(kept?.description ?? '(vide)')
        );
      }
    }
  }

  // ── En mobile, où le sélecteur est un tiroir et non une liste ────────────
  //
  // Retour du terrain : « en mode mobile le tiroir ne s'ouvre pas à la
  // création ». Exact, et le banc ne pouvait pas le voir : il menait cet
  // écran en desktop, où le sélecteur est une liste posée dans le bloc. En
  // mobile c'est un tiroir, et deux couches s'échangeaient donc dans le même
  // rendu — le sélecteur se fermait, la fiche s'ouvrait, et le
  // `history.back()` de nettoyage du premier refermait la seconde dans la
  // seconde qui suivait.
  //
  // D'où un contexte mobile, et une attente longue : la fiche s'ouvrait
  // bien, elle ne restait pas. Une assertion prise aussitôt l'aurait vue
  // ouverte et aurait conclu que tout allait bien.
  const mobile = await browser.newContext(MOBILE);
  const m = await signIn(mobile);
  await m.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await m.waitForTimeout(1800);

  await m
    .getByRole('button', { name: /^exercice$/ })
    .first()
    .click();
  await m.waitForTimeout(800);
  await m
    .getByRole('textbox', { name: 'Chercher un exercice' })
    .first()
    .fill(MOBILE_NAME);
  await m.waitForTimeout(500);
  await m.getByRole('button', { name: /Créer/ }).first().click();
  await m.waitForTimeout(2500);

  const mobileNote = m
    .getByRole('dialog')
    .getByLabel(`Consigne — ${MOBILE_NAME}`, { exact: true });
  ok(
    'en mobile, la fiche s’ouvre à la création et elle reste',
    (await mobileNote.count()) === 1,
    `${await m.getByRole('dialog').count()} tiroir(s), ${await mobileNote.count()} champ(s)`
  );

  // Et le bouton retour, qui est la raison d'être de `useBackDismiss`, doit
  // continuer de fermer la couche. Le correctif distingue nos propres retours
  // de ceux de l'utilisateur : s'il en avalait un de trop, c'est ici que ça
  // se verrait.
  await m.goBack();
  await m.waitForTimeout(1200);
  ok(
    '  → et le retour la referme, sans quitter le programme',
    (await m.getByRole('dialog').count()) === 0 &&
      m.url().includes('/coach/clients/'),
    `${await m.getByRole('dialog').count()} tiroir(s) — ${m.url()}`
  );

  ok(
    '  → le mouvement créé est bien dans le bloc',
    (await m
      .locator('main')
      .getByRole('button', { name: `Ouvrir la fiche de ${MOBILE_NAME}` })
      .count()) === 1
  );

  // ── Deux couches ouvertes en même temps ─────────────────────────────────
  //
  // En mobile, ouvrir une fiche depuis l'intérieur du sélecteur l'empile
  // par-dessus : le sélecteur reste dessous. Un retour doit refermer la fiche
  // et rendre le sélecteur, pas les deux ni la page. C'est le cas que le
  // registre prévoit — un repère pour la pile, reposé tant qu'il reste une
  // couche — et que rien ne vérifiait.
  await m
    .getByRole('button', { name: /^exercice$/ })
    .first()
    .click();
  await m.waitForTimeout(800);
  ok('le sélecteur est ouvert', (await m.getByRole('dialog').count()) >= 1);

  const fromSelector = m.getByRole('button', {
    name: `Ouvrir la fiche de ${MOBILE_NAME}`,
  });
  if (await fromSelector.count()) {
    await fromSelector.first().click();
    await m.waitForTimeout(1200);
    ok(
      'la fiche s’empile par-dessus le sélecteur',
      (await m
        .getByRole('dialog')
        .getByLabel(`Consigne — ${MOBILE_NAME}`, { exact: true })
        .count()) === 1
    );

    await m.goBack();
    await m.waitForTimeout(1200);
    ok(
      '  → le retour referme la fiche et rend le sélecteur',
      (await m
        .getByRole('textbox', { name: 'Chercher un exercice' })
        .count()) === 1 &&
        (await m
          .getByRole('dialog')
          .getByLabel(`Consigne — ${MOBILE_NAME}`, { exact: true })
          .count()) === 0,
      m.url()
    );

    await m.goBack();
    await m.waitForTimeout(1200);
    ok(
      '  → et le retour suivant referme le sélecteur, sans quitter la page',
      (await m
        .getByRole('textbox', { name: 'Chercher un exercice' })
        .count()) === 0 && m.url().includes('/coach/clients/'),
      m.url()
    );
  }

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
