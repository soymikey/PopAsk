import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { initEnv } from "./utils";

initEnv().then((res) => {
  window.config_ = res;
  console.log("window.config_", window.config_);
  const container = document.getElementById("root");

  const root = createRoot(container);

  root.render(
    // <React.StrictMode>
    //     <RouterProvider router={router}/>
    // </React.StrictMode>
    <App />
  );
});
