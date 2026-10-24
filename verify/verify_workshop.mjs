/**
 * L'atelier du coach perd-il ce qu'il annonce avoir enregistré ?
 *
 * Retour du terrain : « j'ai des soucis avec la kettle app depuis 1 semaine
 * environ. Quand j'écris des séances et que ça me marque "enregistré", quand
 * je quitte la page (par exemple quand je vais dans la bibliothèque
 * d'exercice) et que je reviens, tout ce que j'ai écrit dans les 5 min a
 * disparu en général. »
 *
 * Le banc ne menait que l'espace client : l'atelier — l'écran où le coach
 * écrit le plus, et le seul qui enregistre tout seul — n'était couvert par
 * rien. Cette suite va donc là où le signalement pointe, et elle lit l'écran
 * au retour.
 *
 * Elle vérifie trois choses, dans cet ordre, parce que la troisième est celle
 * qui coûte :
 *
 * 1. l'enregistrement part réellement (le serveur d'essai compte ses PUT) ;
 * 2. ce que l'écran affiche au retour ;
 * 3. ce que le serveur contient après une frappe suivante — un affichage
 *    périmé qu'on réenregistre devient une perte définitive, puisque le PUT
 *    remplace le programme entier.
 */
import { BASE, launch, ok, failureCount, signIn, clean } from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WORKSHOP = `${BASE}/coach/clients/${CLIENT}/s/1`;

/** Ce que le serveur d'essai contient vraiment, lu hors du navigateur. */
const serverSessions = async () => {
  const r = await fetch(`http://localhost:3001/api/coach/clients/${CLIENT}`);
  const { program } = await r.json();
  return program.sessions;
};

const putCount = async () => {
  const r = await fetch('http://localhost:3001/api/mock/put-count');
  return (await r.json()).count;
};

/** Le nom de la séance ouverte, tel que l'écran le donne. */
const displayedName = (p) =>
  p
    .getByRole('button', { name: /^Nom de la séance 1$/ })
    .textContent()
    .then(clean)
    .catch(() => '');

/**
 * La ligne d'état ne reste que 2,5 s après un enregistrement, puis disparaît
 * — elle n'existe pas pour être surveillée. On l'attend donc au lieu de la
 * lire à un instant choisi au hasard, et c'est le texte qu'on cherche :
 * `[role="status"]` attrapait d'abord la zone d'annonces vide du toaster.
 */
const awaitSaved = async (p) => {
  for (let i = 0; i < 30; i++) {
    if (await p.getByText('Enregistré', { exact: true }).count()) return true;
    await p.waitForTimeout(120);
  }
  return false;
};

const rename = async (p, value) => {
  await p.getByRole('button', { name: /^Nom de la séance 1$/ }).click();
  const field = p.getByRole('textbox', { name: /^Nom de la séance 1$/ });
  await field.fill(value);
  await field.press('Enter');
};

const main = async () => {
  // Le décor part à l'identique à chaque tour : les assertions portent sur
  // des noms, et hériter de l'état du tour précédent les rend illisibles.
  await fetch('http://localhost:3001/api/mock/reset', { method: 'POST' });

  const browser = await launch();
  const ctx = await browser.newContext();
  const p = await signIn(ctx);

  // ── Le coach écrit, et l'application dit « Enregistré » ──────────────────
  await p.goto(WORKSHOP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);

  const before = await displayedName(p);
  ok("l'atelier s'ouvre sur la séance du client", before.length > 0, before);

  await rename(p, 'Atelier premier jet');
  await p.waitForTimeout(2000);

  ok("l'écran annonce l'enregistrement", await awaitSaved(p));

  // L'annonce ne vaut rien sans le constat : c'est la différence entre « rien
  // n'est parti » et « tout est parti puis a été perdu ».
  const sent = await putCount();
  ok(
    "l'enregistrement est réellement parti au serveur",
    sent >= 1,
    `${sent} PUT`
  );

  const stored = await serverSessions();
  ok(
    'le serveur a bien écrit le nouveau nom',
    stored[0]?.name === 'Atelier premier jet',
    stored[0]?.name
  );

  // ── Le coach va dans la bibliothèque, puis revient ───────────────────────
  //
  // En cliquant, et non par `page.goto` : un `goto` recharge l'application
  // entière, donc il vide le cache mémoire de React Query — et c'est
  // justement ce cache qui est en cause. La première version de cette suite
  // s'y est trompée et n'a rien reproduit. Le témoin ci-dessous existe pour
  // que personne ne puisse refaire l'erreur sans que le banc le dise.
  await p.evaluate(() => {
    window.__benchWitness = 'vivant';
  });

  await p
    .getByRole('link', { name: /Bibliothèque/ })
    .first()
    .click();
  await p.waitForTimeout(1200);
  ok(
    'la bibliothèque est atteinte sans quitter l’application',
    p.url().includes('/coach/exercises'),
    p.url()
  );

  // Le retour arrière du navigateur : un `popstate`, que react-router traite
  // sans recharger. C'est aussi le geste que le coach décrit.
  await p.goBack();
  await p.waitForTimeout(1800);

  const witness = await p.evaluate(() => window.__benchWitness ?? 'perdu');
  ok(
    "l'aller-retour n'a pas rechargé l'application",
    witness === 'vivant',
    witness
  );

  const after = await displayedName(p);
  ok(
    'au retour, la séance porte toujours le nom enregistré',
    after.includes('Atelier premier jet'),
    after
  );

  // ── Et la frappe suivante, que réenregistre-t-elle ? ─────────────────────
  //
  // C'est ici que l'affichage périmé devient une perte. On touche à un *autre*
  // champ que le nom : réécrire le nom le remettrait juste par accident, et
  // l'assertion ne verrait rien. Le PUT remplace le programme entier, donc
  // enregistrer un écran périmé renvoie le nom à sa valeur d'avant.
  await p
    .getByRole('button', { name: /^mercredi$/ })
    .first()
    .click();
  await awaitSaved(p);
  await p.waitForTimeout(600);

  const final = await serverSessions();
  ok(
    "une modification suivante n'écrase pas ce qui était enregistré",
    final[0]?.name === 'Atelier premier jet',
    `le serveur porte « ${final[0]?.name} »`
  );

  await browser.close();
  process.exit(failureCount() > 0 ? 1 : 0);
};

main();
