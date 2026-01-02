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
      
      // 1. Increase the chunk size warning limit to 1000kb
      chunkSizeWarningLimit: 1000,
      
      // 2. Configure manual chunks to split large files
      rollupOptions: {
        output: {
          manualChunks(id) {
            // If the module comes from 'node_modules', move it to a separate file named 'vendor'
            // This prevents the main 'index' file from becoming too large (>500kb)
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
