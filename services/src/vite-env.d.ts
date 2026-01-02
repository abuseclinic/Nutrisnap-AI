/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Define your environment variables here with their types
  readonly VITE_GEMINI_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
