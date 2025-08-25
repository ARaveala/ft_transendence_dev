import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { worker } from "./mocks/browser";  // only for testing purposes
import "./styles/globals.css";

// Starts the service worker in dev mode -- for testing purposes
if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start();
}


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
