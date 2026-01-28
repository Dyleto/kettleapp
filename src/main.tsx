import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { Toaster } from "./components/ui/toaster.js";
import { ErrorHandler } from "./components/ErrorHandler.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/queryClient.js";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

ReactDOM.createRoot(document.getElementById("root")! as HTMLElement).render(
  <Provider forcedTheme="dark">
    <Toaster />
    <ErrorHandler />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </Provider>,
);
