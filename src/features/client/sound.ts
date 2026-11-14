import storage from '@/shared/utils/storage';

/**
 * Les signaux sonores de la séance guidée.
 *
 * Il n'y en avait aucun. La fin d'un tour ne s'annonçait que par une
 * vibration, et Safari sur iPhone n'en fournit pas : sur un iPhone, un EMOM
 * changeait de tour en silence, téléphone posé au sol, pendant que le client
 * regardait sa kettlebell.
 *
 * Quatre signaux, pas un par événement. Une série validée ou un tour ajouté
 * ne sonnent pas : c'est un geste que la personne vient de faire, elle n'a
 * pas besoin qu'on le lui annonce. Le son est réservé à ce que l'horloge
 * décide sans elle.
 */
export type Cue =
  /** Une des trois dernières secondes d'un tour, d'un repos, d'une durée. */
  | 'tick'
  /** Le temps est écoulé : tour suivant, fin du repos, bascule effort–repos. */
  | 'go'
  /** Un bloc se termine. */
  | 'blockEnd'
  /** La séance se termine. */
  | 'sessionEnd';

/** Une note : sa hauteur, son départ et sa durée, en millisecondes. */
export interface Note {
  frequency: number;
  at: number;
  duration: number;
}

/**
 * Ce que chaque signal joue.
 *
 * Les hauteurs se répondent pour qu'on les distingue sans regarder : le bip
 * des dernières secondes est court et grave, celui du départ long et plus
 * aigu — c'est l'ordre « prêt… partez ». Les fins montent : deux notes pour
 * un bloc, trois pour la séance, et la troisième est celle du départ, qu'on
 * a entendue toute la séance.
 *
 * Des données et non du code : c'est ce qui permet de les éprouver sans
 * haut-parleur.
 */
export const CUES: Record<Cue, Note[]> = {
  tick: [{ frequency: 880, at: 0, duration: 90 }],
  go: [{ frequency: 1320, at: 0, duration: 400 }],
  blockEnd: [
    { frequency: 660, at: 0, duration: 140 },
    { frequency: 990, at: 170, duration: 220 },
  ],
  sessionEnd: [
    { frequency: 660, at: 0, duration: 140 },
    { frequency: 880, at: 170, duration: 140 },
    { frequency: 1320, at: 340, duration: 420 },
  ],
};

// ─── Le réglage ─────────────────────────────────────────────────────────────

/**
 * On n'écrit que le refus. Le son est actif par défaut : une clé absente —
 * premier lancement, stockage refusé, navigation privée — doit donner le
 * réglage par défaut, et non un silence que personne n'a demandé.
 */
const KEY = 'kettle-sound';
const MUTED = 'off';

const listeners = new Set<() => void>();

/** Le son est-il actif sur cet appareil ? */
export const isSoundEnabled = (): boolean => storage.getItem(KEY) !== MUTED;

/**
 * Couper ou remettre le son, et prévenir ceux qui l'affichent.
 *
 * Le réglage se voit à deux endroits — l'icône de la séance et « Mon
 * compte » — et un seul des deux le change à la fois : sans cet avis,
 * l'autre garderait l'ancien état jusqu'au rechargement.
 */
export const setSoundEnabled = (enabled: boolean): void => {
  if (enabled) storage.removeItem(KEY);
  else storage.setItem(KEY, MUTED);
  listeners.forEach((notify) => notify());
};

/** S'abonner aux changements du réglage. Rend de quoi se désabonner. */
export const subscribeToSound = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// ─── Le lecteur ─────────────────────────────────────────────────────────────

/** Le volume de crête. Assez pour passer au-dessus d'une salle, pas assez
 * pour saturer le haut-parleur d'un téléphone. */
const PEAK = 0.5;
/** Monter et descendre en quelques millisecondes : un son coupé net claque. */
const ATTACK = 0.01;
const RELEASE = 0.03;

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;
let sounding: OscillatorNode[] = [];

/**
 * Ouvrir la sortie audio. À appeler depuis un geste de la personne.
 *
 * Un navigateur ne laisse pas une page émettre un son qu'aucun geste n'a
 * autorisé, et Safari est le plus strict : le contexte doit être créé, ou
 * repris, dans le gestionnaire même d'une touche. Une fois ouvert, les
 * signaux que l'horloge déclenche ensuite passent.
 *
 * On peut l'appeler à chaque touche : il ne fait rien quand la sortie est
 * déjà ouverte, et la rouvre quand un appel téléphonique l'a suspendue.
 */
export const unlockSound = (): void => {
  try {
    const Constructor: AudioContextConstructor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor })
        .webkitAudioContext;
    if (!Constructor) return;
    context ??= new Constructor();
    if (context.state !== 'running') void context.resume();
  } catch {
    // Pas de son n'est pas une panne : la séance se suit sans lui.
  }
};

/** Programmer les notes d'un signal sur la sortie ouverte. */
const schedule = (output: AudioContext, cue: Cue): void => {
  sounding.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // Déjà terminé.
    }
  });
  sounding = [];

  const now = output.currentTime;
  for (const note of CUES[cue]) {
    const start = now + note.at / 1000;
    const end = start + note.duration / 1000;

    const oscillator = output.createOscillator();
    const gain = output.createGain();
    // Un triangle plutôt qu'une sinusoïde : ses harmoniques le font
    // ressortir sur le petit haut-parleur d'un téléphone, sans la dureté
    // d'un signal carré.
    oscillator.type = 'triangle';
    oscillator.frequency.value = note.frequency;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(PEAK, start + ATTACK);
    gain.gain.setValueAtTime(PEAK, Math.max(start + ATTACK, end - RELEASE));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(output.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
    sounding.push(oscillator);
  }
};

/** Au-delà, un signal resté en attente n'annonce plus rien d'actuel. */
const STALE_AFTER = 400;

/**
 * Jouer un signal.
 *
 * Un signal remplace celui qui joue encore. Le dernier tour d'un bloc
 * déclenche à la fois « le temps est écoulé » et « le bloc se termine », à
 * quelques millisecondes d'écart : superposés, ils donnaient un accord
 * indistinct. Le second est le plus précis des deux, et c'est lui qu'on
 * entend.
 *
 * Quand la sortie est encore en train de s'ouvrir, le signal attend qu'elle
 * le soit — mais pas longtemps. Le premier bip du décompte est demandé dans
 * le geste même qui ouvre la sortie, une fraction de seconde trop tôt : sans
 * cette attente il était perdu. Sans la limite, un bip demandé alors que
 * rien n'autorisait le son serait joué des minutes plus tard, à la première
 * touche.
 *
 * Elle respecte le bouton silencieux du téléphone, et c'est voulu : un son
 * qui passerait outre serait un son qu'on ne peut plus faire taire.
 */
export const playCue = (cue: Cue): void => {
  if (!isSoundEnabled() || !context) return;
  const output = context;
  try {
    if (output.state === 'running') {
      schedule(output, cue);
      return;
    }
    const askedAt = Date.now();
    void output
      .resume()
      .then(() => {
        if (Date.now() - askedAt <= STALE_AFTER) schedule(output, cue);
      })
      .catch(() => {
        // La sortie reste fermée : pas de son, pas de panne.
      });
  } catch {
    // Un signal manqué ne doit rien casser.
  }
};
