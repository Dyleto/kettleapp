/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // ajouter ici les autres variables d'environnement, au besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
