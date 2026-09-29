/**
 * Ce que le client a décidé quant au partage de son ressenti.
 *
 * `version` est celle du texte auquel il a répondu. Le serveur la compare à la
 * version en vigueur : c'est elle qui décide si la question est reposée.
 */
export interface HealthConsent {
  granted: boolean;
  decidedAt: string;
  version: string;
}

/**
 * Le compte connecté, tel que l'API le rend.
 *
 * Les trois rôles sont des booléens et non un champ unique : un même compte
 * est souvent coach ET client — un coach s'écrit ses propres séances — et un
 * rôle unique l'obligeait à deux comptes, donc à deux connexions.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
  healthConsent: HealthConsent | null;
  /** Vrai tant que le client n'a pas répondu au texte actuellement en vigueur. */
  needsHealthConsent: boolean;
}

/** Ce que l'écran « Mon compte » a besoin de savoir, rôle par rôle. */
export interface AccountSummary {
  asClient: {
    coaches: {
      firstName: string;
      lastName: string;
      picture?: string;
      linkedAt: string;
    }[];
    completedCount: number;
    /** Combien de bilans un refus effacerait. Zéro = rien à annoncer. */
    healthDataCount: number;
    healthConsent: HealthConsent | null;
    since: string;
  } | null;
  asCoach: {
    clientCount: number;
    since: string;
  } | null;
}

/**
 * Un client vu depuis la liste du coach.
 *
 * `unseenCount` et `lastEffort` n'appartiennent pas au client : ils
 * appartiennent à ce que le coach n'a pas encore lu. Ils voyagent ici parce
 * que la liste les affiche, et qu'une requête par ligne pour les chercher
 * mettait la liste à genoux au-delà d'une dizaine de clients.
 */
export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  linkedAt: Date;
  unseenCount: number;
  /** Absent tant que le client n'a pas terminé une séance. */
  lastCompletedAt?: Date;
  /**
   * Ce qu'il a dit du ressenti de la dernière séance. Absent quand elle n'en
   * portait pas — un bilan d'avant la refonte, ou terminé sans répondre.
   */
  lastEffort?: number;
}

/** Un coach vu depuis l'espace client : de quoi le nommer, rien de plus. */
export interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  hiredAt: Date;
}

/**
 * L'enveloppe d'un programme, sans ses séances.
 *
 * Un client a toujours un programme, même vide : l'API le crée au premier
 * accès. Les séances se demandent à part — la liste des clients n'a pas
 * besoin de les charger.
 */
