/// <reference types="vite/client" />
// Les types du module virtuel `virtual:pwa-register/react`, d'où vient
// `useRegisterSW`.
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // ajouter ici les autres variables d'environnement, au besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
