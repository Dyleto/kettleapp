/**
 * La page de la planche : chaque cadre, la maquette à gauche et
 * l'application à droite, avec ce qui les sépare quand on l'a relevé.
 *
 * À part de `board.mjs`, qui mène l'application : celui-ci ne fait que
 * mettre en page ce que l'autre a capturé, et se relance seul après une
 * relecture — `node board-page.mjs board` — sans repasser les 121 cadres.
 *
 * Les écarts viennent d'un fichier `notes.json` posé dans le dossier de la
 * planche : `frames`, un texte par identifiant de cadre ; `unseen`, ce
 * qu'aucune capture ne montre ; `date`, le jour de la relecture. Ils n'ont
 * pas leur place dans le dépôt : ils disent ce qu'une relecture a vu un
 * jour, et la planche suivante les ferait mentir. Ce qui reste vrai va au
 * plan, § 6.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Les chapitres de la maquette, par la lettre qui ouvre l'identifiant d'un
 * écran. */
const CHAPTERS = {
  c: 'Client',
  g: 'Séance guidée',
  k: 'Coach',
  x: 'Commun',
};
const SIZE_NAMES = { m: 'Téléphone', l: 'Téléphone couché', d: 'Grand écran' };

/**
 * La taille d'un JPEG, lue dans son en-tête.
 *
 * Écrite dans la page, elle réserve la place de chaque image avant son
 * chargement : 242 images chargées à la demande, sans elle, faisaient
 * sauter la page à chaque arrivée.
 */
const jpegSize = (file) => {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1];
    const length = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3)
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    i += 2 + length;
  }
  return { width: 390, height: 844 };
};

const escape = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Un cadre : sa légende, ses deux images, son écart s'il en a un. */
const frame = (dir, f, note) => {
  const shot = (side, label) => {
    const { width, height } = jpegSize(`${dir}/${side}/${f.id}.jpg`);
    return `<button class="shot" type="button" data-frame="${f.id}" data-side="${side}" aria-label="${escape(`${label} — ${f.name}, en grand`)}">
          <span class="side">${label}</span>
          <img src="${side}/${f.id}.jpg" width="${width}" height="${height}" loading="lazy" alt="${escape(`${label} : ${f.name}`)}">
        </button>`;
  };
  return `<figure class="frame ${f.size}" id="${f.id}"${note ? ' data-note' : ''}>
      <figcaption>
        <span class="size">${SIZE_NAMES[f.size]}</span>
        <b>${escape(f.name)}</b>
        ${f.when ? `<span class="when">${escape(f.when)}</span>` : ''}
      </figcaption>
      <div class="pair">
        ${shot('maquette', 'Maquette')}
        ${shot('app', 'Application')}
      </div>
      ${note ? `<p class="note"><span>Écart</span>${escape(note)}</p>` : ''}
    </figure>`;
};

/**
 * La page entière, en une chaîne : rien à charger que ses images et deux
 * polices, celles de la maquette, pour que les deux documents se lisent
 * comme un seul.
 */
