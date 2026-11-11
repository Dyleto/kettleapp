import api from '@/shared/config/api';
import type { Session, Template, TemplateRow } from '@/shared/types';

/**
 * Les modèles de programme, vus du front.
 *
 * Deux formes, et c'est voulu : une ligne de liste ne porte que le nom et le
 * nombre de séances, un modèle ouvert porte tout. Envoyer les séances de tous
 * les modèles pour afficher trois titres aurait chargé la page du poids de
 * tous les programmes du coach.
 */
export const templateService = {
  list: async () => {
    const { data } = await api.get<{ templates: TemplateRow[] }>(
      '/api/coach/templates'
    );
    return data.templates;
  },

  get: async (templateId: string) => {
    const { data } = await api.get<{ template: Template }>(
      `/api/coach/templates/${templateId}`
    );
    return data.template;
  },

  create: async (name: string) => {
    const { data } = await api.post<{ template: Template }>(
      '/api/coach/templates',
      { name }
    );
    return data.template;
  },

  rename: async (templateId: string, name: string) => {
    const { data } = await api.patch<{ template: Template }>(
      `/api/coach/templates/${templateId}`,
      { name }
    );
    return data.template;
  },

  remove: async (templateId: string) => {
    await api.delete(`/api/coach/templates/${templateId}`);
  },

  /**
   * Enregistrer les séances d'un modèle.
   *
   * Le modèle entier revient, séances comprises : c'est le serveur qui a posé
   * les rangs et les identifiants définitifs, et l'atelier adopte sa réponse
   * — exactement comme pour le programme d'un client.
   */
  saveSessions: async (templateId: string, sessions: unknown[]) => {
    const { data } = await api.put<{ template: Template }>(
      `/api/coach/templates/${templateId}/sessions`,
      { sessions }
    );
    return data.template;
  },

  /**
   * Écrire un modèle dans le programme d'un client, par-dessus ce qui y
   * était.
   *
   * Rien du contenu ne voyage : on nomme le modèle, le serveur le relit
   * lui-même. Même parti pris que la copie d'une séance vers un autre client.
   */
  importInto: async (clientId: string, templateId: string) => {
    const { data } = await api.post<Session[]>(
      `/api/coach/clients/${clientId}/program/import`,
      { templateId }
    );
    return data;
  },
};
