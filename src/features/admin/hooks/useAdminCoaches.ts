import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/features/admin/admin.service';
import { queryKeys } from '@/shared/config/queryKeys';

/** La liste des coachs. Rechargée après une création — c'est la seule chose
 * qui la fasse changer. */
export const useAdminCoaches = () =>
  useQuery({
    queryKey: queryKeys.admin.coaches(),
    queryFn: adminService.getCoaches,
  });
