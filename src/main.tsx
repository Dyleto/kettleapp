import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { Toaster } from "./components/ui/toaster.js";
import { ErrorHandler } from "./components/ErrorHandler.js";

ReactDOM.createRoot(document.getElementById("root")! as HTMLElement).render(
  <Provider>
    <Toaster />
    <ErrorHandler />
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
);
