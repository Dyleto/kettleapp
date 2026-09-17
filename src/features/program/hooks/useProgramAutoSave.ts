import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientProgram, Session } from '@/types';

/** Ce que la ligne de statut a à raconter. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'error';

/**
 * Délai avant d'envoyer une modification de valeur. Assez court pour qu'une
 * fermeture d'onglet juste après une frappe ne perde rien, assez long pour
 * qu'on n'envoie pas le programme entier à chaque caractère.
 */
const DELAI_VALEUR = 800;

/**
 * Empreinte de la structure du programme : les identifiants et le nombre
 * d'exercices, rien des valeurs.
 *
 * Elle sert à distinguer deux gestes que le coach ne vit pas pareil. Ajouter
 * un bloc ou supprimer un exercice est une action franche, qu'on enregistre
 * tout de suite. Retaper « 12 reps » en produit une par caractère : celle-là
 * attend qu'il ait fini.
 */
const empreinte = (sessions: Session[]): string =>
  sessions
    .map(
      (s) =>
        `${s._id}:${s.blocks
          .map((b) => `${b._id}.${b.exercises.length}`)
          .join(',')}`
    )
    .join('|');

interface Params {
  /** L'état local de l'atelier, celui que le coach manipule. */
  program: ClientProgram | null;
  /** Le programme tel que le serveur l'a envoyé, ou `undefined` tant qu'il charge. */
  serverProgram: ClientProgram | undefined;
  /** Remplace l'état local — première arrivée, et adoption de la réponse. */
  initialize: (data: ClientProgram) => void;
  /** Envoie le programme et rend ce que le serveur a réellement enregistré. */
  save: (sessions: Session[]) => Promise<Session[]>;
}

interface Retour {
  state: SaveState;
  /** Vrai tant qu'une modification n'est pas partie ou n'est pas confirmée. */
  isDirty: boolean;
  savedAt: Date | null;
  /** Force l'envoi immédiat : bouton de reprise après échec. */
  flush: () => void;
}

/**
 * Enregistre le programme au fil de l'eau.
 *
 * Trois choses à tenir ensemble, et c'est leur combinaison qui est délicate :
 *
 * 1. Une requête de fond ne doit jamais écraser une modification en cours.
 *    React Query rafraîchit au retour de focus une fois la donnée périmée ;
 *    l'atelier se réinitialisait alors en silence et le travail non
 *    enregistré disparaissait sans un mot. C'est le défaut que ce crochet
 *    corrige en premier.
 *
 * 2. Un seul envoi à la fois. Deux requêtes concurrentes sur le même
 *    programme, c'est le dernier arrivé qui gagne — et on ne sait pas lequel
 *    c'est. Ce qui survient pendant un envoi attend la réponse.
 *
 * 3. La réponse fait autorité, mais seulement si rien n'a bougé entretemps.
 *    Sinon on la laisse tomber : l'envoi suivant, qui porte les mêmes
 *    identifiants, la remplacera.
 */
