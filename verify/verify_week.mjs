/**
 * La semaine qui avance : le dernier écran de la fin de séance.
 *
 * Après l'envoi, on revenait sur l'accueil avec un toast. L'écran de la
 * semaine montre maintenant l'anneau qui se remplit de la séance qu'on vient
 * de faire, ce qu'il reste pour que la semaine soit pleine, et depuis combien
 * de semaines le rythme tient. Les comptes sont ceux de l'accueil : séances
 * faites depuis lundi, sur le nombre de jours conseillés distincts — trois
 * dans le décor, le lundi, le jeudi et le samedi.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
  clean,
  API,
} from './common.mjs';

const browser = await launch();
// L'historique du décor, lu avant toute séance : le serveur de démonstration
// garde ce que la première partie envoie, et l'historique composé de la
// seconde compterait cette séance-là en plus.
const { history } = await (await fetch(`${API}/api/client/history`)).json();
const settle = (p) => p.waitForTimeout(300);

/** Mène la séance 3 jusqu'au ressenti, et l'envoie. */
const sendSess3 = async (p) => {
  await start(p, 'sess3');
  for (let i = 0; i < 4; i++) {
    const done = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(250);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Continuer', exact: true }).click();
  await p.waitForTimeout(800);
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.getByRole('button', { name: 'Envoyer à ton coach' }).click();
  await p.waitForTimeout(2500);
};

/** L'écran de la semaine : son texte, son anneau, ses jours. */
const week = (p) =>
  p.evaluate(() => {
    const scene = document.querySelector(
      '[role="dialog"][aria-label="Ta semaine"]'
    );
    return scene
      ? {
          text: scene.innerText,
          ring: scene.querySelector('[role="img"]')?.getAttribute('aria-label'),
          days: [...scene.querySelectorAll('[data-day]')].map(
            (d) => d.dataset.day
          ),
        }
      : null;
  });
const today = (new Date().getDay() + 6) % 7;

{
  console.log('\n── après l’envoi, la semaine avance d’une séance');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await sendSess3(p);
  const w = await week(p);
  ok('l’envoi mène à « Ta semaine »', w !== null);
  ok(
    'l’anneau compte la séance qu’on vient de faire',
    clean(w?.ring ?? '') === '1 séance sur 3',
    w?.ring ?? '(aucun)'
  );
  ok(
    '  → et les mots disent ce qu’il reste',
    /Une séance sur trois/.test(w?.text ?? '') &&
      /Encore deux et ta semaine est pleine\./.test(w?.text ?? ''),
    clean(w?.text ?? '')
      .split('\n')
      .slice(0, 3)
      .join(' | ')
  );
  ok(
    'le jour d’aujourd’hui est coché, les jours conseillés marqués',
    w?.days[today] === 'done' &&
      [0, 3, 5]
        .filter((d) => d !== today)
        .every((d) => w?.days[d] === 'planned'),
    (w?.days ?? []).join(' ')
  );
  ok(
    'pas de suite de semaines à annoncer',
    !/semaines d’affilée/.test(w?.text ?? '')
  );
  // Dans l'écran de la semaine seulement, et sans attendre s'il manque : le
  // reste de la suite doit pouvoir dire ce qu'il voit.
  await p
    .locator('[role="dialog"][aria-label="Ta semaine"]')
    .getByRole('button', { name: 'Terminer', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForTimeout(1200);
  ok(
    '« Terminer » revient à l’accueil',
    new URL(p.url()).pathname === '/client',
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── la troisième séance remplit la semaine, et la suite monte');
  // Un historique composé : deux séances plus tôt cette semaine, et trois
  // par semaine les trois semaines d'avant.
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - today);
  const at = (weeksBack, hour) => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7 * weeksBack);
    d.setHours(hour);
    // Cette semaine, avant maintenant quel que soit le jour.
    return (weeksBack === 0 && d > now ? now : d).toISOString();
  };
  const extra = [
    [0, 6],
    [0, 7],
    [1, 8],
    [1, 9],
    [1, 10],
    [2, 8],
    [2, 9],
    [2, 10],
    [3, 8],
    [3, 9],
    [3, 10],
  ].map(([w, h], i) => ({
    ...history[0],
    _id: `extra-${i}`,
    completedAt: at(w, h),
  }));
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
    r.fulfill({ json: { history: [...extra, ...history] } })
  );
  const p = await signIn(ctx);
  await sendSess3(p);
  const w = await week(p);
  ok(
    'trois séances sur trois : « Semaine pleine. »',
    clean(w?.ring ?? '') === '3 séances sur 3' &&
      /Semaine pleine\./.test(w?.text ?? ''),
    `${w?.ring} · ${clean(w?.text ?? '')
      .split('\n')
      .slice(0, 3)
      .join(' | ')}`
  );
  ok(
    '  → et la suite compte cette semaine avec les trois d’avant',
    /4 semaines d’affilée/.test(w?.text ?? ''),
    (w?.text.match(/[^\n]*affilée[^\n]*/) ?? ['(aucune)'])[0]
  );
  await settle(p);
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
