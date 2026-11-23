/**
 * Le rail, l'en-tête d'une séance et son menu (E7a).
 *
 * Le rail disait « 2 blocs · faite 4 fois » : un compte. Il dit maintenant
 * ce qu'une séance demande — sa durée, ses jours —, de quoi elle est faite,
 * et comment le client l'a vécue ses cinq dernières fois. L'en-tête de la
 * séance ouverte porte son nom, sa durée, une pastille des jours, et un
 * « ⋯ » qui rassemble ce qui attendait en boutons au pied de la séance ; le
 * clic droit sur le rail ouvre le même menu, sans ouvrir la séance d'abord.
 *
 * L'historique du coach est vide sur le serveur d'essai : la suite lui
 * substitue celui du client, qui porte quatre bilans de la séance 1 — un
 * sans ressenti, puis 3, 4 et 5 —, un de la 2 (4) et un de la 3 (3).
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  autosaved,
  gone,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const SESSION = (n) => `${BASE}/coach/clients/${CLIENT}/s/${n}`;
const WIDE = { viewport: { width: 1440, height: 1000 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
/** Les séances du client, lues chez le serveur et non à l'écran. */
const serverSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions;
};
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
/** Le nom accessible de l'élément qui a le focus. */
const focused = (p) =>
  p.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
const rows = (p) => p.locator('[data-session-row]');
const menuEntries = (p) =>
  p
    .getByRole('menuitem')
    .allInnerTexts()
    .then((all) => all.map(clean))
    .catch(() => []);
