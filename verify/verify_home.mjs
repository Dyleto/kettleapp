/**
 * L'accueil du client : une seule question, « qu'est-ce que je fais
 * maintenant ? », et une réponse différente selon le jour.
 *
 * L'horloge du navigateur est posée sur un jour choisi, et l'historique
 * composé pour chaque cas : la semaine du lundi 9 au dimanche 15 novembre
 * 2026. Le programme du décor conseille la séance 1 le lundi et le jeudi,
 * la séance 2 le samedi — trois séances par semaine.
 */
import {
  BASE,
  launch,
  MOBILE,
  ok,
  failureCount,
  clean,
  passBlock,
  skipCountdown,
  skipRest,
  where,
  START,
  API,
  COACHES,
  settle,
} from './common.mjs';

const browser = await launch();
const { history: BASE_HISTORY } = await (
  await fetch(`${API}/api/client/history`)
).json();
const { program: PROGRAM } = await (
  await fetch(`${API}/api/client/program`)
).json();

/** Une séance faite le `date` novembre à 9 h, sur le modèle du décor. */
const did = (sessionId, date, month = 10) => {
  const model =
    BASE_HISTORY.find((c) => c.originalSessionId === sessionId) ??
    BASE_HISTORY[0];
  return {
    ...model,
    _id: `did-${sessionId}-${month}-${date}`,
    originalSessionId: sessionId,
    completedAt: new Date(2026, month, date, 9).toISOString(),
  };
};

/**
 * Ouvre l'accueil le `date` novembre 2026 à 10 h, avec cet historique (le
 * décor si rien n'est dit) et ce programme.
 */
const openHome = async (date, { history, program } = {}) => {
  const ctx = await browser.newContext(MOBILE);
  if (history)
    await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
      r.fulfill({ json: { history } })
    );
  if (program)
    await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
      r.fulfill({ json: { program, coaches: COACHES } })
    );
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.clock.install({ time: new Date(2026, 10, date, 10) });
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() =>
    fetch('http://localhost:3001/api/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  );
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .getByRole('region', { name: 'Ta semaine' })
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p };
};

/** Ce que l'accueil montre : chaque région, sa semaine, ses bulles. */
const home = (p) =>
  p.evaluate(() => {
    const region = (name) =>
      document.querySelector(`section[aria-label="${name}"]`)?.innerText ??
      null;
    const week = document.querySelector('section[aria-label="Ta semaine"]');
    return {
      // Le titre caché vient avant, dans le texte : on cherche la salutation.
      greeting: document
        .querySelector('main')
        ?.innerText.split('\n')
        .find((line) => line.startsWith('Salut')),
      h1: document.querySelector('main h1')?.textContent,
      week: week?.innerText ?? null,
      ring:
        week?.querySelector('[role="img"]')?.getAttribute('aria-label') ?? null,
      days: [...(week?.querySelectorAll('[data-day]') ?? [])].map(
        (d) => d.dataset.day + (d.dataset.today ? '*' : '')
      ),
      today: region('À faire aujourd’hui'),
      next: region('La prochaine'),
      first: region('Ta première séance'),
      rest: region("Aujourd'hui"),
      last: region('Ta dernière séance'),
      how: region('Comment ça marche'),
      streak:
        [...document.querySelectorAll('main button')]
          .map((b) => b.getAttribute('aria-label') ?? '')
          .find((l) => /semaines d’affilée/.test(l)) ?? null,
    };
  });

const lines = (text) =>
  clean(text ?? '')
    .split('\n')
    .filter(Boolean);

