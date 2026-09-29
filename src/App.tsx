import {
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
} from 'react-router-dom';
import RootLayout from './shared/layouts/RootLayout';
import React from 'react';
import { RouteError } from './shared/components/RouteError';
import { COACH_ROUTES } from './shared/config/routes';
const NoRole = React.lazy(() => import('@/features/auth/pages/NoRole'));

const Login = React.lazy(() => import('@/features/auth/pages/Login'));
const AuthCallback = React.lazy(
  () => import('@/features/auth/pages/AuthCallback')
);
const Join = React.lazy(() => import('@/features/auth/pages/Join'));

const AdminDashboard = React.lazy(
  () => import('@/features/admin/pages/Dashboard')
);

const CoachLayout = React.lazy(
  () => import('@/features/coach/pages/CoachLayout')
);
const Clients = React.lazy(() => import('@/features/coach/pages/Clients'));
const ClientDetails = React.lazy(
  () => import('@/features/coach/pages/ClientDetails')
);
const ClientJournal = React.lazy(
  () => import('@/features/coach/pages/ClientJournal')
);
const Exercises = React.lazy(
  () => import('@/features/exercise/pages/Exercises')
);

const ClientLayout = React.lazy(
  () => import('@/features/client/pages/ClientLayout')
);
const Today = React.lazy(() => import('@/features/client/pages/Today'));
const Program = React.lazy(() => import('@/features/client/pages/Program'));
const SessionScreen = React.lazy(
  () => import('@/features/client/pages/SessionScreen')
);
const SessionRedirect = React.lazy(
  () => import('@/features/client/pages/SessionRedirect')
);
const History = React.lazy(() => import('@/features/client/pages/History'));

// Le même écran des deux côtés : un compte peut porter les deux rôles, et
// il n'a pas à changer d'espace pour se relire.
const Account = React.lazy(() => import('@/features/account/pages/Account'));

const Confidentialite = React.lazy(
  () => import('@/features/legal/pages/Confidentialite')
);
const MentionsLegales = React.lazy(
  () => import('@/features/legal/pages/MentionsLegales')
);

const ClientDetailsRedirect = () => {
  const { clientId } = useParams();
  return <Navigate to={COACH_ROUTES.clientSession(clientId!, 1)} replace />;
};

// `exercises/:id/edit` rendait exactement le même composant que
// `exercises/:id`. On garde une adresse par écran, mais on redirige plutôt
// que de laisser un ancien lien atterrir sur la page d'erreur.
const ExerciseEditRedirect = () => {
  const { exerciseId } = useParams();
  return <Navigate to={COACH_ROUTES.exerciseDetails(exerciseId!)} replace />;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<RouteError />}>
      <Route path="login" element={<Login />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="join" element={<Join />} />
      <Route path="no-role" element={<NoRole />} />

      {/* Served by the application, and readable without an account. */}
      <Route path="confidentialite" element={<Confidentialite />} />
      <Route path="mentions-legales" element={<MentionsLegales />} />

      {/* Routes Coach */}
      <Route path="coach" element={<CoachLayout />}>
        <Route index element={<Clients />} />
        <Route path="account" element={<Account space="coach" />} />
        <Route path="clients/:clientId" element={<ClientDetailsRedirect />} />
        {/* L'atelier écrit sa propre barre du haut sur mobile — nom du
            client à gauche, journal à droite — au lieu d'en empiler deux. */}
        <Route
          path="clients/:clientId/s/:sessionIndex"
          element={<ClientDetails />}
          handle={{ ownsMobileTopBar: true }}
        />
        <Route path="clients/:clientId/journal" element={<ClientJournal />} />
        {/* La fiche d'un exercice s'ouvre dans la bibliothèque, et non
            sur un écran d'entrée séparé : même route, panneau ou tiroir
            selon la largeur. « new » n'existe plus — on crée en tapant un
            nom. */}
        <Route path="exercises" element={<Exercises />} />
        <Route
          path="exercises/new"
          element={<Navigate to="/coach/exercises" replace />}
        />
        <Route path="exercises/:exerciseId" element={<Exercises />} />
        <Route
          path="exercises/:exerciseId/edit"
          element={<ExerciseEditRedirect />}
        />
      </Route>

      {/* Routes Client */}
      <Route path="client" element={<ClientLayout />}>
        <Route index element={<Today />} />
        <Route path="program" element={<Program />} />
        <Route path="session" element={<SessionRedirect />} />
        <Route path="session/:sessionId" element={<SessionScreen />} />
        <Route path="history" element={<History />} />
        <Route path="account" element={<Account space="client" />} />
      </Route>

      {/* Routes Admin */}
      <Route path="admin" element={<AdminDashboard />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
