import {
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import React from "react";

const Login = React.lazy(() => import("./pages/Login"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const Join = React.lazy(() => import("./pages/Join"));

const AdminDashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const AdminCreateCoach = React.lazy(() => import("./pages/Admin/CreateCoach"));

const CoachDashboard = React.lazy(() => import("./pages/Coach/Dashboard"));
const ClientDetails = React.lazy(() => import("./pages/Coach/ClientDetails"));
const Exercises = React.lazy(() => import("./pages/Coach/Exercises"));
const ExerciseForm = React.lazy(() => import("./pages/Coach/ExerciseForm"));

const ClientDashboard = React.lazy(() => import("./pages/Client/Dashboard"));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="join" element={<Join />} />

      {/* Routes Coach */}
      <Route path="coach" element={<CoachDashboard />} />
      <Route path="coach/clients/:clientId" element={<ClientDetails />} />
      <Route path="coach/exercises" element={<Exercises />} />
      <Route path="coach/exercises/new" element={<ExerciseForm />} />
      <Route path="coach/exercises/:exerciseId" element={<ExerciseForm />} />
      <Route
        path="coach/exercises/:exerciseId/edit"
        element={<ExerciseForm />}
      />

      {/* Routes Client */}
      <Route path="client" element={<ClientDashboard />} />

      {/* Routes Admin */}
      <Route path="admin">
        <Route index element={<AdminDashboard />} />
        <Route path="create-coach" element={<AdminCreateCoach />} />
      </Route>
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
