import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/features/admin/admin.service';
import { queryKeys } from '@/shared/config/queryKeys';

export const useAdminCoaches = () =>
  useQuery({
    queryKey: queryKeys.admin.coaches(),
    queryFn: adminService.getCoaches,
  });
