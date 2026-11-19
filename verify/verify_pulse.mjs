/**
 * Ce que le client a fait de la séance, dans l'atelier : le pouls sous
 * l'en-tête (E8a), et la trace sous chaque exercice (E8b).
 *
 * Un bandeau gris le portait au-dessus du titre, avec un axe gradué qu'il
 * fallait lire puis compter. La maquette en fait une carte : les passages,
 * les cinq points, une phrase — « Devient trop dure depuis deux passages »
 * —, le dernier mot du client et ses étiquettes. Sur grand écran, la colonne
 * de droite tient les passages ; en dessous, le pouls les ouvre en feuille.
 *
 * L'historique du coach est vide sur le serveur d'essai : la suite lui
 * substitue celui du client. La séance 1 y a quatre passages — un sans
 * ressenti, puis Juste, Dure (douleur, « épaule ») et Trop dure (fatigue,
 * « Dur sur la fin. », pas encore lu). Le goblet y monte de 20 à 26 kg, le
 * swing de 16 à 20, et les fentes n'ont qu'une charge notée.
 */
import {
  API,
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const SESSION = (n) => `${BASE}/coach/clients/${CLIENT}/s/${n}`;
const WIDE = { viewport: { width: 1440, height: 1000 } };
const MEDIUM = { viewport: { width: 1024, height: 900 } };

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const pulseOf = (p) => p.locator('main [data-session-pulse]');

const browser = await launch();

const open = async (options, n = 1) => {
  await fetch(`${API}/api/mock/reset`, { method: 'POST' });
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(options);
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(SESSION(n), { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};

{
  console.log('\n── sur grand écran');
  const { ctx, p } = await open(WIDE);
  const pulse = pulseOf(p);
  const said = await text(pulse);

  const zones = await pulse
    .locator('[data-zone]')
    .evaluateAll((dots) => dots.map((d) => d.dataset.zone).join(','));
  ok(
    'le pouls, sous l’en-tête : les passages, les cinq points, la dérive et depuis quand',
    // L'intertitre est en capitales à l'écran, et `innerText` les rend.
    /4 passages/i.test(said) &&
      zones === 'none,none,target,hard,hard' &&
      said.includes('Devient trop dure depuis deux passages.'),
    `${said.replace(/\n+/g, ' | ')} · ${zones}`
  );
  ok(
    '  → le dernier mot du client',
    said.includes('« Dur sur la fin. »'),
    said.replace(/\n+/g, ' | ')
  );
  ok(
    '  → les étiquettes, la douleur avec son endroit',
    said.includes('Douleur · épaule') && said.includes('Fatigue'),
    said.replace(/\n+/g, ' | ')
  );
  ok(
    '  → et ce qui reste à lire',
    said.includes('1 séance à lire'),
    said.replace(/\n+/g, ' | ')
  );

  // La colonne de droite tient les passages : le pouls n'a rien à ouvrir.
  const aside = p.locator('main').getByText('Retour du client').locator('..');
  ok(
    'sur grand écran, il ne s’ouvre pas : la colonne de droite tient les passages',
    (await pulse.evaluate((el) => el.tagName).catch(() => '')) === 'DIV' &&
      (await aside.locator('[data-passage]').count()) === 3,
    `${await aside.locator('[data-passage]').count()} passage(s) dans la colonne`
  );

  await p.goto(SESSION(4), { waitUntil: 'domcontentloaded' });
  await settle(p);
  ok(
    'une séance jamais faite n’a pas de pouls',
    (await p.getByRole('button', { name: 'Nom de la séance 4' }).count()) ===
      1 && (await pulseOf(p).count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── sous chaque exercice');
  const { ctx, p } = await open(WIDE);
  const row = (name) =>
    p.locator('main [data-exercise-row]').filter({ hasText: name }).first();
  const goblet = row('Goblet Squat');
  const swing = row('Kettlebell Swing');

  ok(
    'sous chaque exercice, les charges des derniers passages, qui montent',
    (await text(goblet)).includes('20 → 24 → 26 kg') &&
      (await goblet
        .locator('[data-trace="up"] [aria-hidden] > div')
        .count()) === 3,
    (await text(goblet)).replace(/\n+/g, ' | ')
  );
  ok(
    '  → une seule charge notée : la dernière fois',
    (await text(row('Fentes marchées'))).includes(
      'Fait à 12 kg la dernière fois.'
    ),
    (await text(row('Fentes marchées'))).replace(/\n+/g, ' | ')
  );
  ok(
    '  → le mot du client qui en parle, en corail quand il a fait mal',
    (await text(swing)).includes(
      '« Épaule un peu sensible sur les swings. »'
    ) && (await swing.locator('[data-trace="warn"]').count()) === 1,
    (await text(swing)).replace(/\n+/g, ' | ')
  );

  const closed = await text(goblet);
  await goblet
    .locator(':scope > button')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → ouverte, la ligne dit ce que les charges racontent',
    !closed.includes('Elle monte seule') &&
      (await text(goblet)).includes(
        'Elle monte seule : + 6 kg en trois passages.'
      ),
    (await text(goblet)).split('\n').slice(0, 3).join(' | ')
  );
  await ctx.close();
}

{
  console.log('\n── sous 1 280 px');
  const { ctx, p } = await open(MEDIUM);
  await p
    .getByRole('button', {
      name: /^Ressentis de la séance 1 — Devient trop dure/,
    })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Ressentis · Full body A' });
  const passages = sheet.locator('[data-passage]');
  ok(
    'le pouls ouvre les passages en feuille, faute de colonne',
    (await passages.count()) === 4,
    `${await passages.count()} passage(s)`
  );
  ok(
    '  → un passage pas encore lu le dit',
    /à lire/.test(await text(passages.first())) &&
      !/à lire/.test(await text(passages.nth(1))),
    (await text(passages.first())).split('\n')[0]
  );
  await sheet
    .getByRole('button', { name: 'Tous les ressentis de Sarah' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → et mène à tous les ressentis du client',
    p.url().endsWith(`/coach/clients/${CLIENT}/journal`),
    p.url().replace(BASE, '')
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  const { ctx, p } = await open(MOBILE);
  const said = await text(pulseOf(p));
  ok(
    'le pouls tient en une phrase et cinq points',
    said === 'Devient trop dure. « Dur sur la fin. »' &&
      (await pulseOf(p).locator('[data-zone]').count()) === 5,
    said.replace(/\n+/g, ' | ')
  );
  await ctx.close();
}

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
await browser.close();
process.exit(failureCount() ? 1 : 0);
