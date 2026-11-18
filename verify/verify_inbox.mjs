/**
 * « À lire » : le fil des séances non lues, dans l'ordre où elles comptent.
 *
 * Le coach lisait « 3 séances à lire » dans la liste de ses clients, puis
 * ouvrait chaque journal. Le fil les réunit, et chaque carte se lit sans
 * s'ouvrir : qui, quoi, quand, comment c'était, ce qu'il en a dit, ce qui a
 * bougé. D'abord ce qui fait mal, puis ce qui est mal réglé, puis le reste ;
 * les séances calmes d'un client se replient en une ligne.
 *
 * Le faux serveur ne porte qu'une cliente et une séance non lue : le fil
 * complet est servi par la suite elle-même, une séance par règle.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  MOBILE,
  clean,
} from './common.mjs';

const INBOX = /\/api\/coach\/inbox/;
const NOW = Date.now();
const ago = (days, hours = 0) =>
  new Date(NOW - days * 86_400_000 - hours * 3_600_000).toISOString();

/** Une séance faite, réduite à ce que la carte lit. */
const done = (id, fields = {}) => ({
  _id: id,
  originalSessionId: 'sess1',
  sessionOrder: 1,
  sessionName: 'Full body A',
  blocks: [],
  viewedByCoach: false,
  replies: [],
  completedAt: ago(1),
  ...fields,
});
const lifted = (id, name, weight) => ({
  exercise: { _id: id, name },
  order: 1,
  performed: { sets: [{ weight, reps: 10 }] },
});
const loads = (pairs) => [
  { type: 'classic', order: 1, exercises: pairs.map((x) => lifted(...x)) },
];
const who = (id, firstName, lastName) => ({ _id: id, firstName, lastName });

const THOMAS = who('c-thomas', 'Thomas', 'Bernard');
const UNREAD = [
  {
    client: who('c-lea', 'Léa', 'Dubois'),
    completed: done('lea', {
      completedAt: ago(0, 2),
      feedback: { effort: 2 },
      clientNotes: 'Bien.',
    }),
  },
  {
    client: who('c-julien', 'Julien', 'Moreau'),
    completed: done('julien', { completedAt: ago(3), feedback: { effort: 1 } }),
    previous: done('julien-avant', {
      completedAt: ago(10),
      feedback: { effort: 1 },
    }),
  },
  {
    client: who('c-karim', 'Karim', 'Haddad'),
    completed: done('karim', {
      completedAt: ago(5),
      feedback: { effort: 3, tags: ['fatigue', 'pain'] },
    }),
  },
  ...[2, 4, 6].map((days) => ({
    client: THOMAS,
    completed: done(`thomas-${days}`, {
      completedAt: ago(days),
      feedback: { effort: 3 },
    }),
  })),
  {
    client: { _id: 'c-sans-compte' },
    completed: done('sans-nom', {
      completedAt: ago(7),
      feedback: { effort: 4 },
      blocks: loads([
        ['a', 'Squat', 61],
        ['b', 'Swing', 21],
        ['c', 'Fentes', 13],
        ['d', 'Rowing', 17],
        ['e', 'Presse', 31],
      ]),
    }),
    previous: done('sans-nom-avant', {
      completedAt: ago(14),
      blocks: loads([
        ['a', 'Squat', 60],
        ['b', 'Swing', 20],
        ['c', 'Fentes', 12],
        ['d', 'Rowing', 16],
        ['e', 'Presse', 30],
      ]),
    }),
  },
  {
    client: who('c-manon', 'Manon', 'Petit'),
    completed: done('manon', {
      completedAt: ago(8),
      metrics: { stress: 2, mood: 4, energy: 3, sleep: 4, soreness: 2 },
    }),
  },
];
const READ = [
  {
    client: who('c-sarah', 'Sarah', 'Martin'),
    completed: done('lue', {
      completedAt: ago(9),
      viewedByCoach: true,
      feedback: { effort: 3 },
      clientNotes: 'Déjà lue, celle-là.',
    }),
  },
];

/** Les lignes du fil, dans l'ordre de l'écran : leur nom, et leur texte. */
const lines = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll('[data-inbox-card], [data-inbox-fold]')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({
        fold: el.hasAttribute('data-inbox-fold'),
        expanded: el.getAttribute('aria-expanded'),
        text: el.innerText,
        name: el.innerText
          .split('\n')
          .find(
            (t) =>
              t.trim() && t.trim() !== '?' && !/^[A-Z]{1,2}$/.test(t.trim())
          )
          ?.trim(),
        chips: [...el.querySelectorAll('span')]
          .map((s) => s.innerText.trim())
          .filter(Boolean),
      }))
  );
