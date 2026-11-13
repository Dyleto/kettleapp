import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // lit .env
  return {
    plugins: [
      react(),
      VitePWA({
        // `prompt` et non `autoUpdate` : c'est l'application qui choisit le
        // moment de prendre la nouvelle version, dans `useAppUpdate`.
        //
        // `autoUpdate` posait `skipWaiting` et `clientsClaim` dans le service
        // worker, mais n'enregistrait rien d'autre qu'un `register('/sw.js')`
        // au chargement : aucune vérification tant que l'onglet restait
        // ouvert, et aucun rechargement de la page en cours. La nouvelle
        // version n'arrivait qu'au prochain F5.
        //
        // Il faisait aussi prendre la main au nouveau service worker sur une
        // page qui continuait d'exécuter l'ancien paquet. Avec dix-neuf
        // routes en `React.lazy`, l'ancienne page demandant son ancien
        // morceau haché pouvait recevoir un 404 — que le filet
        // `vite:preloadError` de `main.tsx` répare, au prix d'un rechargement
        // visible. Ici l'ancien service worker garde la main, et ses propres
        // morceaux, jusqu'au rechargement que l'application choisit.
        registerType: "prompt",

        // L'enregistrement se fait depuis `virtual:pwa-register/react` : rien
        // ne doit être injecté dans la page, sinon le service worker serait
        // enregistré deux fois.
        injectRegister: false,
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        workbox: {
          // Les polices du produit entrent dans le cache du service worker,
          // sans quoi une séance guidée ouverte sans réseau retombait sur la
          // police du système : la liste par défaut de Workbox ne retient que
          // js, css et html. Mesuré : le premier paquet n'en précachait
          // aucune des cinq.
          //
          // Seulement les deux sous-ensembles « latin » (98 Ko à eux deux),
          // qui couvrent tout le français, « œ » compris. Les sous-ensembles
          // étendu et vietnamien restent à la demande : le navigateur ne les
          // télécharge que si un caractère de leur plage s'affiche.
          globPatterns: [
            "**/*.{js,css,html}",
            "**/*-latin-w{dth,ght}-normal-*.woff2",
          ],
        },
        manifest: {
          name: "Kettle App",
          short_name: "Kettle",
          description: "Plateforme de coaching sportif personnalisé",
          // La couleur de `bg.canvas`, la même que la balise `theme-color` de
          // `index.html` : l'écran de lancement et la barre du système
          // prolongent la page au lieu de la border d'un gris voisin.
          theme_color: "#17181B",
          background_color: "#17181B",
          display: "standalone",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL, // localhost:3000 en dev
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
