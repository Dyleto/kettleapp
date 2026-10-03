import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from './shared/components/ui/provider';
import { AuthProvider } from './shared/contexts/AuthProvider';
import { Toaster } from './shared/components/ui/toaster';
import { ErrorHandler } from './shared/components/ErrorHandler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/config/queryClient';
import ErrorBoundary from './shared/components/ErrorBoundary';

/**
 * Un module qui ne charge plus après un déploiement.
 *
 * Le cas est réel : un onglet resté ouvert pendant une mise en production
 * garde en mémoire les adresses des anciens fichiers, qui n'existent plus.
 * Recharger répare — le navigateur reprend l'index courant.
 *
 * Mais recharger sans condition transforme l'autre cas en piège. Si le
 * module reste introuvable — un fichier réellement absent, un réseau qui le
 * filtre — chaque rechargement échoue de la même façon et en déclenche un
 * autre : l'écran d'erreur n'apparaît jamais, et il ne reste qu'une page qui
 * clignote. On réessaie donc une fois, puis on laisse l'erreur remonter
 * jusqu'à l'écran qui sait l'expliquer.
 *
 * Un délai plutôt qu'un drapeau : un second déploiement, plus tard dans la
 * même session, doit pouvoir se réparer lui aussi.
 */
const RELOAD_KEY = 'kettle:dernier-rechargement-module';
const RETRY_WINDOW = 10_000;

window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RETRY_WINDOW) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Navigation privée, stockage refusé : on ne réessaie pas plutôt que de
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
