import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from './components/ui/provider';
import { AuthProvider } from './contexts/AuthProvider';
import { Toaster } from './components/ui/toaster';
import { ErrorHandler } from './components/ErrorHandler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * Un module qui ne se charge pas après un déploiement.
 *
 * Le cas visé est réel : un onglet resté ouvert pendant une mise en ligne
 * garde en mémoire les adresses des anciens fichiers, qui n'existent plus.
 * Recharger répare — le navigateur récupère l'index à jour.
 *
 * Mais recharger sans condition transforme l'autre cas en piège. Si le module
 * reste introuvable — un fichier réellement absent, un réseau qui filtre —
 * chaque rechargement échoue de la même façon et en déclenche un autre :
 * l'écran d'erreur n'apparaît jamais, et il ne reste qu'une page qui
 * clignote. On ne retente donc qu'une fois, et on laisse l'erreur remonter
 * ensuite jusqu'à l'écran qui sait l'expliquer.
 *
 * Le délai plutôt qu'un drapeau : une seconde mise en ligne, plus tard dans
 * la même session, doit pouvoir se réparer elle aussi.
 */
const CLE_RECHARGEMENT = 'kettle:dernier-rechargement-module';
const DELAI_ENTRE_TENTATIVES = 10_000;

window.addEventListener('vite:preloadError', () => {
  try {
    const dernier = Number(sessionStorage.getItem(CLE_RECHARGEMENT) ?? 0);
    if (Date.now() - dernier < DELAI_ENTRE_TENTATIVES) return;
    sessionStorage.setItem(CLE_RECHARGEMENT, String(Date.now()));
  } catch {
    // Navigation privée, stockage refusé : on ne retente pas plutôt que de
    // risquer la boucle qu'on vient d'écarter.
    return;
  }
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')! as HTMLElement).render(
  <Provider>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <ErrorHandler />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </Provider>
);