export const boardPage = (dir) => {
  const screens = JSON.parse(readFileSync(`${dir}/screens.json`, 'utf8'));
  const {
    frames: notes = {},
    unseen = [],
    date,
  } = existsSync(`${dir}/notes.json`)
    ? JSON.parse(readFileSync(`${dir}/notes.json`, 'utf8'))
    : {};
  const frames = screens.flatMap((s) => s.frames);
  const noted = frames.filter((f) => notes[f.id]);
  const byChapter = Object.entries(CHAPTERS).map(([letter, title]) => ({
    letter,
    title,
    screens: screens.filter((s) => s.id.startsWith(`${letter}-`)),
  }));

  return `<title>Planche Kettle</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Figtree:wght@400;500;600;700&display=swap">
<style>
/* Deux colonnes par cadre, la maquette puis l'application, les cadres en
   grille ; un grand écran prend toute la ligne. Les jetons sont ceux de la
   maquette, pour que la planche se lise comme sa suite. */
:root {
  --page: #ECEEF0; --panel: #FFFFFF; --sunk: #E2E5E8; --ink: #15171B;
  --muted: #565B65; --line: #D2D6DB; --accent: #CF9F3F; --accent-ink: #7A5610;
  --note-bg: #FBF1DC; --note-ink: #5C420D;
  --fd: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif;
  --ft: 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page: #0F1013; --panel: #17181B; --sunk: #1E2024; --ink: #ECE8DE;
    --muted: #A6A49A; --line: #2B2D33; --accent: #CF9F3F; --accent-ink: #E9BE62;
    --note-bg: #2A2416; --note-ink: #EAD9B0;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --page: #0F1013; --panel: #17181B; --sunk: #1E2024; --ink: #ECE8DE;
  --muted: #A6A49A; --line: #2B2D33; --accent: #CF9F3F; --accent-ink: #E9BE62;
  --note-bg: #2A2416; --note-ink: #EAD9B0;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body {
  background: var(--page); color: var(--ink); font-family: var(--ft);
  font-size: 15px; line-height: 1.55; -webkit-font-smoothing: antialiased;
}
.wrap {
  max-width: 1360px; margin: 0 auto;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
h1, h2, h3 { font-family: var(--fd); text-wrap: balance; margin: 0; }
a { color: inherit; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

header.top { padding-block: 40px 24px; display: grid; gap: 14px; }
header.top h1 { font-size: clamp(2.1rem, 5vw, 3.2rem); font-weight: 800; font-stretch: 85%; letter-spacing: -0.01em; }
.lede { margin: 0; max-width: 64ch; color: var(--muted); font-size: 1.05rem; }
.lede b { color: var(--ink); }
.facts { display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 6px 0 0; }
.facts div { display: grid; }
.facts dt { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.facts dd { margin: 0; font-family: var(--fd); font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }

body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--page); }
nav.bar {
  position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5;
  background: var(--page); border-bottom: 1px solid var(--line);
}
nav.bar .wrap { display: flex; gap: 8px; align-items: center; padding-block: 10px; overflow-x: auto; scrollbar-width: none; }
nav.bar a, nav.bar button {
  flex: none; text-decoration: none; font-size: 0.86rem; font-weight: 600;
  padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--panel); cursor: pointer; white-space: nowrap;
}
nav.bar a:hover { border-color: var(--muted); }
nav.bar .filter[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #17181B; }
nav.bar .sep { flex: none; width: 1px; align-self: stretch; background: var(--line); margin-inline: 4px; }

.summary { padding-block: 28px 8px; display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); align-items: start; }
.summary section { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; display: grid; gap: 10px; min-width: 0; }
.summary h2 { font-size: 1.15rem; font-weight: 700; }
.summary ul { margin: 0; padding-left: 1.1em; display: grid; gap: 8px; }
.summary li { max-width: 70ch; }
.summary li a { font-weight: 600; text-decoration-color: var(--accent); text-underline-offset: 3px; }
.summary p { margin: 0; color: var(--muted); max-width: 70ch; }

.chapter { padding-block: 36px 0; }
.chapter > h2 { font-size: 0.8rem; font-family: var(--ft); font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-bottom: 8px; border-bottom: 2px solid var(--ink); }
.screen { padding-block: 26px 6px; display: grid; gap: 16px; scroll-margin-top: 64px; }
.screen > header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.screen h3 { font-size: 1.6rem; font-weight: 750; font-stretch: 90%; }
.screen .count { color: var(--muted); font-size: 0.9rem; }

.frames { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 460px), 1fr)); align-items: start; }
.frame { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: grid; gap: 12px; min-width: 0; scroll-margin-top: 64px; }
.frame.d, .frame.l { grid-column: 1 / -1; }
.frame figcaption { display: grid; gap: 2px; min-width: 0; }
.frame figcaption b { font-size: 1rem; }
.frame .size { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-ink); }
.frame .when { color: var(--muted); font-size: 0.88rem; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
@media (max-width: 760px) { .frame.d .pair, .frame.l .pair { grid-template-columns: 1fr; } }
.shot { display: grid; gap: 6px; padding: 0; border: 0; background: none; cursor: zoom-in; text-align: left; min-width: 0; }
.shot .side { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.shot img { display: block; width: 100%; height: auto; border-radius: 10px; background: var(--sunk); box-shadow: 0 0 0 1px var(--line); }
.shot:hover img { box-shadow: 0 0 0 2px var(--accent); }
.note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--note-bg); color: var(--note-ink); font-size: 0.9rem; display: grid; gap: 2px; }
.note span { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }

body.only-notes .frame:not([data-note]) { display: none; }
body.only-notes .screen:not(:has([data-note])) { display: none; }

footer { padding-block: 48px 64px; color: var(--muted); font-size: 0.88rem; }
footer code { font-size: 0.85rem; background: var(--sunk); padding: 1px 6px; border-radius: 6px; }

.viewer { position: fixed; inset: 0; z-index: 20; background: #0F1013; display: grid; grid-template-rows: auto 1fr; color: #ECE8DE;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
[hidden] { display: none !important; }
.viewer .head { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px max(16px, env(safe-area-inset-left, 0px)); }
.viewer .title { flex: 1 1 200px; min-width: 0; font-weight: 600; }
.viewer .title small { display: block; color: #A6A49A; font-weight: 500; }
.viewer .seg { display: inline-flex; border: 1px solid #3A3D44; border-radius: 999px; padding: 2px; }
.viewer .seg button, .viewer .nav button { border: 0; background: none; color: #ECE8DE; padding: 6px 14px; border-radius: 999px; cursor: pointer; font-weight: 600; font-size: 0.88rem; }
.viewer .seg button[aria-pressed="true"] { background: #CF9F3F; color: #17181B; }
.viewer .nav { display: inline-flex; gap: 4px; }
.viewer .nav button { border: 1px solid #3A3D44; }
.viewer .stage { overflow: auto; display: grid; place-items: start center; padding: 0 16px 24px; }
.viewer .stage img { max-width: 100%; height: auto; border-radius: 8px; }
.viewer .hint { color: #A6A49A; font-size: 0.8rem; width: 100%; }
@media (prefers-reduced-motion: no-preference) { .shot img { transition: box-shadow 120ms ease; } }
</style>

<header class="top wrap">
  <h1>Planche Kettle</h1>
  <p class="lede">Chaque cadre de la maquette <b>Nouveau design Kettle</b>, et l’application menée dans le même état : la maquette à gauche, l’application à droite. Les données diffèrent, puisque la maquette a les siennes et l’application celles du serveur d’essai du banc. Ce qui se compare, c’est l’état, la disposition et ce que l’écran dit.</p>
  <dl class="facts">
    <div><dt>Cadres</dt><dd>${frames.length}</dd></div>
    <div><dt>Écrans</dt><dd>${screens.length}</dd></div>
    <div><dt>Écarts relevés</dt><dd>${noted.length}</dd></div>
    ${date ? `<div><dt>Relue le</dt><dd>${escape(date)}</dd></div>` : ''}
  </dl>
</header>

<nav class="bar" aria-label="Chapitres">
  <div class="wrap">
    <button class="filter" type="button" aria-pressed="false" id="only-notes">Les écarts seulement</button>
    <span class="sep" aria-hidden="true"></span>
    ${byChapter
      .flatMap((c) => c.screens)
      .map((s) => `<a href="#${s.id}">${escape(s.title)}</a>`)
      .join('\n    ')}
  </div>
</nav>

<div class="wrap summary">
  <section aria-labelledby="noted-title">
    <h2 id="noted-title">Ce que la planche montre</h2>
    ${
      noted.length
        ? `<ul>${noted
            .map(
              (f) =>
                `<li><a href="#${f.id}">${escape(screens.find((s) => s.frames.includes(f)).title)} · ${escape(f.name)}</a><br>${escape(notes[f.id])}</li>`
            )
            .join('')}</ul>`
        : '<p>Aucun écart relevé : la planche n’a pas encore été relue.</p>'
    }
  </section>
  ${
    unseen.length
      ? `<section aria-labelledby="unseen-title">
    <h2 id="unseen-title">Ce qu’une capture ne montre pas</h2>
    <ul>${unseen.map((u) => `<li>${escape(u)}</li>`).join('')}</ul>
  </section>`
      : ''
  }
</div>

<main id="contenu">
${byChapter
  .map(
    (c) => `<section class="chapter wrap" aria-labelledby="ch-${c.letter}">
  <h2 id="ch-${c.letter}">${escape(c.title)}</h2>
  ${c.screens
    .map(
      (s) => `<section class="screen" id="${s.id}" aria-labelledby="t-${s.id}">
    <header><h3 id="t-${s.id}">${escape(s.title)}</h3><span class="count">${s.frames.length} cadre${s.frames.length > 1 ? 's' : ''}</span></header>
    <div class="frames">
    ${s.frames.map((f) => frame(dir, f, notes[f.id])).join('\n    ')}
    </div>
  </section>`
    )
    .join('\n  ')}
</section>`
  )
  .join('\n')}
</main>

<footer class="wrap">
  Refaite par <code>node verify/board.mjs</code>, le front et un port libre pour le serveur d’essai ; <code>node verify/board-page.mjs &lt;dossier&gt;</code> ne refait que la page.
</footer>

<div class="viewer" id="viewer" role="dialog" aria-modal="true" aria-labelledby="viewer-title" hidden>
  <div class="head">
    <div class="title" id="viewer-title"></div>
    <div class="seg" role="group" aria-label="Côté">
      <button type="button" data-side="maquette" aria-pressed="true">Maquette</button>
      <button type="button" data-side="app" aria-pressed="false">Application</button>
    </div>
    <div class="nav">
      <button type="button" id="prev" aria-label="Cadre précédent">←</button>
      <button type="button" id="next" aria-label="Cadre suivant">→</button>
      <button type="button" id="close" aria-label="Fermer">Fermer</button>
    </div>
    <div class="hint">Espace bascule d’un côté à l’autre au même endroit ; les flèches changent de cadre ; Échap ferme.</div>
  </div>
  <div class="stage"><img id="viewer-img" alt=""></div>
</div>

<script>
(() => {
  const frames = [...document.querySelectorAll('.frame')];
  const viewer = document.getElementById('viewer');
  const img = document.getElementById('viewer-img');
  const title = document.getElementById('viewer-title');
  const sides = [...viewer.querySelectorAll('.seg button')];
  let at = 0;
  let side = 'maquette';
  let opener = null;

  const visible = () => frames.filter((f) => f.offsetParent !== null);
  const show = () => {
    const f = frames[at];
    const name = f.querySelector('figcaption b').textContent;
    const screen = f.closest('.screen').querySelector('h3').textContent;
    const label = side === 'app' ? 'Application' : 'Maquette';
    img.src = side + '/' + f.id + '.jpg';
    img.alt = label + ' : ' + name;
    title.innerHTML = '';
    title.append(name);
    const small = document.createElement('small');
    small.textContent = screen + ' · ' + label;
    title.append(small);
    sides.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === side)));
  };
  const open = (id, s, from) => {
    at = frames.findIndex((f) => f.id === id);
    side = s;
    opener = from;
    viewer.hidden = false;
    show();
    viewer.querySelector('.seg button[aria-pressed="true"]').focus();
  };
  const close = () => {
    viewer.hidden = true;
    opener?.focus();
  };
  const step = (by) => {
    const list = visible();
    const i = list.indexOf(frames[at]);
    const next = list[(i + by + list.length) % list.length];
    at = frames.indexOf(next);
    show();
  };

  document.addEventListener('click', (e) => {
    const shot = e.target.closest('.shot');
    if (shot) open(shot.dataset.frame, shot.dataset.side, shot);
  });
  sides.forEach((b) => b.addEventListener('click', () => { side = b.dataset.side; show(); }));
  document.getElementById('prev').addEventListener('click', () => step(-1));
  document.getElementById('next').addEventListener('click', () => step(1));
  document.getElementById('close').addEventListener('click', close);
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.classList.contains('stage')) close(); });
  document.addEventListener('keydown', (e) => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ' && !e.target.closest('.nav')) {
      e.preventDefault();
      side = side === 'app' ? 'maquette' : 'app';
      show();
    }
  });

  const filter = document.getElementById('only-notes');
  const apply = (on) => {
    document.body.classList.toggle('only-notes', on);
    filter.setAttribute('aria-pressed', String(on));
  };
  try { apply(localStorage.getItem('planche:ecarts') === '1'); } catch { /* sans stockage, tout s'affiche */ }
  filter.addEventListener('click', () => {
    const on = filter.getAttribute('aria-pressed') !== 'true';
    apply(on);
    try { localStorage.setItem('planche:ecarts', on ? '1' : '0'); } catch { /* le choix ne survit pas, sans plus */ }
  });
})();
</script>
`;
};

// Lancé seul : refaire la page d'un dossier déjà capturé.
if (process.argv[1] === import.meta.filename) {
  const dir = resolve(process.argv[2] ?? resolve(import.meta.dirname, 'board'));
  writeFileSync(`${dir}/index.html`, boardPage(dir));
  console.log(`${dir}/index.html`);
}
