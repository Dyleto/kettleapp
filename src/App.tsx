import {
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Login from "./pages/Login";
import AdminCreateCoach from "./pages/Admin/CreateCoach";
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard from "./pages/Admin/Dashboard";
import ClientDashboard from "./pages/Client/Dashboard";
import CoachDashboard from "./pages/Coach/Dashboard";
import Join from "./pages/Join";
import ClientDetails from "./pages/Coach/ClientDetails";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="join" element={<Join />} />

      <Route path="coach" element={<CoachDashboard />} />

      <Route path="coach/clients/:clientId" element={<ClientDetails />} />
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