const openHeaderMenu = async (p, order) => {
  await p
    .getByRole('button', { name: `Menu de la séance ${order}` })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
/**
 * Choisir une entrée du menu, et attendre ce qu'elle fait.
 *
 * Le menu ne lance l'entrée qu'une fois refermé — c'est ce qui laisse le
 * focus au champ qu'elle ouvre. On attend donc qu'il soit parti, puis que
 * l'écran se taise : lu juste après le clic, le titre n'était pas encore
 * ouvert, et la suite concluait que « Renommer » ne faisait rien.
 */
const choose = async (p, name) => {
  await p
    .getByRole('menuitem', { name })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await gone(p.getByRole('menu'));
  await settle(p);
};

const browser = await launch();

/** Une page sur l'atelier du client, l'historique du client substitué à
 * celui, vide, que le serveur d'essai rend au coach. */
const open = async (n) => {
  await reset();
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(WIDE);
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(SESSION(n), { waitUntil: 'domcontentloaded' });
  await settle(p);
  await rows(p)
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  return { ctx, p };
};

{
  console.log('\n── le rail, d’un coup d’œil');
  const { ctx, p } = await open(1);
  const sessions = await serverSessions();
  const first = rows(p).nth(0);
  const fourth = rows(p).nth(3);

  ok(
    'chaque séance dit sa durée et ses jours, sans l’ouvrir',
    (await text(first)).includes('≈ 30 min · lun, jeu') &&
      (await text(rows(p).nth(1))).includes('≈ 15 min · sam'),
    (await text(first)).replace(/\n+/g, ' | ')
  );
  ok(
    '  → « jamais faite » sous celle que le client n’a jamais faite, et elle seule',
    /jamais faite/.test(await text(fourth)) &&
      !/jamais faite/.test(await text(first)) &&
      !/jamais faite/.test(await text(rows(p).nth(2))),
    (await text(fourth)).replace(/\n+/g, ' | ')
  );
  ok(
    'la barre dit la composition : un segment par bloc',
    (await first.locator('[data-composition] > *').count()) ===
      sessions[0].blocks.length,
    `${await first.locator('[data-composition] > *').count()} segments pour ${sessions[0].blocks.length} blocs`
  );

  const zones = await first
    .locator('[data-zone]')
    .evaluateAll((dots) => dots.map((d) => d.dataset.zone).join(','));
  ok(
    'les cinq derniers ressentis, du plus ancien au plus récent',
    zones === 'none,none,target,hard,hard',
    zones
  );
  ok(
    '  → et un lecteur d’écran les entend en mots',
    (await first
      .getByRole('img', { name: 'Derniers ressentis : juste, dure, dure' })
      .count()) === 1
  );
  ok(
    '  → une séance jamais faite n’en montre aucun',
    (await fourth.locator('[data-pulse]').count()) === 0
  );

  // Un point vide se lit sur la séance ouverte, posée sur `bg.raised` : pris
  // dans `line`, il s'y fondait — trois points au lieu de cinq.
  const gap = await first.evaluate((row) => {
    const rgb = (c) => c.match(/\d+(\.\d+)?/g).map(Number);
    const dot = row.querySelector('[data-zone="none"]');
    if (!dot) return -1;
    const [r, g, b, a = 1] = rgb(getComputedStyle(dot).backgroundColor);
    const alpha = a * Number(getComputedStyle(dot).opacity);
    const under = rgb(getComputedStyle(row).backgroundColor);
    return Math.max(
      ...[r, g, b].map((c, i) =>
        Math.abs(under[i] * (1 - alpha) + c * alpha - under[i])
      )
    );
  });
  ok(
    '  → un point vide se voit sur la séance ouverte',
    gap >= 16,
    `écart de ${Math.round(gap)} sur 255`
  );
  await ctx.close();
}

{
  console.log('\n── le clic droit, sans ouvrir la séance');
  const { ctx, p } = await open(1);
  await rows(p)
    .nth(2)
    .click({ button: 'right', timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const entries = await menuEntries(p);
  ok(
    'le clic droit sur une séance ouvre son menu entier',
    entries.join(' | ') ===
      'Renommer | Monter | Descendre | Dupliquer | Copier vers un client… | Enregistrer comme modèle | Supprimer la séance 3',
    entries.join(' | ')
  );

  await choose(p, 'Renommer');
  ok(
    '  → « Renommer » ouvre la séance, son nom prêt à la frappe',
    p.url().endsWith('/s/3') && (await focused(p)) === 'Nom de la séance 3',
    `${p.url().split('/').slice(-2).join('/')} · focus sur « ${await focused(p)} »`
  );
  await p.keyboard.type('Gainage');
  await p.keyboard.press('Enter');
  await autosaved(p);
  ok(
    '  → et le serveur reçoit le nom tapé',
    (await serverSessions())[2]?.name === 'Gainage',
    (await serverSessions())[2]?.name
  );

  // La séance qu'on lit, renommée depuis le rail : la page ne change pas, et
  // c'est le titre déjà affiché qui doit s'ouvrir.
  await rows(p)
    .nth(2)
    .click({ button: 'right', timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await choose(p, 'Renommer');
  ok(
    '  → même sur la séance ouverte, que rien ne remonte',
    (await focused(p)) === 'Nom de la séance 3',
    `focus sur « ${await focused(p)} »`
  );
  await p.keyboard.press('Escape');
  await ctx.close();
}

{
  console.log('\n── l’en-tête de la séance');
  const { ctx, p } = await open(1);
  const before = (await serverSessions()).length;

  ok(
    'l’en-tête dit le nom, la durée et les jours de la séance',
    clean(
      await p
        .getByRole('button', { name: 'Nom de la séance 1' })
        .innerText()
        .catch(() => '')
    ) === 'Full body A' &&
      (await p.getByText('≈ 30 min', { exact: true }).count()) === 1 &&
      (await p
        .getByRole('button', { name: 'Jours conseillés : Lun · Jeu' })
        .count()) === 1
  );

  await p
    .getByRole('button', { name: /^Jours conseillés/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('button', { name: 'mercredi' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await autosaved(p);
  const days = [...((await serverSessions())[0]?.suggestedDays ?? [])].sort();
  ok(
    'la pastille des jours s’ouvre sur place, et un jour coché part au serveur',
    days.join(',') === '0,2,3',
    days.join(',')
  );
  await p.keyboard.press('Escape');
  await settle(p);
  ok(
    '  → refermée, elle le relit, et le rail aussi',
    (await p
      .getByRole('button', { name: 'Jours conseillés : Lun · Mer · Jeu' })
      .count()) === 1 && (await text(rows(p).nth(0))).includes('lun, mer, jeu'),
    (await text(rows(p).nth(0))).replace(/\n+/g, ' | ')
  );

  await openHeaderMenu(p, 1);
  const entries = await menuEntries(p);
  ok(
    'le « ⋯ » de la séance porte tout le reste',
    entries.join(' | ') ===
      'Renommer | Ajouter un mot d’avant séance | Descendre | Dupliquer | Copier vers un client… | Enregistrer comme modèle | Supprimer la séance 1',
    entries.join(' | ')
  );

  await choose(p, 'Ajouter un mot d’avant séance');
  ok(
    '  → « Ajouter un mot d’avant séance » ouvre le champ, prêt à la frappe',
    (await focused(p)) === 'Note de la séance',
    `focus sur « ${await focused(p)} »`
  );
  await p.keyboard.press('Escape');
  await settle(p);

  await openHeaderMenu(p, 1);
  await choose(p, 'Renommer');
  const wasFocused = await focused(p);
  await p.keyboard.type('Brouillon');
  await p.keyboard.press('Escape');
  await autosaved(p);
  ok(
    '  → « Renommer » ouvre le titre ; Échap rend le nom d’avant',
    wasFocused === 'Nom de la séance 1' &&
      (await serverSessions())[0]?.name === 'Full body A' &&
      (await p.getByRole('button', { name: 'Nom de la séance 1' }).count()) ===
        1,
    `focus sur « ${wasFocused} », le serveur porte « ${(await serverSessions())[0]?.name} »`
  );

  await openHeaderMenu(p, 1);
  await choose(p, 'Dupliquer');
  await autosaved(p);
  const copied = await serverSessions();
  ok(
    '  → « Dupliquer » ouvre la copie, juste après l’original',
    p.url().endsWith('/s/2') &&
      copied.length === before + 1 &&
      copied[1]?.name === copied[0]?.name &&
      copied[1]?.blocks.length === copied[0]?.blocks.length,
    `${p.url().split('/').slice(-2).join('/')} · ${before} → ${copied.length} séances · la 2 : ${copied[1]?.name}`
  );

  await openHeaderMenu(p, 2);
  await choose(p, 'Supprimer la séance 2');
  await autosaved(p);
  ok(
    '  → « Supprimer la séance 2 » la retire, avec « Annuler »',
    (await serverSessions()).length === before &&
      (await p.getByRole('button', { name: 'Annuler' }).count()) >= 1,
    `${(await serverSessions()).length} séances`
  );
  await ctx.close();
}

{
  console.log('\n── « + Séance »');
  const { ctx, p } = await open(1);
  const before = (await serverSessions()).length;
  await p
    .getByRole('button', { name: '+ Séance' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const n = before + 1;
  // Le focus arrive après le rendu de la séance neuve : sous la charge du
  // banc complet, `settle` rendait la main avant lui. On attend l'état.
  await p
    .waitForFunction(
      (name) => document.activeElement?.getAttribute('aria-label') === name,
      `Nom de la séance ${n}`,
      { timeout: 3000 }
    )
    .catch(() => {});
  ok(
    '« + Séance » ouvre la séance neuve sur son nom, prêt à la frappe',
    p.url().endsWith(`/s/${n}`) &&
      (await focused(p)) === `Nom de la séance ${n}`,
    `${p.url().split('/').slice(-2).join('/')} · focus sur « ${await focused(p)} »`
  );
  await p.keyboard.type('Mobilité');
  await p.keyboard.press('Enter');
  await autosaved(p);
  ok(
    '  → le nom tapé part au serveur',
    (await serverSessions())[n - 1]?.name === 'Mobilité',
    (await serverSessions())[n - 1]?.name
  );

  // Revenir sur la séance ne la rouvre pas à l'écriture : la demande ne
  // vaut qu'une fois.
  await rows(p)
    .nth(0)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await rows(p)
    .nth(n - 1)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → refermé, il ne se rouvre pas en revenant sur la séance',
    p.url().endsWith(`/s/${n}`) &&
      (await p
        .getByRole('textbox', { name: `Nom de la séance ${n}` })
        .count()) === 0 &&
      (await p
        .getByRole('button', { name: `Nom de la séance ${n}` })
        .count()) === 1,
    p.url().split('/').slice(-2).join('/')
  );
  // Une séance neuve n'a aucun jour : sa pastille se lit par son seul nom,
  // et non « Jours conseillés : Jours conseillés ».
  ok(
    '  → sans jour choisi, la pastille des jours se lit par son seul nom',
    (await p
      .getByRole('button', { name: 'Jours conseillés', exact: true })
      .count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── « Enregistrer comme modèle »');
  const { ctx, p } = await open(1);
  const sessions = await serverSessions();
  await openHeaderMenu(p, 1);
  await choose(p, 'Enregistrer comme modèle');
  const sheet = p.getByRole('dialog', { name: 'Enregistrer comme modèle' });
  const field = sheet.getByRole('textbox', { name: 'Nom du modèle' });
  const selected = await field
    .evaluate(
      (input) =>
        input.value === 'Full body A' &&
        input.selectionStart === 0 &&
        input.selectionEnd === input.value.length &&
        document.activeElement === input
    )
    .catch(() => false);
  ok(
    'la feuille propose le nom de la séance, sélectionné, prêt à la frappe',
    selected,
    await field.inputValue().catch(() => '(pas de champ)')
  );
  ok(
    '  → et dit que le programme de Sarah ne bouge pas',
    (await text(sheet)).includes('Le programme de Sarah ne bouge pas.'),
    (await text(sheet)).replace(/\n+/g, ' | ').slice(0, 160)
  );

  await p.keyboard.type('Full body (base)');
  await sheet
    .getByRole('button', { name: 'Enregistrer le modèle' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const listed = (
    await (await fetch(`${API}/api/coach/templates`)).json()
  ).templates.find((t) => t.name === 'Full body (base)');
  const template = listed
    ? (await (await fetch(`${API}/api/coach/templates/${listed._id}`)).json())
        .template
    : undefined;
  ok(
    '  → « Enregistrer le modèle » le crée, avec cette seule séance',
    template?.sessions.length === 1 &&
      template.sessions[0].blocks.length === sessions[0].blocks.length &&
      (await serverSessions()).length === sessions.length,
    template
      ? `${template.sessions.length} séance(s), ${template.sessions[0]?.blocks.length} blocs`
      : '(aucun modèle de ce nom)'
  );

  const toast = p.locator('[data-scope="toast"]').filter({
    hasText: 'Modèle « Full body (base) » enregistré',
  });
  await toast
    .getByRole('button', { name: 'Voir le modèle' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → et l’annonce, avec de quoi y aller',
    !!listed && p.url().endsWith(`/coach/templates/${listed._id}/s/1`),
    p.url().replace(BASE, '')
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
