import { useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '@/features/template/template.service';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { queryKeys } from '@/shared/config/queryKeys';
import type { Session, Template } from '@/shared/types';

/** Créer un modèle : un nom, et rien d'autre. Les séances viennent après. */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => templateService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.templates.all(),
      });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Impossible de créer le modèle',
        type: 'error',
      });
    },
  });
};

/**
 * Renommer un modèle.
 *
 * Toute la branche est invalidée et pas seulement la liste : la fiche ouverte
 * porte le même nom en titre, et ne rafraîchir que la liste la laissait
 * afficher l'ancien.
 */
export const useRenameTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      templateService.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.templates.all(),
      });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Impossible de renommer le modèle',
        type: 'error',
      });
    },
  });
};

/**
 * Supprimer un modèle.
 *
 * Sans filet d'annulation, et c'est le seul endroit de l'atelier où je n'en
 * pose pas : le filet remet un état local que l'enregistrement automatique
 * renvoie ensuite, or un modèle supprimé n'existe plus côté serveur et le
 * remettre demanderait de le recréer avec un autre identifiant — ce ne serait
 * plus « annuler », ce serait « refaire ». La confirmation est donc demandée
 * avant, par l'écran.
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => templateService.remove(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.templates.all(),
      });
      toaster.create({ title: 'Modèle supprimé', type: 'success' });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Impossible de supprimer le modèle',
        type: 'error',
      });
    },
  });
};

/**
 * Enregistrer les séances d'un modèle.
 *
 * Silencieux comme son équivalent côté client : l'atelier s'enregistre
 * lui-même à chaque frappe et n'a que faire d'un message de confirmation.
 *
 * `setQueryData` et non `invalidateQueries`, pour la même raison qui avait
 * coûté une perte de travail côté client : invalider déclencherait une
 * relecture qui réécrirait l'atelier par-dessus la frappe en cours, et ne
 * rien faire laisserait le cache en retard — au retour sur la page, l'éditeur
 * repartirait de la version d'avant.
 */
export const useUpdateTemplateSessions = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessions: Session[]) =>
      templateService.saveSessions(templateId, sessions),
    onSuccess: (saved: Template) => {
      queryClient.setQueryData(
        queryKeys.coach.templates.detail(templateId),
        saved
      );
      // La liste porte le nombre de séances : il vient de changer.
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.templates.lists(),
      });
    },
  });
};

/**
 * Écrire un modèle dans le programme d'un client.
 *
 * Invalide la fiche du client et son programme : les deux portent les séances
 * qui viennent d'être remplacées, et le client les lit de son côté.
 */
export const useImportTemplate = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      templateService.importInto(clientId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(clientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.program.get(),
      });
      toaster.create({ title: 'Programme importé', type: 'success' });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: "Impossible d'importer le modèle",
        type: 'error',
      });
    },
  });
};
