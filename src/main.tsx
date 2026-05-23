import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthProvider } from "./auth/AuthContext";
import { AuthGate } from "./app/AuthGate";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </StrictMode>,
);
