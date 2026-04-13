import { queryKeys } from "@/config/queryKeys";
import { clientService } from "@/services/clientService";
import { useQuery } from "@tanstack/react-query";

export const useProgram = () => {
  return useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
  });
};
