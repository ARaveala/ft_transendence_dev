import React from "react";                 // Import React library (needed to use JSX and React features)
import ReactDOM from "react-dom/client";   // Import ReactDOM to attach the React app to the actual HTML page
import App from "./App";                   // Import the root App component (the entry point of the SPA UI)
import "./styles/globals.css";             // Import global CSS (Tailwind resets, base styles, etc.)


// Development-only setup for Mock Service Worker (MSW)
// MSW intercepts API calls and sends mock backend responses
// Only for testing the frontend before the backend is ready
// -> comment out if not needed!

if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start({
    onUnhandledRequest: 'warn'
  }).then(() => {
    console.log('MSW worker started');
  });
}

// Attach the <App /> React component into the <div id="root"></div> in index.html
// React.StrictMode = development helper that shows potential problems

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);