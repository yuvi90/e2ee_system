import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { queryClient } from "./providers/queryClient";
import { debugCurrentToken } from "./shared/utils/auth";
import "./styles/index.css";

// Make debug function available globally in development
if (import.meta.env.DEV) {
  (window as any).debugToken = debugCurrentToken;
  console.log("🔧 Debug function available: debugToken()");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
