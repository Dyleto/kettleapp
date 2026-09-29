import api from '@/shared/config/api';
import { Exercise } from '@/shared/types';

/**
 * La bibliothèque d'exercices, côté réseau.
 *
 * Les appels vivaient en trois endroits : deux dans `coachService`, trois
 * écrits à la main dans les hooks de mutation. L'un des deux du service
 * n'était appelé par personne — le hook refaisait le `POST` lui-même — et
 * personne ne l'avait vu, parce qu'il n'y avait aucun endroit où regarder.
 *
 * Les routes restent sous `/api/coach/exercises` : la bibliothèque appartient
 * au coach, c'est son espace qui la sert. C'est le domaine qui change de
 * côté, pas l'API.
 */
export const exerciseService = {
  /** Toute la bibliothèque, d'un coup : elle tient en quelques dizaines de
   * lignes et se filtre côté client, sans aller-retour par frappe. */
  list: async () => {
    const { data } = await api.get<Exercise[]>('/api/coach/exercises');
    return data;
  },

  /** Un exercice, par son identifiant : ce qu'un lien direct vers une fiche
   * demande, quand la liste n'a pas encore été chargée. */
  get: async (id: string) => {
    const { data } = await api.get<Exercise>(`/api/coach/exercises/${id}`);
    return data;
  },

  /** Créer. Le serveur rend l'exercice tel qu'il l'a écrit — c'est de lui que
   * vient l'identifiant. */
  create: async (exercise: Partial<Exercise>) => {
    const { data } = await api.post<Exercise>('/api/coach/exercises', exercise);
    return data;
  },

  /** Modifier. Partiel : la fiche enregistre champ par champ, à la perte du
   * focus, et n'a jamais l'exercice entier sous la main. */
  update: async (id: string, exercise: Partial<Exercise>) => {
    const { data } = await api.put<Exercise>(
      `/api/coach/exercises/${id}`,
      exercise
    );
    return data;
  },

  /** Supprimer. Le serveur refuse si l'exercice est placé dans un programme :
   * le compteur de la liste dit lesquels sont libres. */
  remove: async (id: string) => {
    await api.delete(`/api/coach/exercises/${id}`);
  },
};
