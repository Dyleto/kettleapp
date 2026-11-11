import { useQuery } from '@tanstack/react-query';
import { templateService } from '@/features/template/template.service';
import { queryKeys } from '@/shared/config/queryKeys';

/** La liste des modèles du coach, sans leurs séances. */
export const useTemplates = () =>
  useQuery({
    queryKey: queryKeys.coach.templates.lists(),
    queryFn: templateService.list,
  });

/**
 * Un modèle ouvert, avec ses séances.
 *
 * `enabled` sur l'identifiant : la route le porte, mais il est `undefined` le
 * temps que react-router l'ait lu, et une requête partie sans lui demanderait
 * `/templates/undefined`.
 */
export const useTemplate = (templateId?: string) =>
  useQuery({
    queryKey: queryKeys.coach.templates.detail(templateId ?? ''),
    queryFn: () => templateService.get(templateId!),
    enabled: !!templateId,
  });
