import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientProgram, Session } from '@/shared/types';

/** Ce que la ligne d'état a à dire. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'error';

/**
 * Délai avant d'envoyer un changement de valeur. Assez court pour que fermer
 * l'onglet juste après une frappe ne perde rien, assez long pour ne pas
 * envoyer tout le programme à chaque caractère.
 */
const VALUE_DELAY = 800;

/**
 * Une empreinte de la structure du programme : les identifiants et le nombre
 * d'exercices, rien des valeurs.
 *
 * Elle distingue deux gestes que le coach ne vit pas de la même façon.
 * Ajouter un bloc ou supprimer un exercice est une action décidée, enregistrée
 * aussitôt. Retaper « 12 reps » en produit une par caractère : celle-là
 * attend qu'il ait fini.
 */
const fingerprint = (sessions: Session[]): string =>
  sessions
    .map(
      (s) =>
        `${s._id}:${s.blocks
          .map((b) => `${b._id}.${b.exercises.length}`)
          .join(',')}`
    )
    .join('|');

interface Params {
  /** L'état local de l'éditeur, celui que le coach manipule. */
  program: ClientProgram | null;
  /** Le programme tel que le serveur l'a envoyé, ou `undefined` pendant le
   * chargement. */
  serverProgram: ClientProgram | undefined;
  /** Remplace l'état local — première arrivée, et adoption de la réponse. */
  initialize: (data: ClientProgram) => void;
  /** Envoie le programme et rend ce que le serveur a réellement enregistré. */
  save: (sessions: Session[]) => Promise<Session[]>;
}

interface AutoSaveState {
  state: SaveState;
  /** Vrai tant qu'un changement n'est pas parti, ou pas confirmé. */
  isDirty: boolean;
  savedAt: Date | null;
  /** Force un envoi immédiat : le bouton de reprise après un échec. */
  flush: () => void;
}

/**
 * Enregistre le programme au fil de l'écriture.
 *
 * Trois choses à tenir ensemble, et c'est leur combinaison qui est délicate :
 *
 * 1. Une relecture d'arrière-plan ne doit jamais écraser un changement en
 *    cours. React Query rafraîchit au retour du focus dès que la donnée est
 *    périmée ; l'éditeur se réinitialisait alors en silence et le travail non
 *    enregistré disparaissait sans un mot. C'est le défaut que ce hook
 *    répare en premier.
 *
 * 2. Un envoi à la fois. Deux requêtes concurrentes sur le même programme,
 *    c'est le dernier qui gagne — et on ne sait pas lequel c'est. Ce qui
 *    survient pendant un envoi attend la réponse.
 *
 * 3. La réponse fait foi, mais seulement si rien n'a bougé entre-temps.
 *    Sinon on la jette : l'envoi suivant, qui porte les mêmes identifiants,
 *    la remplacera.
 */
