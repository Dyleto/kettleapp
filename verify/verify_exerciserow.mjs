/**
 * La ligne d'exercice de l'atelier : elle se lit, puis s'ouvre (E5).
 *
 * Au repos, un nom et une dose — « à régler » quand rien n'est prescrit —
 * et rien d'autre à toucher. La toucher l'ouvre : ses réglages dessous à
 * partir de 768 px, dans une feuille basse sur téléphone. Une seule ouverte
 * à la fois ; Échap ou un clic ailleurs la referme.
 *
 * Les séances du coach se remettent à zéro au début de chaque partie
 * (`/api/mock/reset`) : chaque partie écrit dans le programme, et la
 * suivante doit repartir du décor.
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  autosaved,
  MOBILE,
  clean,
  gone,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const DESKTOP = { viewport: { width: 1440, height: 1000 } };
const SESSION_1 = `${BASE}/coach/clients/${CLIENT}/s/1`;
const SESSION_2 = `${BASE}/coach/clients/${CLIENT}/s/2`;

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });

/** Ce que le serveur d'essai contient vraiment, lu hors du navigateur. */
const serverSessions = async () =>
  (await (await fetch(`${API}/api/coach/clients/${CLIENT}`)).json()).program
    .sessions;
const serverBlock = async (session, type) =>
  (await serverSessions())[session].blocks.find((b) => b.type === type);

/**
 * Écrit dans le programme du serveur, comme l'atelier le ferait : le
 * mouvement voyage par son identifiant, et le serveur le repeuple.
 */
const putSessions = (sessions) =>
  fetch(`${API}/api/coach/clients/${CLIENT}/program/sessions`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sessions: sessions.map((s) => ({
        ...s,
        blocks: s.blocks.map((b) => ({
          ...b,
          exercises: b.exercises.map((e) => ({
            ...e,
            exerciseId: e.exercise._id,
          })),
        })),
      })),
    }),
  });

const rows = (p) => p.locator('main [data-exercise-row]');
const row = (p, name) => rows(p).filter({ hasText: name }).first();
const toggle = (p, name) => row(p, name).locator(':scope > button');
const rowText = (p, name) =>
  row(p, name)
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const openRows = (p) => p.locator('main [data-exercise-row][data-open]');

/**
 * Ouvre une ligne, si elle ne l'est pas déjà.
 *
 * Un clic sur une ligne ouverte la referme : une partie qui ouvrait « au
 * cas où » refermait la ligne quand l'assertion précédente avait échoué en
 * la laissant ouverte, et tombait à son tour. Chaque assertion part ainsi
 * d'une ligne ouverte, quoi qu'ait laissé la précédente — un sabotage ne
 * fait tomber que celle qui le couvre.
 */
