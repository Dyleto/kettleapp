import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/features/admin/admin.service';
import { queryKeys } from '@/shared/config/queryKeys';

export const useAdminStats = () =>
  useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: adminService.getStats,
  });
