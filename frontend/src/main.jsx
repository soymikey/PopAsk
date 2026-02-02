import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import App from "./App";
import { initEnv } from "./utils";
import { useAppStore } from "./store";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Something went wrong</h2>
      <pre style={{ textAlign: "left", overflow: "auto", margin: "16px 0" }}>
        {error?.message}
      </pre>
      <button type="button" onClick={resetErrorBoundary}>
        Reload
      </button>
    </div>
  );
}

const AppWithErrorBoundary = () => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(err) => console.error("App error:", err)}
  >
    <App />
  </ErrorBoundary>
);

const container = document.getElementById("root");
const root = createRoot(container);

initEnv()
  .then((res) => {
    useAppStore.getState().setPlatform({
      isMac: res.isMac,
      uniqueHardwareID: res.uniqueHardwareID ?? "",
    });
    root.render(<AppWithErrorBoundary />);
  })
  .catch((err) => {
    console.error("initEnv failed:", err);
    root.render(<AppWithErrorBoundary />);
  });
