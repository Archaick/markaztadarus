import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "./index.css";
import App from "./App.jsx";
import { HelmetProvider } from "react-helmet-async";
import "./i18n";
import LoadingOverlay from "./components/LoadingOverlay";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MantineProvider>
      <HelmetProvider>
        <Suspense fallback={<LoadingOverlay />}>
          <App />
        </Suspense>
      </HelmetProvider>
    </MantineProvider>
  </StrictMode>
);
