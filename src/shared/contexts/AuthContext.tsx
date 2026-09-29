import { createContext } from 'react';
import { User } from '@/shared/types';

/**
 * Ce que l'application sait du compte connecté.
 *
 * `isLoading` est distinct de `user === null` : au premier rendu on ne sait
 * pas encore, et confondre « pas connecté » avec « pas encore répondu »
 * renvoyait vers la connexion un compte parfaitement valide, le temps d'un
 * aller-retour.
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

/**
 * `undefined` par défaut, et non un objet vide : c'est ce qui permet à
 * `useAuth` de distinguer « hors du fournisseur » de « personne n'est
 * connecté », deux défauts qui n'appellent pas la même correction.
 */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
