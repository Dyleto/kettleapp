import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { ThemeProvider } from "./contexts/ThemeContext.js";
import { Toaster } from "./components/ui/toaster.js";
import { ErrorHandler } from "./components/ErrorHandler.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/queryClient.js";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ErrorBoundary from "./components/ErrorBoundary.js";

ReactDOM.createRoot(document.getElementById("root")! as HTMLElement).render(
  <Provider forcedTheme="dark">
    <ErrorBoundary>
      <Toaster />
      <ErrorHandler />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </Provider>,
);
