import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,   // forces polling instead of relying on native file events
      interval: 100       // optional: how often to poll, in milliseconds
    },
    port: 5173           // make sure this matches your current dev server port
  }
});