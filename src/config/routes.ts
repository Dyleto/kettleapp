const PUBLIC_ROUTES = ["/login", "/auth/callback", "/join"] as const;

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname as any);
};
