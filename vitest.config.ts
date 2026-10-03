import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest ne couvre que la logique pure, et c'est une division du travail.
 *
 * Le banc de `verif/` mène l'application dans un vrai navigateur : c'est lui
 * qui attrape un bouton sorti de l'écran, un repos qui cache un bloc, une
 * séance qui cesse d'enregistrer. Il coûte quatre minutes et un Chromium.
 *
 * Ce qu'il attrape mal, ce sont les cas de bord d'une fonction : une pyramide
 * de treize paliers, un AMRAP sans exercice, un bilan dont tous les champs
 * manquent. Les atteindre par l'écran demande de construire un jeu de données
 * par cas, et la plupart ne se construisent pas du tout — on ne crée pas une
 * séance vide dans l'atelier.
 *
 * D'où ces deux-là, qui ne se remplacent pas : l'un éprouve ce que l'écran
 * fait, l'autre ce que les fonctions décident. Aucun test ne monte de
 * composant ici — ce serait reconstituer un navigateur en moins fidèle.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // La logique pure vit à la racine des domaines ; les composants et les
    // hooks n'y sont pas, et n'ont rien à y faire.
    include: ['src/**/*.test.ts'],
    environment: 'node',
    reporters: ['dot'],
    // Les tests tournent à Paris, et c'est indispensable.
    //
    // Tout le module des dates existe pour une raison : `toISOString()`
    // bascule en UTC, et une séance enregistrée à 0 h 30 à Paris tomberait la
    // veille dans la grille. Dans un conteneur réglé sur UTC, local et UTC
    // sont la même chose : la garantie devient invérifiable, et deux
    // sabotages — remettre `toISOString()` dans la clé du jour, lire une clé
    // comme une date UTC — ne faisaient tomber aucun test.
    //
    // Paris plutôt qu'un fuseau quelconque parce que c'est celui des
    // utilisateurs de Kettle, et parce que son heure d'été fait de la
    // frontière des jours un cas qui bouge dans l'année.
    env: { TZ: 'Europe/Paris' },
  },
});
