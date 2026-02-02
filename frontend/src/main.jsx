import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { initEnv } from "./utils";
import { useAppStore } from "./store";

const container = document.getElementById("root");
const root = createRoot(container);

initEnv()
  .then((res) => {
    useAppStore.getState().setPlatform({
      isMac: res.isMac,
      uniqueHardwareID: res.uniqueHardwareID ?? "",
    });
    root.render(<App />);
  })
  .catch((err) => {
    console.error("initEnv failed:", err);
    root.render(<App />);
  });
