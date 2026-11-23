/**
 * Ce que chaque suite refait : ouvrir un navigateur, se connecter, lancer une
 * séance guidée, lire l'écran.
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

/** L'adresse du front. `KETTLE_BASE` la remplace — pour viser un aperçu de
 * déploiement plutôt que le serveur de développement. */
export const BASE = process.env.KETTLE_BASE ?? 'http://localhost:5173';

/**
 * Où se trouve Chromium, quand il faut le dire.
 *
 * Ce conteneur en embarque un à un chemin fixe et interdit d'en télécharger
 * un autre, si bien que le chemin était écrit en dur. Le banc devenait alors
 * inexécutable partout ailleurs — y compris sur un exécuteur de CI, qui est
 * précisément l'endroit où il doit tourner sans que personne ne le demande.
 *
 * Donc : un `CHROME_PATH` explicite l'emporte, l'exemplaire du conteneur sert
 * quand il est là, et sinon on ne dit rien et l'on laisse Playwright résoudre
 * sa propre installation. Trois cas, aucune configuration à retenir.
 */
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const CHROME =
  process.env.CHROME_PATH ??
  (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
/** Un téléphone : 390 × 844, c'est-à-dire un iPhone 14. La plupart des
 * défauts que ce banc a trouvés n'existent qu'à cette taille. */
export const MOBILE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/**
 * Le coach du client de démonstration, tel que `GET /api/client/program` le
 * rend. Une suite qui compose son propre programme le joint à sa réponse :
 * sans lui, l'écran retombe sur « ton coach », et un bouton « Envoyer à
 * Julie » qu'on cherche n'existe pas.
 */
export const COACHES = [{ firstName: 'Julie' }];

/**
 * Le serveur d'essai de cette suite.
 *
 * Le front de développement vise toujours `localhost:3001`. Quand le lanceur
 * fait tourner plusieurs suites à la fois, chacune reçoit son propre serveur
 * sur son propre port — sans quoi l'état de l'une (une séance envoyée, un
 * exercice créé) fuirait dans l'autre. `API` est l'adresse à utiliser depuis
 * Node ; ce qui part du navigateur est détourné par `launch`.
 */
export const MOCK_PORT = Number(process.env.KETTLE_MOCK_PORT ?? 3001);
export const API = `http://localhost:${MOCK_PORT}`;

/**
 * Ouvre un navigateur, en laissant Playwright trouver le sien quand on n'a
 * rien à lui dire.
 *
 * Quand la suite a son propre serveur d'essai, chaque contexte détourne vers
 * lui ce que la page envoie à `localhost:3001`. La page n'en voit rien :
 * même adresse, mêmes cookies. Une route posée par une suite passe devant
 * celle-ci ; si elle laisse passer la requête, c'est par `fallback()` et non
 * `continue()`, qui l'enverrait au port d'origine sans passer par ici.
 */
/**
 * Brider le processeur de chaque page : `KETTLE_CPU_THROTTLE=4` la rend
 * quatre fois plus lente.
 *
 * La CI est plus lente que la machine où l'on écrit les suites — 8 min
 * contre 6 —, et c'est là seulement que tombaient les lectures faites
 * avant l'état qu'elles vérifiaient : un focus lu avant que la feuille ne
 * le prenne, une liste lue avant d'être dessinée. Bridé, le banc les
 * montre ici, avant la poussée.
 */
const CPU_THROTTLE = Number(process.env.KETTLE_CPU_THROTTLE ?? 1);

export const launch = async () => {
  const browser = await chromium.launch(
    CHROME ? { executablePath: CHROME } : {}
  );
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const ctx = await newContext(options);
    track(ctx);
    // Fermer un contexte pendant qu'une navigation s'engage — une
    // déconnexion qui recharge la page, juste avant `ctx.close()` — prenait
    // quatre-vingt-dix secondes à Chromium, et une suite entière restait
    // pendue. La fermeture est donc bornée : un contexte qui tarde finit
    // en arrière-plan, et `browser.close()`, lui rapide, le ramasse.
    const close = ctx.close.bind(ctx);
    ctx.close = (closeOptions) =>
      Promise.race([
        close(closeOptions),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    if (CPU_THROTTLE > 1)
      ctx.on('page', (page) =>
        ctx
          .newCDPSession(page)
          .then((cdp) =>
            cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE })
          )
          .catch(() => {})
      );
    if (MOCK_PORT !== 3001)
      await ctx.route(/^http:\/\/localhost:3001\//, (route) =>
        route.continue({
          url: route
            .request()
            .url()
            .replace('localhost:3001', `localhost:${MOCK_PORT}`),
        })
      );
    return ctx;
  };
  return browser;
};