{
  console.log('\n── un jeudi conseillé : la séance du jour, à une touche');
  const { ctx, p } = await openHome(12);
  const h = await home(p);
  ok(
    'l’écran s’appelle « Aujourd’hui », et salue par le prénom',
    h.h1 === 'Aujourd’hui' && /Salut Corentin/.test(h.greeting ?? ''),
    `${h.h1} · ${h.greeting}`
  );
  ok(
    'la carte du jour : « À faire aujourd’hui », la séance 1',
    /Full body A/.test(h.today ?? ''),
    lines(h.today).slice(0, 3).join(' | ')
  );
  ok(
    '  → avec sa durée estimée et ses formats',
    /≈ \d+ min/.test(clean(h.today ?? '')) && /AMRAP/.test(h.today ?? ''),
    lines(h.today).slice(1, 6).join(' | ')
  );
  ok(
    'la semaine : rien de fait, aujourd’hui et samedi restent',
    clean(h.ring ?? '') === '0 séance sur 3' &&
      /Trois séances cette semaine/.test(h.week ?? '') &&
      /Il te reste aujourd'hui et samedi\./.test(h.week ?? ''),
    `${h.ring} · ${lines(h.week).slice(1, 3).join(' | ')}`
  );
  ok(
    '  → les bulles : lundi conseillé sans alerte, jeudi entouré',
    h.days.join(' ') === 'planned free free planned* free planned free',
    h.days.join(' ')
  );
  ok(
    'la dernière séance, son mot, et le coach qui ne l’a pas lue',
    /30 août · Full body A/.test(clean(h.last ?? '')) &&
      /« Dur sur la fin\. »/.test(clean(h.last ?? '')) &&
      /Julie ne l'a pas encore lue/.test(h.last ?? ''),
    lines(h.last).join(' | ')
  );
  ok('pas de suite de semaines à annoncer', h.streak === null, h.streak);

  await p
    .getByRole('region', { name: 'À faire aujourd’hui' })
    .getByRole('button', { name: 'Démarrer' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Démarrer » ouvre la séance guidée sur son ouverture',
    new URL(p.url()).pathname === '/client/session/sess1' &&
      (await p.getByRole('button', { name: /C'est parti/ }).count()) === 1,
    new URL(p.url()).pathname
  );
  await p.reload({ waitUntil: 'domcontentloaded' });
  await settle(p);
  ok(
    '  → recharger la fiche ne relance pas la séance',
    (await p.getByRole('button', { name: /C'est parti/ }).count()) === 0 &&
      (await p.getByRole('button', { name: START }).count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── un mardi : repos, et la prochaine séance jeudi');
  const { ctx, p } = await openHome(10, {
    history: [did('sess1', 9), ...BASE_HISTORY],
  });
  const h = await home(p);
  ok(
    '« Aujourd’hui, repos », et la séance du jeudi',
    /Aujourd’hui, repos|Aujourd'hui, repos/i.test(h.rest ?? '') &&
      /Prochaine séance jeudi/.test(h.rest ?? '') &&
      /Full body A/.test(h.rest ?? '') &&
      h.today === null &&
      h.next === null,
    lines(h.rest).join(' | ')
  );
  ok(
    'la semaine : une sur trois, jeudi et samedi restent',
    clean(h.ring ?? '') === '1 séance sur 3' &&
      /Une séance sur trois/.test(h.week ?? '') &&
      /Il te reste jeudi et samedi\./.test(h.week ?? ''),
    `${h.ring} · ${lines(h.week).slice(1, 3).join(' | ')}`
  );
  ok(
    '  → lundi coché, mardi entouré',
    h.days.join(' ') === 'done free* free planned free planned free',
    h.days.join(' ')
  );
  await p
    .getByRole('button', { name: /^Lundi 9 — faite/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    'la bulle d’un jour fait ouvre la séance faite',
    (await p.getByRole('dialog').count()) === 1
  );
  await p.keyboard.press('Escape');
  await settle(p);
  await p
    .getByRole('button', { name: /La faire aujourd/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« La faire aujourd’hui » ouvre la fiche, sans lancer la séance',
    new URL(p.url()).pathname === '/client/session/sess1' &&
      (await p.getByRole('button', { name: /C'est parti/ }).count()) === 0,
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── un dimanche, semaine pleine : tout est fait');
  // Lundi, jeudi, samedi cette semaine, et trois par semaine les trois
  // semaines d'avant.
  const weeks = [0, 7, 14, 21].flatMap((back) => [
    did('sess1', 9 - back),
    did('sess1', 12 - back),
    did('sess2', 14 - back),
  ]);
  const { ctx, p } = await openHome(15, {
    history: [...weeks, ...BASE_HISTORY],
  });
  const h = await home(p);
  ok(
    '« Tout est fait », sans pousser la séance suivante',
    /Tout est fait/.test(h.rest ?? '') && h.next === null && h.today === null,
    lines(h.rest).join(' | ')
  );
  ok(
    'la semaine : pleine, et le rang de la semaine dans la suite',
    clean(h.ring ?? '') === '3 séances sur 3' &&
      /Semaine pleine/.test(h.week ?? '') &&
      /Trois séances sur trois\. Quatrième semaine de suite\./.test(
        h.week ?? ''
      ),
    `${h.ring} · ${lines(h.week).slice(1, 3).join(' | ')}`
  );
  ok(
    'la pastille de la suite, qui mène à Progrès',
    /^4 semaines d’affilée/.test(h.streak ?? ''),
    h.streak
  );
  await p
    .getByRole('button', { name: /semaines d’affilée/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → un toucher ouvre Progrès',
    new URL(p.url()).pathname === '/client/history',
    new URL(p.url()).pathname
  );
  await ctx.close();
}

{
  console.log('\n── la toute première fois');
  const { ctx, p } = await openHome(9, { history: [] });
  const h = await home(p);
  ok(
    '« Ta première séance », et comment ça marche',
    /Full body A/.test(h.first ?? '') &&
      /Tu suis la séance pas à pas/.test(h.how ?? ''),
    lines(h.first).slice(0, 2).join(' | ')
  );
  ok(
    'la semaine annonce les jours conseillés',
    /Trois séances cette semaine/.test(h.week ?? '') &&
      /Lundi, jeudi et samedi\./.test(h.week ?? ''),
    lines(h.week).slice(1, 3).join(' | ')
  );
  ok('pas de dernière séance', h.last === null);
  await ctx.close();
}

{
  console.log('\n── sans aucun jour conseillé');
  const program = {
    ...PROGRAM,
    sessions: PROGRAM.sessions.map((s) => ({ ...s, suggestedDays: [] })),
  };
  const { ctx, p } = await openHome(12, {
    program,
    history: [did('sess1', 10), ...BASE_HISTORY],
  });
  const h = await home(p);
  ok(
    'pas d’anneau, seulement le compte',
    h.ring === null &&
      /Une séance cette semaine/.test(h.week ?? '') &&
      /fais-les quand tu veux/.test(h.week ?? ''),
    lines(h.week).slice(0, 2).join(' | ')
  );
  ok(
    '« La prochaine » : la suivante du cycle',
    /Haut du corps/.test(h.next ?? ''),
    lines(h.next).slice(0, 2).join(' | ')
  );
  ok(
    '  → avec le mot du coach',
    /Focus qualité de mouvement/.test(h.next ?? '')
  );
  await ctx.close();
}

{
  console.log(
    '\n── une séance commencée sur ce téléphone : la reprendre d’ici'
  );
  const { ctx, p } = await openHome(14);
  // La séance 2, menée pour de vrai : le Tabata passé, deux séries du
  // renfo cochées, puis on revient à l'accueil sans finir.
  await p.goto(`${BASE}/client/session/sess2`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p.getByRole('button', { name: START }).click();
  await settle(p);
  await p.getByRole('button', { name: /C'est parti/ }).click();
  await settle(p);
  await skipCountdown(p);
  await passBlock(p);
  for (let i = 0; i < 2; i++) {
    await p
      .getByRole('button', { name: /^(Fait|Série faite)$/ })
      .click({ timeout: 3000 })
      .catch(() => {});
    await settle(p);
    await skipRest(p);
  }
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .getByRole('region', { name: 'En cours' })
    .waitFor({ timeout: 6000 })
    .catch(() => {});

  const card = await p.evaluate(() => {
    const s = document.querySelector('section[aria-label="En cours"]');
    return s
      ? {
          text: s.innerText,
          bar: [...s.querySelectorAll('[data-part]')].map(
            (b) => b.dataset.part
          ),
        }
      : null;
  });
  ok(
    '« En cours » remplace la séance du jour : la séance 2',
    /Haut du corps/.test(card?.text ?? '') &&
      (await p
        .getByRole('region', { name: /Aujourd|La prochaine/ })
        .count()) === 0,
    lines(card?.text).slice(0, 2).join(' | ')
  );
  ok(
    '  → le bloc et la série où l’on s’est arrêté, et depuis quand',
    /Bloc 2 sur 2/.test(card?.text ?? '') &&
      /Série 3 sur 4/.test(card?.text ?? '') &&
      /commencée il y a \d+ min/.test(card?.text ?? ''),
    lines(card?.text).slice(1, 5).join(' | ')
  );
  ok(
    '  → la barre : le Tabata fait, deux séries sur sept du renfo',
    (card?.bar ?? []).join(' ') === '100 29',
    (card?.bar ?? []).join(' ')
  );

  await p
    .getByRole('button', { name: 'Reprendre', exact: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Reprendre » rouvre la séance au même endroit, sans redemander',
    (await p
      .getByRole('dialog', { name: 'Reprendre où tu en étais ?' })
      .count()) === 0 && /^Bloc 2 sur 2 · série 3 sur 4/.test(await where(p)),
    await where(p)
  );

  // Le coach modifie la séance : la position gardée ne désigne plus rien
  // de sûr.
  const edited = {
    ...PROGRAM,
    sessions: PROGRAM.sessions.map((s) =>
      s._id === 'sess2'
        ? { ...s, updatedAt: new Date(2026, 10, 14, 11).toISOString() }
        : s
    ),
  };
  const PROGRAM_URL = /\/api\/client\/program(\?|$)/;
  const editedRoute = (r) =>
    r.fulfill({ json: { program: edited, coaches: COACHES } });
  await ctx.route(PROGRAM_URL, editedRoute);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const region = p.getByRole('region', { name: 'En cours' });
  ok(
    'modifiée par le coach depuis : seulement « Recommencer »',
    (await region.getByRole('button', { name: 'Recommencer' }).count()) === 1 &&
      (await region.getByRole('button', { name: /Reprendre/ }).count()) === 0,
    lines(await region.innerText().catch(() => '')).join(' | ')
  );
  await ctx.unroute(PROGRAM_URL, editedRoute);

  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .getByRole('button', { name: 'Recommencer depuis le début' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Recommencer la séance ?' });
  ok(
    '« Recommencer depuis le début » demande d’abord',
    /Tu perdras ce que tu as coché/.test(
      await sheet.innerText().catch(() => '')
    )
  );
  await sheet
    .getByRole('button', { name: 'Recommencer', exact: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  await settle(p);
  const record = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('kettle-seance-sess2') ?? 'null')
  );
  ok(
    '  → puis repart de l’ouverture, rien de coché',
    (await p.getByRole('button', { name: /C'est parti/ }).count()) === 1 &&
      record?.step === 0 &&
      record?.done.length === 0,
    JSON.stringify({ step: record?.step, done: record?.done })
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
