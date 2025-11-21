import { User } from "@/types";

export const getDefaultRoleRoute = (user: User | null): string => {
  if (!user) return "/login";

  if (user.isAdmin) return "/admin";
  if (user.isCoach) return "/coach";
  if (user.isClient) return "/client";

  return "/login";
};