/**
 * Les requêtes en vol d'un contexte : le programme, l'historique, un envoi,
 * un morceau de code chargé à la demande.
 *
 * C'est l'état que le banc attend, plutôt qu'une durée. Il attendait 258
 * fois une durée fixe — 300 ms ici, 1 800 là —, choisie un jour où la
 * machine allait vite : trop courte, l'assertion lisait l'écran d'avant ;
 * trop longue, le banc payait l'attente à chaque passage.
 *
 * Une navigation remet le compte à zéro. Ce qu'elle interrompt — un
 * morceau de code en cours de chargement, la connexion lancée juste avant —
 * ne signale pas toujours sa fin : compté, il restait « en vol » pour
 * toujours, et chaque attente butait sur son plafond.
 */
const track = (ctx) => {
  const open = new Set();
  ctx.__open = open;
  ctx.on('request', (request) => open.add(request));
  ctx.on('requestfinished', (request) => open.delete(request));
  ctx.on('requestfailed', (request) => open.delete(request));
  ctx.on('page', (page) =>
    page.on('framenavigated', (frame) => {
      if (frame !== page.mainFrame()) return;
      for (const request of open)
        if (!request.isNavigationRequest()) open.delete(request);
    })
  );
};

/**
 * Attendre que la page se soit posée : plus aucune requête en vol depuis
 * `quiet` millisecondes, puis plus aucune animation qui finit.
 *
 * Le calme compte, pas seulement le zéro : une requête en appelle une autre
 * — la session, puis le programme, puis le morceau de l'écran — et entre
 * deux, le compte retombe à zéro le temps d'un rendu. Un clic qui ne
 * demande rien au serveur se pose en un calme : React a rendu bien avant.
 *
 * Les animations ensuite, parce qu'une feuille qui monte en 380 ms ou une
 * carte qui glisse vers sa couleur se lisent mal en route : la pause
 * « coupait » deux pixels un passage sur deux, et la prochaine séance
 * avait parfois le fond des autres. Seules comptent celles de moins d'une
 * seconde — le mouvement d'une interface qui se pose. Au-delà, c'est une
 * horloge ou une fête : l'anneau d'un repos avance d'un cran par seconde,
 * et l'attendre faisait perdre deux secondes au repos à chaque lecture ; les
 * confettis tombent en 2,5 s ; le personnage se balance sans fin.
 *
 * Il ne lit pas l'horloge de la page, que certaines suites figent : le
 * plafond se compte côté Node.
 *
 * Ce qui tarde sans réseau ni animation — une saisie qui attend qu'on
 * s'arrête de taper, trois secondes qui ne doivent rien coûter — n'est pas
 * couvert : `autosaved` et `hold` le disent, avec leur raison. Un plafond
 * atteint se dit aussi : c'est une requête qui ne revient pas, et une suite
 * qui ralentit sans raison.
 */
