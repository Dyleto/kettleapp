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
 * A module that fails to load after a deployment.
 *
 * The case is real: a tab left open during a release keeps in memory the
 * addresses of the old files, which no longer exist. Reloading fixes it — the
 * browser picks up the current index.
 *
 * But reloading unconditionally turns the other case into a trap. If the
 * module stays missing — a file genuinely absent, a network filtering it —
 * every reload fails the same way and triggers another: the error screen
 * never appears, and all that is left is a page blinking. So we retry once,
 * and then let the error rise to the screen that knows how to explain it.
 *
 * A delay rather than a flag: a second release, later in the same session,
 * must be able to repair itself too.
 */
const CLE_RECHARGEMENT = 'kettle:dernier-rechargement-module';
const DELAI_ENTRE_TENTATIVES = 10_000;

window.addEventListener('vite:preloadError', () => {
  try {
    const dernier = Number(sessionStorage.getItem(CLE_RECHARGEMENT) ?? 0);
    if (Date.now() - dernier < DELAI_ENTRE_TENTATIVES) return;
    sessionStorage.setItem(CLE_RECHARGEMENT, String(Date.now()));
  } catch {
    // Private browsing, storage refused: we do not retry rather than risk
    // the loop we have just ruled out.
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