export interface Program {
  _id: string;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Un mouvement de la bibliothèque du coach.
 *
 * Il appartient au coach (`createdBy`) et non à une séance : le même
 * « Goblet squat » sert chez tous ses clients, et corriger sa vidéo une fois
 * la corrige partout. C'est aussi pourquoi un bilan en garde un instantané —
 * voir `BlockExerciseSnapshot`.
 */
export interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  /** Nombre de séances du coach où l'exercice apparaît. Servi par l'API. */
  usageCount?: number;
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

/**
 * Les formats de bloc que l'atelier sait écrire.
 *
 * Ce n'est pas une taxonomie ouverte : chaque valeur a son rendu dans
 * l'éditeur, son minuteur dans le mode guidé et sa façon de s'écrire dans la
 * prescription. En ajouter un veut dire passer par ces trois endroits, et
 * TypeScript est ce qui le rappelle.
 */
export type BlockType =
  | 'warmup'
  | 'emom'
  | 'every'
  | 'amrap'
  | 'timecap'
  | 'chipper'
  | 'classic'
  | 'tabata'
  | 'onoff'
  | 'pyramid'
  | 'ladder';

/**
 * Une mesure que Kettle ne connaît pas — « 400 m », « 20 cal ».
 *
 * L'unité est une chaîne libre et le restera : enfermer les distances, les
 * calories et le reste dans une énumération revenait à refuser au coach tout
 * ce qui n'y figurait pas, et la liste n'a pas de fin.
 */
export interface CustomMetric {
  value: number;
  unit: string;
}

/**
 * Un exercice tel qu'il est prescrit dans un bloc.
 *
 * Il pointe vers l'exercice de la bibliothèque et porte, à côté, ce qui
 * n'appartient qu'à cette séance-là : les doses et la consigne. Le mouvement
 * est partagé, la prescription ne l'est pas.
 */
export interface BlockExercise {
  exercise: Exercise;
  order: number;
  sets?: number;
  restBetweenSets?: number;
  reps?: number;
  duration?: number;
  customMetric?: CustomMetric;
  /**
   * La consigne du coach pour cet exercice, dans cette séance-là.
   *
   * Distincte de `exercise.description`, qui décrit le mouvement en général et
   * vit dans la bibliothèque, partagée par tous les clients et toutes les
   * séances.
   */
  note?: string;
}

/**
 * Un bloc d'une séance : un format, et les exercices qu'il enchaîne.
 *
 * Presque tous les champs sont optionnels parce qu'aucun format ne les
 * utilise tous — un AMRAP a un `durationMinutes`, un Tabata un `workDuration`
 * et un `restDuration`, un classique ni l'un ni l'autre. Un type par format
 * aurait été plus juste, mais l'atelier change le type d'un bloc d'un clic,
 * en gardant ses exercices : une union discriminée l'obligerait à
 * reconstruire l'objet à chaque changement, et à perdre ce que l'autre
 * format ne porte pas.
 */
export interface SessionBlock {
  _id: string;
  type: BlockType;
  label?: string;
  order: number;
  notes?: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  rounds?: number;
  restBetweenRounds?: number;
  workDuration?: number;
  restDuration?: number;
  repsScheme?: number[];
  exercises: BlockExercise[];
}

// ─── Session ─────────────────────────────────────────────────────────────────

/**
 * Une séance du programme, telle que le coach l'a écrite.
 *
 * C'est la prescription vivante : elle change quand le coach la corrige. Ce
 * que le client a fait un jour donné vit dans `CompletedSession`, qui en
 * garde une copie figée.
 */
export interface Session {
  _id: string;
  order: number;
  /** Le nom libre du coach — « Full body A ». Absent : la séance dit son rang. */
  name?: string;
  notes?: string;
  /**
   * Les jours que le coach conseille, lundi = 0. Un conseil : un jour manqué
   * ne crée aucune dette. Absent ou vide = la séance n'est liée à aucun jour.
   */
  suggestedDays?: number[];
  blocks: SessionBlock[];
  createdAt: Date;
  updatedAt: Date;
}

/** Le programme d'un client, du point de vue de l'écran : ses séances. */
export interface ClientProgram {
  sessions: Session[];
}

/** Un client et son programme, pour l'atelier : une seule requête plutôt
 * que deux, l'écran ayant besoin des deux à la fois. */
export interface ClientWithDetails extends Client {
  program: ClientProgram;
  unseenCount: number;
}

// ─── Completed Session (snapshot) ────────────────────────────────────────────

/**
 * Un exercice figé le jour où la séance a été faite.
 *
 * `exercise` est une copie et non une référence : renommer un mouvement, ou
 * le supprimer de la bibliothèque, ne doit pas réécrire — ni vider — un
 * historique déjà enregistré. Le type est volontairement lâche
 * (`Record<string, unknown>`), l'instantané gardant ce que l'exercice
 * portait à l'époque, champs d'alors compris.
 */
export interface BlockExerciseSnapshot {
  exercise: Record<string, unknown>;
  order: number;
  sets?: number;
  restBetweenSets?: number;
  reps?: number;
  duration?: number;
  customMetric?: CustomMetric;
  /** La consigne du coach, telle qu'elle était le jour de la séance. */
  note?: string;
  performed?: PerformedValues;
}

/**
 * Un bloc figé, avec ce qui a été demandé et ce qui a été fait.
 *
 * `type` est ici une chaîne et non `BlockType` : un bilan de l'an dernier
 * peut porter un format qui n'existe plus, et il doit rester lisible.
 */
export interface BlockSnapshot {
  type: string;
  label?: string;
  order: number;
  notes?: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  /** Les tours prescrits par le coach. */
  rounds?: number;
  /** Tours réellement bouclés — le score, quand le format en a un. */
  performedRounds?: number;
  restBetweenRounds?: number;
  workDuration?: number;
  restDuration?: number;
  repsScheme?: number[];
  exercises: BlockExerciseSnapshot[];
}

/**
 * Une séance terminée : ce qu'elle demandait ce jour-là, et ce qui en a été
 * fait.
 *
 * Tout est figé, jusqu'au nom et au rang de la séance. C'est ce qui permet
 * au coach de corriger son programme sans réécrire l'histoire, et c'est
 * aussi ce qui laisse comparer une séance d'aujourd'hui à la même d'il y a un
 * mois : les deux instantanés se comparent, les prescriptions vivantes non.
 */
export interface CompletedSession {
  _id: string;
  completedAt: Date;
  originalSessionId: string;
  sessionOrder: number;
  /**
   * Le nom que portait la séance ce jour-là, figé comme son rang : renommer une
   * séance ne réécrit pas les bilans déjà enregistrés.
   */
  sessionName?: string;
  blocks: BlockSnapshot[];
  coachNotes?: string;
  feedback?: SessionFeedback;
  /** @deprecated L'ancien bilan à cinq axes. Encore lu, plus jamais écrit. */
  metrics?: SessionMetrics;
  clientNotes?: string;
  viewedByCoach: boolean;
  editedAt?: Date;
}

// ─── Ressenti ────────────────────────────────────────────────────────────────

/**
 * Ce qui peut expliquer un ressenti, quand le chiffre seul ne suffit pas.
 *
 * Six étiquettes, pas davantage : une liste plus longue se parcourt au lieu
 * de se reconnaître, et le bilan se remplit debout, en fin de séance.
 */
export type FeedbackTag =
  'poor_sleep' | 'pain' | 'stress' | 'fatigue' | 'illness' | 'great_shape';

/**
 * Le ressenti d'une séance, en une note et deux compléments facultatifs.
 *
 * A remplacé cinq curseurs — stress, humeur, énergie, sommeil, courbatures —
 * que presque personne ne remplissait jusqu'au bout. Ce qui intéresse le
 * coach tient dans « c'était trop dur » ou « trop facile », et le reste
 * s'explique par une étiquette.
 */
export interface SessionFeedback {
  /** 1 « trop facile » … 5 « trop dure ». La cible est 3, au centre. */
  effort: number;
  tags?: FeedbackTag[];
  note?: string;
}

/** @deprecated Remplacé par `SessionFeedback`. Gardé pour relire
 * l'historique déjà enregistré. */
export interface SessionMetrics {
  stress: number;
  mood: number;
  energy: number;
  sleep: number;
  soreness: number;
}

/**
 * Ce que le client a fait sur UNE série.
 * Une clé absente veut dire « non renseigné » — jamais zéro.
 */
export interface PerformedSet {
  weight?: number;
  reps?: number;
  duration?: number;
}

/**
 * Ce que le client a réellement fait, série par série.
 *
 * La liste s'arrête où l'exercice s'est arrêté : une série prescrite qui n'y
 * est pas n'a pas été faite. « J'ai fait mes quatre séries » et « j'ai
 * abandonné à la deuxième » sont deux informations différentes, et l'ancien
 * couple unique charge/répétitions n'en portait aucune.
 */
export interface PerformedValues {
  sets: PerformedSet[];
}

/**
 * Ce qui a été réalisé sur un exercice, adressé par sa position dans
 * l'instantané. La liste remplace entièrement celle qui est enregistrée ;
 * `[]` l'efface.
 */
export interface PerformedEntry {
  blockOrder: number;
  exerciseOrder: number;
  sets: PerformedSet[];
}

/**
 * Les tours bouclés d'un bloc qui se compte en tours — le score d'un AMRAP.
 *
 * Adressé au bloc et non à l'exercice : c'est la liste entière que l'on
 * boucle. Distinct de `rounds` dans l'instantané, qui reste ce que le coach a
 * demandé ; comparer les deux est tout l'intérêt.
 */
export interface RoundsDoneEntry {
  blockOrder: number;
  rounds: number;
}
