import { useEffect, useState, ReactNode } from 'react';
import { authService } from '@/features/auth/auth.service';
import { AuthContext } from './AuthContext';
import { User } from '@/shared/types';

/**
 * Qui est connecté, demandé une fois au démarrage.
 *
 * La session vit dans un cookie `httpOnly` : le navigateur l'envoie, mais le
 * JavaScript ne peut pas le lire. Savoir qui est connecté demande donc un
 * aller-retour — d'où `isLoading`, et d'où l'unique appel au montage plutôt
 * qu'une relecture à chaque écran.
 *
 * La déconnexion passe par `window.location` et non par le routeur : c'est
 * un rechargement complet, et c'est voulu. Naviguer aurait gardé en mémoire
 * le cache de React Query, donc les données du compte précédent — visibles
 * une fraction de seconde sur un appareil partagé.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authService.getMe();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