export const settle = async (p, { quiet = 150, timeout = 8_000 } = {}) => {
  const open = p.context().__open ?? new Set();
  const until = Date.now() + timeout;
  let calmSince = Date.now();
  while (Date.now() < until) {
    if (open.size > 0) calmSince = Date.now();
    else if (Date.now() - calmSince >= quiet) {
      // Le réseau calme ne dit pas que la page a fini : la réponse est
      // arrivée, mais la lire, la décoder, la notifier et la rendre sont
      // autant de tâches qui attendent leur tour — et le rendu demandera
      // peut-être le morceau de l'écran suivant. Sur la CI, plus lente,
      // les lectures tombaient au milieu. Si une requête part entre-temps,
      // le calme recommence.
      if ((await pageStill(p, open)) && open.size === 0)
        return animationsDone(p);
      calmSince = Date.now();
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  console.log(
    `[settle] encore en vol après ${timeout} ms : ${[...open]
      .map((request) => request.url())
      .join(', ')}`
  );
};

/**
 * Un tour de la page : un message posté à soi-même, qui ne revient
 * qu'après les tâches déjà en file — dont le rendu que React a programmé
 * par le même moyen —, avec le nombre de changements du DOM. Ni minuteur
 * ni image d'animation : certaines suites figent l'horloge de la page, et
 * les deux s'y arrêteraient.
 */
const pageTurn = (p) =>
  p
    .evaluate(
      () =>
        new Promise((resolve) => {
          // Le compteur s'installe au premier tour, dans le document : posé
          // dans chaque contexte par `addInitScript`, il faisait durer la
          // fermeture d'un contexte quatre-vingt-dix secondes quand elle
          // tombait pendant une navigation — après une déconnexion, deux
          // suites sur cinquante-huit. Seuls des tours successifs se
          // comparent : ce qui a changé avant lui ne compte pas.
          if (window.__kettleMutations === undefined) {
            window.__kettleMutations = 0;
            new MutationObserver(() => {
              window.__kettleMutations += 1;
            }).observe(document, {
              subtree: true,
              childList: true,
              attributes: true,
              characterData: true,
            });
          }
          const channel = new MessageChannel();
          channel.port1.onmessage = () => resolve(window.__kettleMutations);
          channel.port2.postMessage(null);
        })
    )
    .catch(() => -1);

/**
 * La page est immobile : trois tours de suite sans que le DOM change ni
 * qu'une requête parte. Un seul tour ne suffisait pas —
 * mesuré avec le processeur bridé, la liste des modèles se dessinait deux
 * tâches après le premier : TanStack Query notifie par un minuteur à zéro,
 * et React rend ensuite.
 *
 * Plafonné à 400 ms : une page qui ne s'arrête jamais — un chronomètre, un
 * anneau qui avance — ne doit pas faire attendre chaque lecture jusqu'au
 * plafond de `settle`. Au-delà, on se contente du calme du réseau, comme
 * avant.
 */
const pageStill = async (p, open, cap = 400) => {
  const until = Date.now() + cap;
  let last = await pageTurn(p);
  let still = 0;
  while (Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, 15));
    const now = await pageTurn(p);
    if (open.size > 0) return false;
    if (now !== last) {
      last = now;
      still = 0;
    } else if (++still >= 3) return true;
  }
  return true;
};

/** Les animations et transitions en cours de moins d'une seconde,
 * attendues jusqu'à `cap` millisecondes. */
const animationsDone = (p, cap = 1_000) =>
  Promise.race([
    p
      .evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter(
              (animation) =>
                (animation.playState === 'running' || animation.pending) &&
                Number(
                  animation.effect?.getComputedTiming().endTime ?? Infinity
                ) < 1_000
            )
            .map((animation) => animation.finished.catch(() => {}))
        ).then(() => {})
      )
      .catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, cap)),
  ]);

/**
 * Attendre qu'une couche parte — un tiroir, une feuille — le temps de son
 * animation de sortie, et pas plus.
 *
 * Ce n'est pas une assertion creuse : si la couche reste, l'attente cesse
 * après son plafond et l'assertion qui suit la trouve encore là.
 */
export const gone = (locator, timeout = 3000) =>
  locator
    .first()
    .waitFor({ state: 'detached', timeout })
    .catch(() => {});

/**
 * Attendre que l'atelier ait enregistré une valeur.
 *
 * Un changement de valeur — un nom, une consigne — part 800 ms après la
 * dernière frappe (`useProgramAutoSave`) : aucune requête n'est en vol
 * avant, et `settle` rendrait la main trop tôt. On laisse passer le délai,
 * puis on attend la requête.
 */
