import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      // 1. Naikkan limit
      chunkSizeWarningLimit: 1000, 
      
      // 2. Split pakai Object (Lebih stabil)
      rollupOptions: {
        output: {
          manualChunks: {
            // Pisahkan React & ReactDOM
            'react-vendor': ['react', 'react-dom'],
            // Pisahkan library lain yang mungkin besar (misal: routing, ui library)
            // Anda bisa tambahkan library lain di sini jika ketahuan nama npm-nya
          },
        },
      },
    },
  };
});
