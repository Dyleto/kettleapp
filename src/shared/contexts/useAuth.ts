import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Le compte connecté, pour tout ce qui en a besoin.
 *
 * L'erreur en cas de contexte absent vise le développeur et non l'usager :
 * `undefined` se serait propagé jusqu'à un « impossible de lire firstName »
 * loin du vrai défaut, qui est un composant monté hors du fournisseur.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
