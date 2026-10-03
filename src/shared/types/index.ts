/**
 * Les types de l'API, sous les noms que le front leur donne.
 *
 * Ce fichier ne décrit plus rien : il nomme. Chaque type est un alias d'un
 * type de `contract.ts`, qui est engendré depuis les schémas Zod que l'API
 * applique à ses réponses — un champ qui n'y figure pas ne sort pas.
 *
 * Il décrivait, avant, et c'était une seconde description de la même chose,
 * écrite à la main. Les deux avaient divergé : le programme y portait un
 * `endDate` que l'API n'a jamais envoyé, la liste des clients une adresse
 * e-mail qu'aucun écran ne lit, et toutes les dates y étaient des `Date`
 * quand ce sont des chaînes qui arrivent — ce que chaque appelant corrigeait
 * déjà en écrivant `new Date(...)`.
 *
 * Les alias restent parce que les noms du produit ne sont pas ceux du
 * réseau : on écrit `Session`, pas `SessionPayload`, et un écran parle de la
 * séance d'un client, pas d'une charge utile.
 */
import type {
  AccountSummaryPayload,
  BlockExercisePayload,
  BlockExerciseSnapshotPayload,
  BlockSnapshotPayload,
  BlockTypePayload,
  ClientRowPayload,
  ClientDetailsPayload,
  CompletedSessionPayload,
  ExercisePayload,
  FeedbackPayload,
  HealthConsentPayload,
  InviteCheckPayload,
  LegacyMetricsPayload,
  PerformedPayload,
  PerformedSetPayload,
  ProgramPayload,
  SessionBlockPayload,
  SessionPayload,
  UserPayload,
} from './contract';

/** La décision du client sur le partage de son ressenti. */
export type HealthConsent = HealthConsentPayload;

/** Le compte connecté. Les trois rôles sont des booléens : un même compte est
 * souvent coach ET client. */
export type User = UserPayload;

/** Ce que l'écran « Mon compte » a besoin de savoir, rôle par rôle. */
export type AccountSummary = AccountSummaryPayload;

/**
 * Un client dans la liste du coach.
 *
 * Sans adresse e-mail : la liste affiche des noms, et l'API ne l'envoie plus.
 * Le front en déclarait une — qu'aucun écran ne lisait.
 */
export type Client = ClientRowPayload;

/**
 * Le coach qu'un lien d'invitation révèle.
 *
 * Dérivé de la réponse plutôt que déclaré : le front portait un type `Coach`
 * avec `_id`, `email` et `hiredAt`, dont la réponse ne contient aucun des
 * trois. Elle porte `id`, un prénom, un nom et une photo — et c'est tout ce
 * que l'écran affiche.
 */
export type InvitedCoach = InviteCheckPayload['coach'];

/** Un mouvement de la bibliothèque du coach. */
export type Exercise = ExercisePayload;

/** Les onze formats de bloc. L'union vient du contrat : un `switch` doit
 * cesser de compiler le jour où un format s'ajoute. */
export type BlockType = BlockTypePayload;

/** Un exercice tel qu'il est prescrit dans un bloc. */
export type BlockExercise = BlockExercisePayload;

/** Un bloc : un format, et les exercices qu'il enchaîne. */
export type SessionBlock = SessionBlockPayload;

/** Une séance du programme, telle que le coach l'a écrite. */
export type Session = SessionPayload;

/** Le programme d'un client, du point de vue de l'écran : ses séances. */
export type ClientProgram = Pick<ProgramPayload, 'sessions'>;

/** Un client et son programme — une seule requête pour l'atelier, qui a
 * besoin des deux à la fois. */
export type ClientWithDetails = ClientDetailsPayload;

/** Un exercice figé le jour où la séance a été faite. */
export type BlockExerciseSnapshot = BlockExerciseSnapshotPayload;

/** Un bloc figé : ce qui était demandé, et ce qui en a été fait. */
export type BlockSnapshot = BlockSnapshotPayload;

/** Une séance terminée : la prescription de ce jour-là, et ce qui en a été
 * fait. */
export type CompletedSession = CompletedSessionPayload;

/** Le ressenti d'une séance : une note, et deux compléments facultatifs. */
export type SessionFeedback = FeedbackPayload;

/** Ce qui peut expliquer un ressenti. Dérivé du ressenti lui-même : la liste
 * vit dans le contrat, et une seconde copie ici divergerait. */
export type FeedbackTag = NonNullable<SessionFeedback['tags']>[number];

/** @deprecated L'ancien bilan à cinq axes. Encore lu, plus jamais écrit. */
export type SessionMetrics = LegacyMetricsPayload;

/** Ce que le client a fait sur UNE série. Une clé absente veut dire « non
 * renseigné » — jamais zéro. */
export type PerformedSet = PerformedSetPayload;

/** Ce que le client a réellement fait sur un exercice, série par série. */
export type PerformedValues = PerformedPayload;

// ─── Ce que le front envoie ─────────────────────────────────────────────────
//
// Les deux types qui suivent décrivent une requête et non une réponse : ils
// ne viennent donc pas du contrat de sortie. L'API les valide de son côté
// (`client.schema.ts`), et c'est cette validation qui fait foi — ceux-ci
// disent seulement ce que le front compose.

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
