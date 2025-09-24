import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // This is needed to prevent the "useAuth" export is incompatible error
    fastRefresh: true,
    include: "**/*.jsx",
  })],
  base: '/Task-App/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  server: {
    // Add detailed error overlay
    hmr: {
      overlay: true
    }
  },
  build: {
    sourcemap: true
  }

});