import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY globally for the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      
      // FIX 1: Adjust chunk size limit (e.g., increase to 1000kb)
      chunkSizeWarningLimit: 1000,

      // FIX 2: Use manualChunks to improve chunking
      rollupOptions: {
        output: {
          manualChunks: {
            // This creates a separate chunk containing React and ReactDOM
            'react-vendor': ['react', 'react-dom'],
            
            // You can add other heavy libraries here if needed, for example:
            // 'ui-library': ['@mui/material', '@emotion/react'],
          },
        },
      },
    },
  };
});
