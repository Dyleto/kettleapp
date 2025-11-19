import {
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import RootLayout from "./layouts/RootLayout";
import Login from "./pages/Login";
import AdminCreateCoach from "./pages/Admin/CreateCoach";
import AuthCallback from "./pages/AuthCallback";
import SelectRole from "./pages/SelectRole";
import AdminDashboard from "./pages/Admin/Dashboard";
import ClientDashboard from "./pages/Client/Dashboard";
import CoachDashboard from "./pages/Coach/Dashboard";
import Join from "./pages/Join";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="join" element={<Join />} />

      <Route path="select-role" element={<SelectRole />} />

      <Route path="coach" element={<CoachDashboard />} />
      <Route path="client" element={<ClientDashboard />} />
      <Route index element={<Dashboard />} />
      <Route path="users" element={<Users />} />

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
