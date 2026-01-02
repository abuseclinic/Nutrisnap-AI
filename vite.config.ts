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
      
      // 1. Naikkan batas peringatan menjadi 1000kb (agar warning hilang)
      chunkSizeWarningLimit: 1000,

      // 2. Konfigurasi manualChunks menggunakan FUNGSI (Lebih ampuh)
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Jika file berasal dari folder 'node_modules', pindahkan ke file terpisah
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
