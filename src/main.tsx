import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider.js";
import { AuthProvider } from "./contexts/AuthContext.js";

ReactDOM.createRoot(document.getElementById("root")! as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <Provider>
        <App />
      </Provider>
    </AuthProvider>
  </React.StrictMode>
);