export const useProgramAutoSave = ({
  program,
  serverProgram,
  initialize,
  save,
}: Params): AutoSaveState => {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  /**
   * Ce que le serveur a, pour autant qu'on sache, et `null` avant le premier
   * chargement. C'est un état et non une ref : `isDirty` en dérive, il doit
   * donc déclencher un rendu.
   */
  const [saved, setSaved] = useState<string | null>(null);

  const current = program ? JSON.stringify(program.sessions) : null;
  const isDirty = current !== null && saved !== null && current !== saved;

  /** Le même contenu, lisible depuis `send` qui s'exécute hors du rendu. */
  const savedRef = useRef<string | null>(null);
  /** Le contenu de l'envoi en vol, ou `null` quand il n'y en a pas. */
  const inFlight = useRef<string | null>(null);
  /** Le dernier état connu, lu par l'envoi différé sans le redéclencher. */
  const last = useRef<Session[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const structure = useRef<string>('');
  /** `send` s'appelle lui-même ; il passe par ici pour pouvoir le faire. */
  const rerun = useRef<() => void>(() => {});

  useEffect(() => {
    last.current = program?.sessions ?? null;
  });

  /** Adopte une version comme étant celle du serveur. */
  const adopt = useCallback((sessions: Session[], content: string) => {
    savedRef.current = content;
    structure.current = fingerprint(sessions);
    setSaved(content);
  }, []);

  const send = useCallback(() => {
    const sessions = last.current;
    if (!sessions) return;
    const content = JSON.stringify(sessions);

    if (content === savedRef.current) {
      // Le coach est revenu de lui-même à la version enregistrée pendant
      // l'attente : il n'y a plus rien à envoyer.
      if (inFlight.current === null) setState('idle');
      return;
    }
    // Un envoi est déjà parti : celui-ci se fera à son retour.
    if (inFlight.current !== null) return;

    inFlight.current = content;
    setState('saving');

    save(sessions)
      .then((renvoye) => {
        const unchanged = inFlight.current === JSON.stringify(last.current);
        inFlight.current = null;
        setSavedAt(new Date());

        if (unchanged) {
          // Le serveur fait foi : c'est lui qui a posé les rangs, les dates et
          // les identifiants définitifs. On adopte sa version pour que la
          // comparaison suivante porte sur la même forme.
          adopt(renvoye, JSON.stringify(renvoye));
          initialize({ sessions: renvoye });
          setState('idle');
          return;
        }

        // Le coach a continué pendant l'envoi. On ne touche à rien et on
        // repart : la requête porte les mêmes identifiants, elle est donc
        // sûre à rejouer.
        setState('pending');
        rerun.current();
      })
      .catch(() => {
        inFlight.current = null;
        setState('error');
      });
  }, [adopt, initialize, save]);

  useEffect(() => {
    rerun.current = send;
  }, [send]);

  // ── Première arrivée, et relectures d'arrière-plan ───────────────────────
  useEffect(() => {
    if (!serverProgram) return;
    const received = JSON.stringify(serverProgram.sessions);

    if (savedRef.current === null) {
      adopt(serverProgram.sessions, received);
      initialize(serverProgram);
      return;
    }

    // Tout ce qui arrive ensuite est une relecture d'arrière-plan. Elle ne
    // remplace l'éditeur que lorsqu'il n'y a rien à perdre : aucun changement
    // en attente, aucun envoi en vol, aucun échec à reprendre.
    if (isDirty || inFlight.current !== null || state === 'error') return;
    if (received === savedRef.current) return;

    adopt(serverProgram.sessions, received);
    initialize(serverProgram);
    // `isDirty` et `state` sont lus pour décider d'ignorer, pas pour
    // déclencher : les lister en dépendances relancerait l'effet à chaque
    // frappe sans changer le résultat. Et écrire l'état ici est le travail
    // lui-même : recopier une source externe dans un état local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProgram, adopt, initialize]);

  // ── La programmation de l'envoi ──────────────────────────────────────────
  useEffect(() => {
    if (current === null || saved === null) return;
    if (current === saved) return;

    const nextStructure = fingerprint(program?.sessions ?? []);
    const structural = nextStructure !== structure.current;
    structure.current = nextStructure;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(send, structural ? 0 : VALUE_DELAY);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `program` n'est lu que pour son empreinte, sur laquelle `current`
    // déclenche déjà : l'ajouter ferait tourner l'effet deux fois par frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, saved, send]);

  // Un envoi programmé n'est pas encore un envoi : on le dit, pour que la
  // ligne d'état ne reste pas muette pendant l'attente.
  useEffect(() => {
    if (!isDirty) return;
    // On recopie une information que le rendu connaît déjà, et rien
    // d'autre : aucune cascade à craindre, l'état converge dès la première
    // passe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((previous) => (previous === 'idle' ? 'pending' : previous));
  }, [isDirty]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    send();
  }, [send]);

  // ── Le filet à la fermeture ──────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty && state !== 'saving') return;
    const warnBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty, state]);

  // ── Quitter l'éditeur n'est pas renoncer ─────────────────────────────────
  //
  // `beforeunload` ne couvre que la fermeture de l'onglet. Une navigation
  // interne — le bouton retour du téléphone, un lien — démontait l'éditeur
  // sans un mot, et l'attente de 800 ms sur une valeur en cours partait avec.
  // Un coach vivait cela comme « l'application a annulé ma séance ».
  //
  // L'envoi est sans danger s'il part pour rien : il se compare au dernier
  // état enregistré et ne part que s'il y a quelque chose à dire. Déclaré en
  // dernier pour que le nettoyage de programmation ci-dessus ait déjà libéré
  // son minuteur.
  useEffect(
    () => () => {
      rerun.current();
    },
    []
  );

  return { state, isDirty, savedAt, flush };
};
