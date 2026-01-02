// vite.config.ts
export default defineConfig({
  // ... other config
  build: {
    chunkSizeWarningLimit: 1000, // <--- FIX 1: Increases the limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {        // <--- FIX 2: Splits code automatically
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