const openRow = async (p, name) => {
  const button = toggle(p, name);
  const expanded = await button
    .getAttribute('aria-expanded', { timeout: 2000 })
    .catch(() => null);
  if (expanded !== 'true')
    await button.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
};
const press = async (p, name, scope = p) => {
  await scope
    .getByRole('button', { name, exact: typeof name === 'string' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const show = (x) => JSON.stringify(x);

/**
 * Un clic à côté de toute ligne : le coin haut gauche de l'écran, dans le
 * rail de navigation, qui ne défile pas et n'y porte aucun bouton.
 *
 * Un point pris dans la page ne convenait pas : une page qui s'allonge ou
 * qui a défilé y place autre chose — une ligne, qu'on ouvrait en croyant
 * cliquer dans le vide. Le titre de la fiche du client non plus : sur grand
 * écran il est caché, et le clic n'atteignait rien.
 */
const clickElsewhere = async (p) => {
  await p.mouse.click(2, 2);
  await settle(p);
};

const browser = await launch();

{
  console.log('\n── au repos, une ligne se lit');
  await reset();
  // Une ligne sans dose : Mountain Climbers perd ses répétitions.
  const sessions = await serverSessions();
  delete sessions[0].blocks[0].exercises[1].reps;
  await putSessions(sessions);

  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  const goblet = await rowText(p, 'Goblet Squat');
  const inside = await row(p, 'Goblet Squat').getByRole('button').count();
  ok(
    'le nom et la dose, et rien d’autre à toucher',
    /Goblet Squat/.test(goblet) && /12 reps/.test(goblet) && inside === 1,
    `${goblet.replace(/\n+/g, ' | ')} · ${inside} bouton(s)`
  );
  ok(
    'aucun réglage visible tant qu’aucune ligne n’est ouverte',
    (await p
      .locator('main')
      .getByRole('button', { name: /^Retirer / })
      .count()) === 0
  );
  const empty = await rowText(p, 'Mountain Climbers');
  ok(
    'une ligne sans dose dit « à régler »',
    /à régler/.test(empty),
    empty.replace(/\n+/g, ' | ')
  );
  await ctx.close();
}

{
  console.log('\n── la toucher l’ouvre, ses réglages dessous');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await openRow(p, 'Goblet Squat');
  const open = row(p, 'Goblet Squat');
  ok(
    'la ligne s’ouvre sur place : dose, unités, fiche, dupliquer, retirer',
    (await toggle(p, 'Goblet Squat')
      .getAttribute('aria-expanded', { timeout: 2000 })
      .catch(() => null)) === 'true' &&
      (await open
        .getByRole('button', { name: 'Augmenter les répétitions' })
        .count()) === 1 &&
      (await open
        .getByRole('button', { name: 'Reps', exact: true })
        .getAttribute('aria-pressed', { timeout: 2000 })
        .catch(() => null)) === 'true' &&
      (await open
        .getByRole('button', { name: 'Ouvrir la fiche de Goblet Squat' })
        .count()) === 1 &&
      (await open
        .getByRole('button', { name: 'Dupliquer Goblet Squat' })
        .count()) === 1 &&
      (await open
        .getByRole('button', { name: 'Retirer Goblet Squat' })
        .count()) === 1 &&
      (await p.getByRole('dialog').count()) === 0
  );

  await press(p, 'Augmenter les répétitions', open);
  await autosaved(p);
  const emom = await serverBlock(0, 'emom');
  ok(
    '« + » ajoute une répétition, et le serveur la reçoit',
    /13 reps/.test(await rowText(p, 'Goblet Squat')) &&
      emom.exercises[1].reps === 13,
    `${await rowText(p, 'Goblet Squat')} · serveur : ${emom.exercises[1].reps}`
  );

  // Au clavier, et dans un autre bloc : aucun clic ne passe ailleurs, c'est
  // l'état de la séance seul qui doit refermer la première. Une ligne
  // ouverte par bloc, et non par séance, ne se verrait qu'ici.
  await toggle(p, 'Burpee')
    .focus({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.press('Enter');
  await settle(p);
  ok(
    'une seule ligne ouverte à la fois, d’un bloc à l’autre',
    (await openRows(p).count()) === 1 &&
      /Burpee/.test(
        await openRows(p)
          .first()
          .innerText({ timeout: 2000 })
          .catch(() => '')
      ),
    `${await openRows(p).count()} ligne(s) ouverte(s)`
  );

  // Le focus part dans les réglages, qui disparaissent avec la ligne : sans
  // retour explicite, il tomberait sur la page.
  await p.keyboard.press('Tab');
  await p.keyboard.press('Escape');
  await settle(p);
  const focused = await p.evaluate(
    () =>
      document.activeElement?.closest('[data-exercise-row]')?.textContent ?? ''
  );
  ok(
    'Échap la referme, et rend le focus à la ligne',
    (await openRows(p).count()) === 0 && /Burpee/.test(focused),
    `${await openRows(p).count()} ligne(s) ouverte(s) · focus : ${focused.slice(0, 40)}`
  );

  await openRow(p, 'Goblet Squat');
  await clickElsewhere(p);
  await settle(p);
  ok('un clic ailleurs la referme', (await openRows(p).count()) === 0);

  await openRow(p, 'Goblet Squat');
  // Comparée à ce qu'elle était juste avant, et non à 13 : l'assertion ne
  // dépend pas de ce que « + » a fait plus haut.
  const beforeTyping = await rowText(p, 'Goblet Squat');
  await open
    .getByRole('button', { name: 'Répétitions — Goblet Squat' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('textbox', { name: 'Répétitions — Goblet Squat' })
    .fill('20', { timeout: 2000 })
    .catch(() => {});
  await p.keyboard.press('Escape');
  await settle(p);
  const afterEscape = await rowText(p, 'Goblet Squat');
  ok(
    'Échap dans le nombre rend la valeur d’avant, sans refermer la ligne',
    (await openRows(p).count()) === 1 &&
      /\d+ reps/.test(afterEscape) &&
      afterEscape.match(/\d+ reps/)?.[0] ===
        beforeTyping.match(/\d+ reps/)?.[0],
    `${beforeTyping.match(/\d+ reps/)?.[0]} → ${afterEscape.replace(/\n+/g, ' | ')}`
  );
  await ctx.close();
}

{
  console.log('\n── changer d’unité, avec de quoi revenir');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await openRow(p, 'Goblet Squat');
  const open = row(p, 'Goblet Squat');

  await press(p, 'Durée', open);
  const banner = clean(await p.locator('body').innerText());
  ok(
    '« Durée » passe la dose en durée, et la bannière dit ce qui s’efface',
    /30 s/.test(await rowText(p, 'Goblet Squat')) &&
      /Dose en durée/.test(banner) &&
      /Elle était de 12 reps/.test(banner),
    (await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')
  );

  await press(p, 'Annuler');
  ok(
    '  → « Annuler » remet les 12 reps, la ligne toujours ouverte',
    /12 reps/.test(await rowText(p, 'Goblet Squat')) &&
      (await openRows(p).count()) === 1,
    `${(await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')} · ${await openRows(p).count()} ouverte(s)`
  );

  // Ouverte quoi qu'ait laissé « Annuler » : ce qui suit ne dépend pas de
  // l'assertion précédente.
  await openRow(p, 'Goblet Squat');
  await press(p, 'Autre unité', open);
  const measure = p.getByRole('textbox', { name: 'Mesure — Goblet Squat' });
  const ready = await measure
    .evaluate((el) => el === document.activeElement)
    .catch(() => false);
  ok(
    '« Autre unité » demande sa valeur : le champ s’ouvre, prêt à la frappe',
    ready
  );
  await measure.fill('400').catch(() => {});
  await p.keyboard.press('Enter');
  await open
    .getByRole('textbox', { name: 'Unité — Goblet Squat' })
    .fill('m')
    .catch(() => {});
  await autosaved(p);
  const metric = (await serverBlock(0, 'emom')).exercises[1];
  ok(
    '  → « 400 m » se lit sur la ligne, et le serveur ne garde que la mesure',
    /400 m/.test(await rowText(p, 'Goblet Squat')) &&
      show(metric.customMetric) === show({ value: 400, unit: 'm' }) &&
      metric.reps === undefined,
    show({ customMetric: metric.customMetric, reps: metric.reps })
  );
  await ctx.close();
}

{
  console.log('\n── consigne, copie, retrait');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await openRow(p, 'Goblet Squat');
  const open = row(p, 'Goblet Squat');

  await press(p, 'Ajouter une consigne — Goblet Squat', open);
  await p
    .getByRole('textbox', { name: 'Consigne — Goblet Squat' })
    .fill('Talons au sol', { timeout: 2000 })
    .catch(() => {});
  await p.keyboard.press('Tab');
  await autosaved(p);
  await clickElsewhere(p);
  await settle(p);
  ok(
    '« + consigne » l’écrit, et la ligne fermée la relit dessous',
    // Fermée : ouverte, le champ de la consigne la montrerait aussi.
    (await openRows(p).count()) === 0 &&
      /Talons au sol/.test(await rowText(p, 'Goblet Squat')) &&
      (await serverBlock(0, 'emom')).exercises[1].note === 'Talons au sol',
    (await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')
  );

  await openRow(p, 'Goblet Squat');
  await press(p, 'Dupliquer Goblet Squat');
  await autosaved(p);
  const names = (await serverBlock(0, 'emom')).exercises.map(
    (e) => e.exercise.name
  );
  const opened = await openRows(p)
    .first()
    .evaluate((el) =>
      [
        ...el.parentElement.querySelectorAll(':scope > [data-exercise-row]'),
      ].indexOf(el)
    )
    .catch(() => -1);
  ok(
    '« Dupliquer » pose la copie juste dessous, et l’ouvre',
    show(names) ===
      show(['Kettlebell Swing', 'Goblet Squat', 'Goblet Squat']) &&
      opened === 2,
    `${show(names)} · ligne ouverte au rang ${opened}`
  );

  // La première du bloc : la ligne suivante prendrait sa place sous les
  // réglages si la ligne retirée restait « ouverte ».
  await openRow(p, 'Kettlebell Swing');
  await press(p, 'Retirer Kettlebell Swing');
  const after = clean(await p.locator('body').innerText());
  ok(
    '« Retirer » la retire tout de suite, avec « Annuler », et rien ne reste ouvert',
    (await rows(p).filter({ hasText: 'Kettlebell Swing' }).count()) === 0 &&
      /Kettlebell Swing retiré/.test(after) &&
      (await openRows(p).count()) === 0,
    `${await rows(p).filter({ hasText: 'Kettlebell Swing' }).count()} ligne(s) · ${await openRows(p).count()} ouverte(s)`
  );
  await ctx.close();
}

{
  console.log('\n── un bloc classique : séries et repos');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_2, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const before = await rowText(p, 'Goblet Squat');
  await openRow(p, 'Goblet Squat');
  const open = row(p, 'Goblet Squat');
  await press(p, 'Augmenter le repos', open);
  ok(
    'la dose se lit en entier, et le repos se règle avec elle',
    /4 × 10 · repos 1 min/.test(before) &&
      /repos 1 min 15/.test(await rowText(p, 'Goblet Squat')),
    `${before.replace(/\n+/g, ' | ')} → ${(await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')}`
  );

  for (let i = 0; i < 3; i++) await press(p, 'Diminuer les séries', open);
  await autosaved(p);
  const classic = (await serverBlock(1, 'classic')).exercises[0];
  ok(
    '  → ramenée à une série, la ligne perd son repos',
    /10 reps/.test(await rowText(p, 'Goblet Squat')) &&
      (await open
        .getByRole('button', { name: 'Augmenter le repos' })
        .count()) === 0 &&
      classic.sets === undefined,
    `${(await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')} · serveur : ${show(classic.sets)}`
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone, une feuille basse');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await openRow(p, 'Goblet Squat');
  const sheet = p.getByRole('dialog', { name: 'Régler Goblet Squat' });
  ok(
    'toucher une ligne ouvre ses réglages en feuille, pas dessous',
    (await sheet.count()) === 1 &&
      (await sheet
        .getByRole('button', { name: 'Augmenter les répétitions' })
        .count()) === 1 &&
      (await p
        .locator('main')
        .getByRole('button', { name: /^Retirer / })
        .count()) === 0
  );

  await press(p, 'Augmenter les répétitions', sheet);
  await press(p, 'C’est bon', sheet);
  await gone(sheet);
  ok(
    '  → « C’est bon » la referme, la dose réglée sur la ligne',
    (await sheet.count()) === 0 &&
      /13 reps/.test(await rowText(p, 'Goblet Squat')),
    (await rowText(p, 'Goblet Squat')).replace(/\n+/g, ' | ')
  );

  await openRow(p, 'Goblet Squat');
  await p.goBack();
  await gone(sheet);
  ok(
    '  → le retour du téléphone la referme, sans quitter la séance',
    (await sheet.count()) === 0 &&
      new URL(p.url()).pathname === `/coach/clients/${CLIENT}/s/1`,
    p.url()
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
