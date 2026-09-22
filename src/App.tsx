import {
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
} from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import React from 'react';
import { RouteError } from './components/RouteError';
import { COACH_ROUTES } from './config/routes';
const NoRole = React.lazy(() => import('./pages/NoRole'));

const Login = React.lazy(() => import('./pages/Login'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const Join = React.lazy(() => import('./pages/Join'));

const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));

const CoachLayout = React.lazy(() => import('./pages/Coach/CoachLayout'));
const Clients = React.lazy(() => import('./pages/Coach/Clients'));
const ClientDetails = React.lazy(() => import('./pages/Coach/ClientDetails'));
const ClientJournal = React.lazy(() => import('./pages/Coach/ClientJournal'));
const Exercises = React.lazy(() => import('./pages/Coach/Exercises'));

const ClientLayout = React.lazy(() => import('./pages/Client/ClientLayout'));
const Today = React.lazy(() => import('./pages/Client/Today'));
const Program = React.lazy(() => import('./pages/Client/Program'));
const SessionScreen = React.lazy(() => import('./pages/Client/SessionScreen'));
const SessionRedirect = React.lazy(
  () => import('./pages/Client/SessionRedirect')
);
const History = React.lazy(() => import('./pages/Client/History'));

// The same screen on both sides: one account can hold both roles, and it
// should not have to change space to read itself back.
const Account = React.lazy(() => import('./pages/Account'));

const Confidentialite = React.lazy(
  () => import('./pages/Legal/Confidentialite')
);
const MentionsLegales = React.lazy(
  () => import('./pages/Legal/MentionsLegales')
);

const ClientDetailsRedirect = () => {
  const { clientId } = useParams();
  return <Navigate to={COACH_ROUTES.clientSession(clientId!, 1)} replace />;
};

// `exercises/:id/edit` rendered exactly the same component as
// `exercises/:id`. We keep one address per screen, but we redirect rather
// than let an old link land on the error page.
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
        {/* The workshop writes its own top bar on mobile — client name on
            the left, journal on the right — instead of stacking two bars. */}
        <Route
          path="clients/:clientId/s/:sessionIndex"
          element={<ClientDetails />}
          handle={{ ownsMobileTopBar: true }}
        />
        <Route path="clients/:clientId/journal" element={<ClientJournal />} />
        {/* An exercise's sheet opens inside the library, not on a separate
            entry screen: same route, panel or drawer depending on the width.
            "new" no longer exists — you create by typing a name. */}
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