export const autosaved = async (p) => {
  await hold(
    p,
    900,
    "l'atelier n'envoie une valeur que 800 ms après la dernière frappe"
  );
  await settle(p);
};

/**
 * Une durée voulue : c'est le temps lui-même qui est éprouvé, ou ce qui ne
 * dépend d'aucune requête — une saisie qui attend qu'on s'arrête de taper,
 * une animation dont on lit la fin. `why` le dit, pour que personne ne la
 * remplace par `settle` sans savoir ce qu'elle attend.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hold = (p, ms, why) => p.waitForTimeout(ms);

let failures = 0;
/**
 * Une assertion, et sa ligne de sortie.
 *
 * `OK` et `FAIL` sont lus par le lanceur : il compte les uns et cherche les
 * autres. Ce sont des marqueurs, pas du texte — d'où l'anglais. Ce qui suit
 * est une phrase, et se lit en français.
 *
 * `extra` porte ce qu'on a réellement lu à l'écran : une assertion qui tombe
 * sans dire ce qu'elle a vu oblige à relancer le banc pour le savoir.
 */
export const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(
    `${cond ? 'OK  ' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`
  );
};
/** Le compte des assertions tombées : c'est lui qui décide du code de
 * sortie de la suite. */
export const failureCount = () => failures;

/**
 * Les espaces insécables cassent les expressions écrites à la main.
 *
 * L'application en pose partout — « 45 s », « 12 min » — et une assertion qui
 * cherche « 45 s » avec une espace ordinaire tombe sans que rien ne soit
 * cassé. On les ramène donc toutes à l'espace ordinaire avant de comparer.
 */
export const clean = (t) => (t ?? '').replace(/[\u00A0\u202F\u2009]/g, ' ');

/**
 * Les cartes de bienvenue, déjà vues sur cet appareil (F8b).
 *
 * À part de `signIn` pour les suites qui se connectent elles-mêmes — celle
 * de l'accueil installe son horloge avant : son client sans séance est
 * exactement celui à qui les cartes se montrent.
 */
export const markWelcomed = (ctx) =>
  ctx.addInitScript(() => {
    try {
      localStorage.setItem('kettle:welcome-seen', '1');
    } catch {
      // Sans stockage, les cartes s'affichent : la suite le dira.
    }
  });

/**
 * Se connecter, par la porte de développement du serveur d'essai.
 *
 * La connexion passe par Google en production : la rejouer demanderait un
 * compte réel et un consentement à chaque exécution. Le serveur d'essai pose
 * donc le cookie de session directement, et c'est la seule chose que ce banc
 * simule.
 *
 * Les erreurs de page sont relayées dans la sortie : sans cela, une exception
 * React rend l'écran vide et les assertions tombent en accusant l'assertion.
 *
 * Le client du décor a déjà vu les cartes de bienvenue (F8b) : elles ne
 * s'affichent qu'une fois par appareil, et sans cette marque, toute suite
 * qui sert un historique vide les trouverait devant son écran. Seule
 * `verify_firststeps` les rouvre, avec `{ welcomed: false }`. La marque est
 * posée avant chaque chargement, donc aussi après un `localStorage.clear()`.
 */
