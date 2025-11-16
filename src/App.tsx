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
import AdminLayout from "./layouts/AdminLayout";
import AdminCreateCoach from "./pages/Admin/CreateCoach";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="login" element={<Login />} />
      <Route index element={<Dashboard />} />
      <Route path="users" element={<Users />} />

      {/* Routes Admin */}
      <Route path="admin" element={<AdminLayout />}>
        <Route path="create-coach" element={<AdminCreateCoach />} />
      </Route>
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
