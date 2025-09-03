import { defineConfig } from 'vite'        // Import Vite's defineConfig helper to get proper type hints
import react from '@vitejs/plugin-react'   // Import React plugin to enable JSX/TSX support and fast refresh

export default defineConfig({              // Export Vite configuration
  plugins: [react()],                      // React plugin enables JSX/TSX compilation and hot module replacement
  
  // Dev server options
  server: {
    open: true,                            // Automatically open browser when dev server starts
    port: 5173,                            // Port for the development server
  },

  // Build options for production
  build: {
    outDir: 'dist'                          // Directory where compiled/optimized files are output
  }
});