export const signIn = async (ctx, { welcomed = true } = {}) => {
  if (welcomed) await markWelcomed(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(async () => {
    await fetch('http://localhost:3001/api/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });
  return p;
};

/**
 * Franchir le décompte 3, 2, 1 sans l'attendre.
 *
 * Toucher l'écran passe tout de suite à la suite : c'est le geste de
 * quelqu'un qui est déjà en place, et c'est celui du banc, qui n'a aucune
 * raison de passer trois secondes par séance à regarder des chiffres.
 */
export const skipCountdown = async (p) => {
  const countdown = p.getByRole('button', { name: /^Départ dans/ });
  if (await countdown.count()) {
    await countdown.click();
    await settle(p);
  }
};

/**
 * Quitter la séance en la gardant sur l'appareil : la pause, puis
 * « Arrêter et reprendre plus tard ».
 *
 * « Quitter » n'existe plus ; la pause le remplace, et c'est elle qui dit
 * qu'on reprendra. Les suites qui sortent puis reviennent passent par ici.
 */
export const leaveSession = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await settle(p);
  await p
    .getByRole('button', { name: 'Arrêter et reprendre plus tard' })
    .click();
  await settle(p);
};

/**
 * Terminer la séance en route, par la pause.
 *
 * C'est la sortie qui existe toujours, quel que soit le bloc et quoi que
 * dise le bouton principal : elle était un lien dans la scène, partagé avec
 * « Passer ce bloc » sous un libellé qui changeait selon le bloc.
 */
export const finishFromPause = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await settle(p);
  await p
    .getByRole('button', { name: 'Terminer la séance maintenant' })
    .click();
  await settle(p);
};

/**
 * Le bouton de la fiche qui ouvre la séance guidée : « Démarrer », ou
 * « Reprendre » quand elle est en cours sur l'appareil.
 */
export const START = /^(Démarrer|Reprendre)$/;

/**
 * « Je l'ai déjà faite » : la feuille qui demande la date, puis
 * « Continuer ». On arrive sur « Mes charges ».
 *
 * Le bouton se cherche dans la feuille : « Mes charges » en porte un du
 * même nom, et c'est celui de la feuille qu'on veut.
 */
export const declareDone = async (p) => {
  await p.getByRole('button', { name: /^Je l.ai déjà faite$/ }).click();
  await settle(p);
  await p
    .getByRole('dialog', { name: /sans l.application/ })
    .getByRole('button', { name: 'Continuer', exact: true })
    .click();
  await settle(p);
};

/**
 * Ouvrir une séance et entrer en mode guidé.
 *
 * Les attentes portent sur le réseau et non sur un élément précis : la
 * séance charge son programme, puis monte son plein écran, et attendre
 * l'apparition d'un sélecteur ferait de chaque changement de maquette une
 * panne du banc. Elles portaient sur des durées — 2,8 s par séance ouverte,
 * quelle que soit la machine ; c'est 1,2 s.
 */
export const start = async (p, sess) => {
  await p.goto(`${BASE}/client/session/${sess}`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p.getByRole('button', { name: START }).click();
  await settle(p);
  // L'écran d'ouverture porte la note du coach : on le franchit pour
  // atteindre la séance elle-même.
  const c = p.getByRole('button', { name: /C'est parti/ });
  if (await c.count()) {
    await c.click();
    await settle(p);
    await skipCountdown(p);
  }
};

/**
 * Où l'on en est, lu sur la barre de progression : « Bloc 2 sur 3 · tour 3
 * sur 10 — EMOM ».
 *
 * C'est le seul repère fiable : le texte de l'écran annonce le bloc suivant
 * dès le dernier tour, ce qui donne l'impression qu'on y est déjà. Le format
 * du bloc vient en dernier, pour qu'un motif comme `/— EMOM$/` le désigne
 * sans dépendre du rang.
 */
export const where = (p) =>
  p.evaluate(
    () =>
      document
        .querySelector('[aria-label="Séance guidée"] [role="progressbar"]')
        ?.getAttribute('aria-valuetext') ?? ''
  );

/** Tout ce que le plein écran affiche, en texte : c'est là-dessus que la
 * plupart des assertions portent. */
export const guidedScreen = (p) =>
  p
    .evaluate(
      () =>
        document.querySelector('[aria-label="Séance guidée"]')?.innerText ?? ''
    )
    .then(clean);

/** Le texte de toutes les boîtes ouvertes — le bilan, les confirmations. */
export const dialogs = (p) =>
  p
    .evaluate(() =>
      [...document.querySelectorAll('[role="dialog"]')]
        .map((d) => d.innerText)
        .join('\n')
    )
    .then(clean);

/**
 * Le repos entre deux séries se pose dans la liste et non en plein écran :
 * son bouton s'appelle « Passer », et rien d'autre ne porte exactement ce
 * nom.
 */
export const skipRest = async (p) => {
  const r = p.getByRole('button', { name: 'Passer', exact: true });
  if (await r.count()) {
    await r.click();
    await settle(p);
  }
};

/**
 * L'écran « Bloc suivant », franchi d'une touche quand il est là.
 *
 * Il se pose trois secondes entre deux blocs, puis s'efface seul. Les
 * suites qui traversent une séance le touchent, comme quelqu'un qui est
 * déjà en place : attendre ses trois secondes à chaque bloc coûterait au
 * banc sans rien éprouver. `verify_chaining` éprouve qu'il s'efface seul.
 */
export const pastInterlude = async (p) => {
  const go = p.getByRole('button', { name: /^Partir tout de suite/ });
  if (await go.count()) {
    await go.click();
    await settle(p);
  }
};

/**
 * Lancer l'horloge d'un bloc chronométré : « Lancer », puis le décompte
 * franchi d'une touche.
 */
export const launchClock = async (p) => {
  await pastInterlude(p);
  // Absent, il n'est pas cliqué : c'est l'assertion qui juge, la suite ne
  // plante pas sur un bouton qui manque.
  const button = p.getByRole('button', { name: 'Lancer', exact: true });
  if (!(await button.count())) return;
  await button.click();
  await settle(p);
  await skipCountdown(p);
};

/**
 * Ce que dit l'horloge d'un bloc chronométré : son étiquette, « Tour 3 sur
 * 10 — 42 secondes restantes ». `null` hors d'un tel bloc.
 */
export const timerLabel = (p) =>
  p
    .locator('[role="timer"]')
    .first()
    .getAttribute('aria-label', { timeout: 1000 })
    .then(clean)
    .catch(() => null);

/**
 * Passer le bloc en cours par la pause. C'est le chemin d'un bloc
 * chronométré, qui n'a plus de bouton « Suivant » : les tours y passent à
 * l'horloge.
 */
export const passBlock = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await settle(p);
  await p.getByRole('button', { name: 'Passer ce bloc' }).click();
  await settle(p);
  await pastInterlude(p);
};

/**
 * Un écran plus loin, quel qu'il soit.
 *
 * L'écran « Bloc suivant » ne compte pas : il se franchit avec le geste qui
 * l'a fait venir, et une suite qui compte ses pas n'a pas à savoir s'il en
 * passe un.
 *
 * Le bouton principal quand il y en a un — une série, un repos, la fin d'un
 * bloc. Sur un bloc chronométré il n'y en a pas : la flèche « Tour suivant »,
 * et au dernier tour, où elle s'efface, la pause et « Passer ce bloc ». Les
 * suites qui traversent une séance pour atteindre un écran passent par ici,
 * sans avoir à savoir quel format elles franchissent.
 */
export const advance = async (p) => {
  await pastInterlude(p);
  const main = p.getByRole('button', {
    name: /^(Fait|Série faite|Palier fait|Suivant|Bloc suivant|Passer|Terminer)$/,
  });
  if (await main.count()) {
    await main.first().click();
    await settle(p);
    await pastInterlude(p);
    return;
  }
  const round = p.getByRole('button', { name: 'Tour suivant', exact: true });
  if (await round.count()) {
    await round.click();
    await settle(p);
    return;
  }
  await passBlock(p);
};

/**
 * De la fin d'une séance jusqu'au ressenti, quel que soit le chemin.
 *
 * Menée en mode guidé, la séance finit sur l'écran de fête : « Continuer ».
 * Déclarée faite sans lui, elle demande encore les charges : « Passer au
 * ressenti ». Les suites qui éprouvent autre chose que ces écrans les
 * franchissent par ici.
 */
export const reachFeeling = async (p) => {
  for (const name of [/^Continuer$/, /Passer au ressenti/]) {
    const button = p.getByRole('button', { name });
    if (await button.count()) {
      await button.first().click();
      await settle(p);
      return;
    }
  }
};
