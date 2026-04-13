import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";
import { queryKeys } from "@/config/queryKeys";

export const useClientProgram = () => {
  return useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
  });
};
