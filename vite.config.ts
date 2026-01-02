import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Warn if API Key is missing during build
  if (!env.API_KEY && !env.VITE_API_KEY) {
    console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: API_KEY or VITE_API_KEY is not set. The app may not function correctly.");
  }

  return {
    plugins: [react()],
    define: {
      // Define process.env.VITE_API_KEY globally for the browser
      // This allows usages of process.env.VITE_API_KEY in client code
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
    }
  };
});