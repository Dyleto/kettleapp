/**
 * Le haut de la séance : dans quel bloc on est, et combien il en reste.
 *
 * Il affichait « 9 / 12 » : un compteur d'écrans. Il annonçait « 9 / 9 » en
 * entrant dans un bloc où il restait sept séries, et l'on ne savait jamais
 * si l'on approchait de la fin. Il dit maintenant le rang du bloc et son
 * nom, et dessine un segment par bloc.
 *
 * Les segments se regroupaient par nom de format : deux blocs classiques à
 * la suite se fondaient en un seul, et la barre annonçait deux blocs pour
 * une séance qui en compte trois. Le décor du banc n'a pas de séance de
 * cette forme — c'est pour cela que le défaut n'avait jamais été vu — et
 * cette suite en sert une.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  clean,
} from './common.mjs';

const API = 'http://localhost:3001';
const TEAL = 'rgb(63, 168, 160)';
const AMBER = 'rgb(207, 159, 63)';

/** Le haut de la scène : rang, nom, et l'état de chaque segment. */
const header = (p) =>
  p.evaluate(() => {
    const scene = document.querySelector('[aria-label="Séance guidée"]');
    const bar = scene?.querySelector('[role="progressbar"]');
    const title = scene?.querySelector('h2');
    const rank = title?.previousElementSibling;
    const segments = bar
      ? [...bar.children].map((track) => {
          const fill = track.firstElementChild;
          return {
            part: fill
              ? Math.round(
                  (fill.getBoundingClientRect().width /
                    track.getBoundingClientRect().width) *
                    100
                )
              : 0,
            color: fill ? getComputedStyle(fill).backgroundColor : '',
          };
        })
      : [];
    return {
      rank: rank?.innerText ?? '',
      title: title?.innerText ?? '',
      segments,
      text: scene?.innerText ?? '',
      // Le haut de la scène seul : sa ligne de titre et celle de la barre.
      // La liste d'un bloc écrit « série 1 / 4 », et ce n'est pas un
      // compteur d'écrans.
      top: [title?.closest('div')?.parentElement, bar?.parentElement]
        .map((node) => node?.innerText ?? '')
        .join('\n'),
      valuetext: bar?.getAttribute('aria-valuetext') ?? '',
    };
  });

const press = async (p, name) => {
  const button = p.getByRole('button', { name });
  if (!(await button.count())) return false;
  await button.first().click();
  await p.waitForTimeout(250);
  return true;
};

const browser = await launch();

{
  console.log('\n── le rang et le nom du bloc, au lieu d’un compteur d’écrans');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  let h = await header(p);

  ok('le haut dit le rang du bloc', clean(h.rank) === 'BLOC 1 SUR 3', h.rank);
  ok('  → et son nom', h.title === 'Échauffement', h.title);
  ok(
    'plus aucun compteur d’écrans',
    h.top !== '' && !/\d+\s*\/\s*\d+/.test(clean(h.top)),
    clean(h.top).replace(/\n/g, ' · ')
  );
  ok(
    'un segment par bloc',
    h.segments.length === 3,
    `${h.segments.length} segment(s)`
  );
  ok(
    "  → rien n'est rempli avant le premier geste",
    h.segments.every((s) => s.part === 0),
    h.segments.map((s) => `${s.part} %`).join(' · ')
  );

  // Une série cochée sur deux : le bloc courant est à moitié rempli, en
  // ambre.
  await press(p, /^Fait$/);
  h = await header(p);
  ok(
    'le bloc en cours se remplit au prorata, en ambre',
    h.segments[0]?.part === 50 && h.segments[0]?.color === AMBER,
    `${h.segments[0]?.part} %, ${h.segments[0]?.color}`
  );

  // Le bloc suivant : le premier segment est fait, en sarcelle.
  await press(p, /^(Fait|Bloc suivant)$/);
  await press(p, /^Bloc suivant$/);
  h = await header(p);
  ok('on passe au bloc 2', clean(h.rank) === 'BLOC 2 SUR 3', h.rank);
  ok(
    '  → le bloc fini est plein, en sarcelle',
    h.segments[0]?.part === 100 && h.segments[0]?.color === TEAL,
    `${h.segments[0]?.part} %, ${h.segments[0]?.color}`
  );
  ok(
    '  → sans nom donné par le coach, il porte celui de son format',
    h.title === 'EMOM',
    h.title
  );
  ok(
    'la barre se lit en blocs et en tours',
    h.valuetext === 'Bloc 2 sur 3 · tour 1 sur 10 — EMOM',
    h.valuetext
  );
  await ctx.close();
}

{
  console.log('\n── un nom libre, et un repos entre deux séries');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  // Le Tabata d'abord : on le passe pour arriver au bloc nommé.
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await p.waitForTimeout(400);
  await p
    .locator('[role="dialog"][aria-label="Pause"]')
    .getByRole('button', { name: 'Passer ce bloc' })
    .click();
  await p.waitForTimeout(400);
  let h = await header(p);
  ok(
    'un bloc nommé par le coach porte son nom',
    h.title === 'Renfo' && clean(h.rank) === 'BLOC 2 SUR 2',
    `${h.rank} · ${h.title}`
  );

  await ctx.close();
}

{
  console.log('\n── deux blocs du même format à la suite');
  // Le décor n'a pas de séance de cette forme : on la compose à partir de
  // celle du serveur, en dédoublant son bloc classique.
  const { program } = await (await fetch(`${API}/api/client/program`)).json();
  const base = program.sessions.find((s) => s._id === 'sess2');
  const classic = base.blocks.find((b) => b.type === 'classic');
  const twin = {
    ...base,
    _id: 'sess-twin',
    order: 9,
    name: 'Deux renfos',
    blocks: [
      // Une seule série, puis un repos avant le bloc suivant : ce repos est
      // un écran à part entière, sans bloc à lui.
      {
        ...classic,
        _id: 'twin-a',
        order: 1,
        label: 'Renfo A',
        restBetweenRounds: 30,
        exercises: [{ ...classic.exercises[0], sets: 1 }],
      },
      { ...classic, _id: 'twin-b', order: 2, label: 'Renfo B' },
      { ...base.blocks[0], _id: 'twin-c', order: 3 },
    ],
  };
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: { program: { ...program, sessions: [...program.sessions, twin] } },
    })
  );
  const p = await signIn(ctx);
  await start(p, 'sess-twin');
  const h = await header(p);
  ok(
    'trois blocs, trois segments, même quand deux ont le même format',
    h.segments.length === 3 && clean(h.rank) === 'BLOC 1 SUR 3',
    `${h.segments.length} segment(s), ${h.rank}`
  );
  ok('  → chacun sous son nom', h.title === 'Renfo A', h.title);

  // La série, puis le bloc fini : on arrive sur le repos entre les deux
  // blocs.
  await press(p, /^Fait$/);
  await press(p, /^Bloc suivant$/);
  const resting = await header(p);
  ok(
    'le repos entre deux blocs garde le nom du bloc qu’il termine',
    /^Repos/.test(resting.valuetext) &&
      resting.title === 'Renfo A' &&
      clean(resting.rank) === 'BLOC 1 SUR 3',
    `${resting.valuetext} · ${resting.rank} · ${resting.title}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
