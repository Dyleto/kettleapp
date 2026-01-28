import { useQuery } from "@tanstack/react-query";
import api from "@/config/api";
import { Client } from "@/types";

export const useClients = () => {
  return useQuery({
    queryKey: ["coach", "clients"],
    queryFn: async () => {
      const response = await api.get<Client[]>("/api/coach/clients");
      return response.data;
    },
  });
};