export const useProgramAutoSave = ({
  program,
  serverProgram,
  initialize,
  save,
}: Params): Retour => {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  /**
   * Ce que le serveur a, à notre connaissance, et `null` avant le premier
   * chargement. C'est un état et non une référence : `isDirty` en découle, et
   * doit donc provoquer un rendu.
   */
  const [enregistre, setEnregistre] = useState<string | null>(null);

  const courant = program ? JSON.stringify(program.sessions) : null;
  const isDirty =
    courant !== null && enregistre !== null && courant !== enregistre;

  /** Le même contenu, lisible depuis `envoyer` qui s'exécute hors rendu. */
  const refEnregistre = useRef<string | null>(null);
  /** Le contenu de l'envoi en cours, ou `null` s'il n'y en a pas. */
  const enVol = useRef<string | null>(null);
  /** Le dernier état connu, lu par l'envoi différé sans le refaire déclencher. */
  const dernier = useRef<Session[] | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const structure = useRef<string>('');
  /** `envoyer` se rappelle lui-même ; il passe par ici pour pouvoir le faire. */
  const relancer = useRef<() => void>(() => {});

  useEffect(() => {
    dernier.current = program?.sessions ?? null;
  });

  /** Adopte une version comme étant celle du serveur. */
  const adopter = useCallback((sessions: Session[], contenu: string) => {
    refEnregistre.current = contenu;
    structure.current = empreinte(sessions);
    setEnregistre(contenu);
  }, []);

  const envoyer = useCallback(() => {
    const sessions = dernier.current;
    if (!sessions) return;
    const contenu = JSON.stringify(sessions);

    if (contenu === refEnregistre.current) {
      // Le coach est revenu de lui-même à la version enregistrée pendant le
      // délai d'attente : il n'y a plus rien à envoyer.
      if (enVol.current === null) setState('idle');
      return;
    }
    // Un envoi est déjà parti : celui-ci se fera à son retour.
    if (enVol.current !== null) return;

    enVol.current = contenu;
    setState('saving');

    save(sessions)
      .then((renvoye) => {
        const inchange = enVol.current === JSON.stringify(dernier.current);
        enVol.current = null;
        setSavedAt(new Date());

        if (inchange) {
          // Le serveur fait autorité : il a posé les ordres, les dates et les
          // identifiants définitifs. On adopte sa version pour que la
          // comparaison suivante porte sur la même forme.
          adopter(renvoye, JSON.stringify(renvoye));
          initialize({ sessions: renvoye });
          setState('idle');
          return;
        }

        // Le coach a continué pendant l'envoi. On ne touche à rien et on
        // repart : la requête porte les mêmes identifiants, elle est donc
        // sans danger à rejouer.
        setState('pending');
        relancer.current();
      })
      .catch(() => {
        enVol.current = null;
        setState('error');
      });
  }, [adopter, initialize, save]);

  useEffect(() => {
    relancer.current = envoyer;
  }, [envoyer]);

  // ── Première arrivée, et rafraîchissements de fond ────────────────────────
  useEffect(() => {
    if (!serverProgram) return;
    const recu = JSON.stringify(serverProgram.sessions);

    if (refEnregistre.current === null) {
      adopter(serverProgram.sessions, recu);
      initialize(serverProgram);
      return;
    }

    // Tout ce qui arrive ensuite est une requête de fond. Elle ne remplace
    // l'atelier que s'il n'y a rien à perdre : ni modification en attente, ni
    // envoi en vol, ni échec à reprendre.
    if (isDirty || enVol.current !== null || state === 'error') return;
    if (recu === refEnregistre.current) return;

    adopter(serverProgram.sessions, recu);
    initialize(serverProgram);
    // `isDirty` et `state` sont lus pour décider d'ignorer, pas pour
    // déclencher : les inscrire en dépendances relancerait l'effet à chaque
    // frappe sans rien changer au résultat. Et l'écriture d'état est ici le
    // propre du travail : recopier une source externe dans l'état local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProgram, adopter, initialize]);

  // ── Programmation de l'envoi ──────────────────────────────────────────────
  useEffect(() => {
    if (courant === null || enregistre === null) return;
    if (courant === enregistre) return;

    const nouvelleStructure = empreinte(program?.sessions ?? []);
    const structurel = nouvelleStructure !== structure.current;
    structure.current = nouvelleStructure;

    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(envoyer, structurel ? 0 : DELAI_VALEUR);

    return () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    };
    // `program` n'est lu que pour son empreinte, dont `courant` est déjà le
    // déclencheur : l'ajouter ferait courir l'effet deux fois par frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courant, enregistre, envoyer]);

  // Un envoi programmé n'est pas encore un envoi : le dire, pour que la ligne
  // de statut ne reste pas muette pendant le délai d'attente.
  useEffect(() => {
    if (!isDirty) return;
    // Recopier une information déjà connue du rendu, et rien d'autre : pas de
    // cascade à craindre, l'état converge au premier passage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((precedent) => (precedent === 'idle' ? 'pending' : precedent));
  }, [isDirty]);

  const flush = useCallback(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    envoyer();
  }, [envoyer]);

  // ── Filet de sécurité à la fermeture ──────────────────────────────────────
  useEffect(() => {
    if (!isDirty && state !== 'saving') return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [isDirty, state]);

  // ── Quitter l'atelier n'est pas renoncer ──────────────────────────────────
  //
  // `beforeunload` ne couvre que la fermeture de l'onglet. Une navigation
  // interne — le bouton retour du téléphone, un lien — démontait l'atelier
  // sans un mot, et les 800 ms d'attente d'une valeur en cours partaient avec
  // lui. Un coach le vivait comme « l'application a annulé ma séance ».
  //
  // L'envoi est sûr à déclencher pour rien : il compare au dernier état
  // enregistré et ne part que s'il y a quelque chose à dire. Déclaré en
  // dernier pour que le nettoyage de la programmation, plus haut, ait déjà
  // rendu son minuteur.
  useEffect(
    () => () => {
      relancer.current();
    },
    []
  );

  return { state, isDirty, savedAt, flush };
};