const cardOf = (all, name) => all.find((line) => line.name === name);

const browser = await launch();

{
  console.log('\n── une carte se lit sans s’ouvrir');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const sarah = cardOf(await lines(p), 'Sarah Martin');
  const text = clean(sarah?.text ?? '');
  ok(
    'qui, quoi, comment c’était, son mot, ce qui a bougé',
    /Full body A/.test(text) &&
      /Trop dure/.test(text) &&
      /« Dur sur la fin\. »/.test(text) &&
      /Fatigué/.test(text) &&
      /Goblet Squat 26 kg ↗/.test(text),
    text.replace(/\n+/g, ' | ')
  );
  await ctx.close();
}

{
  console.log('\n── le fil, dans l’ordre où il compte');
  const ctx = await browser.newContext(MOBILE);
  const asked = [];
  await ctx.route(INBOX, (r) => {
    const read =
      new URL(r.request().url()).searchParams.get('state') === 'read';
    asked.push(read ? 'read' : 'unread');
    return r.fulfill({
      json: read
        ? { total: READ.length, items: READ }
        : { total: UNREAD.length, items: UNREAD },
    });
  });
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const all = await lines(p);
  ok(
    'ce qui fait mal, puis ce qui est mal réglé, puis le reste par date',
    all.map((line) => line.name).join(' · ') ===
      'Karim Haddad · Julien Moreau · Léa Dubois · Thomas Bernard · Client sans nom · Manon Petit',
    all.map((line) => line.name).join(' · ')
  );

  const fold = all.find((line) => line.fold);
  ok(
    'trois séances « Juste » de Thomas tiennent en une ligne',
    /3 séances · toutes « Juste »/.test(clean(fold?.text ?? '')) &&
      /Tout va bien/.test(fold?.text ?? '') &&
      fold?.expanded === 'false' &&
      all.filter((line) => line.name === 'Thomas Bernard').length === 1,
    clean(fold?.text ?? '').replace(/\n+/g, ' | ')
  );
  await p
    .locator('[data-inbox-fold]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const opened = await lines(p);
  ok(
    '  → la toucher les déplie',
    opened.filter((line) => line.name === 'Thomas Bernard' && !line.fold)
      .length === 3 && opened.find((line) => line.fold)?.expanded === 'true',
    `${opened.filter((line) => line.name === 'Thomas Bernard').length} ligne(s) de Thomas`
  );

  const karim = cardOf(all, 'Karim Haddad');
  ok(
    'la douleur se lit la première',
    karim?.chips.filter((c) => c === 'Douleur' || c === 'Fatigué')[0] ===
      'Douleur',
    JSON.stringify(karim?.chips)
  );
  ok(
    'sans mot, un « trop facile » répété se dit',
    clean(cardOf(all, 'Julien Moreau')?.text ?? '').includes(
      'Aucun mot. Deuxième « trop facile » de suite.'
    )
  );
  const nameless = cardOf(all, 'Client sans nom');
  ok(
    'un compte disparu : « Client sans nom », initiales « ? »',
    nameless !== undefined && nameless.text.includes('?'),
    nameless?.text.replace(/\n+/g, ' | ')
  );
  ok(
    'trois pastilles au plus, puis « + 2 »',
    nameless?.chips.filter((c) => c.endsWith('↗')).length === 3 &&
      nameless.chips.includes('+ 2'),
    JSON.stringify(nameless?.chips)
  );
  ok(
    'un ancien bilan le dit, sans inventer d’effort',
    /ancien bilan/.test(cardOf(all, 'Manon Petit')?.text ?? '')
  );

  // « Déjà lues » ne se charge qu'à la demande.
  const before = asked.filter((s) => s === 'read').length;
  await p
    .getByRole('button', { name: 'Déjà lues' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const read = await lines(p);
  ok(
    '« Déjà lues » se charge à la demande, et montre ce qui est lu',
    before === 0 &&
      asked.includes('read') &&
      read.length === 1 &&
      /Déjà lue, celle-là/.test(read[0]?.text ?? '') &&
      (await p
        .getByRole('button', { name: 'Déjà lues' })
        .getAttribute('aria-pressed')
        .catch(() => null)) === 'true',
    `${before} avant · ${JSON.stringify(asked)} · ${read.length} carte(s)`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
