import { Route, createRoutesFromElements, createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Login from "./pages/Login";
import AdminCreateCoach from "./pages/Admin/CreateCoach";
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard from "./pages/Admin/Dashboard";
import ClientDashboard from "./pages/Client/Dashboard";
import CoachDashboard from "./pages/Coach/Dashboard";
import Join from "./pages/Join";
import ClientDetails from "./pages/Coach/ClientDetails";
import CreateProgram from "./pages/Coach/CreateProgram";
import Exercises from "./pages/Coach/Exercises";
import ExerciseForm from "./pages/Coach/ExerciseForm";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="join" element={<Join />} />

      {/* Routes Coach */}
      <Route path="coach" element={<CoachDashboard />} />
      <Route path="coach/clients/:clientId" element={<ClientDetails />} />
      <Route path="coach/clients/:clientId/programs/new" element={<CreateProgram />} />
      <Route path="coach/exercises" element={<Exercises />} />
      <Route path="coach/exercises" element={<Exercises />} />
      <Route path="coach/exercises/new" element={<ExerciseForm />} />
      <Route path="coach/exercises/:exerciseId" element={<ExerciseForm />} />
      <Route path="coach/exercises/:exerciseId/edit" element={<ExerciseForm />} />

      {/* Routes Client */}
      <Route path="client" element={<ClientDashboard />} />

      {/* Routes Admin */}
      <Route path="admin">
        <Route index element={<AdminDashboard />} />
        <Route path="create-coach" element={<AdminCreateCoach />} />
      </Route>
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
