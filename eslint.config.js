import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import { readdirSync } from 'node:fs';

/**
 * Les frontières du code, tenues par le lint et non par la mémoire.
 *
 * `shared` lisait deux fois l'authentification, une fonctionnalité ; quinze
 * imports entraient dans une autre fonctionnalité par l'intérieur — le coach
 * prenait au programme ses hooks et ses composants un par un. Rien ne
 * l'interdisait, donc cela arrivait.
 *
 *   — `shared`, `kit` et `domain` n'importent aucune fonctionnalité : ce
 *     sont elles qui les lisent ;
 *   — `domain` n'importe ni React ni le kit : c'est de la logique, qui se
 *     teste sans écran ;
 *   — une fonctionnalité n'entre dans une autre que par son `index.ts`, qui
 *     dit ce qu'elle prête.
 *
 * Un chemin relatif qui remonterait d'une fonctionnalité dans une autre
 * (`../../coach/…`) échappe à ces motifs ; le code n'en porte aucun, et
 * l'outil de déplacement écrit des chemins en `@/`.
 */
const FEATURES = readdirSync(new URL('./src/features', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const NO_FEATURE = {
  group: ['@/features', '@/features/*', '@/features/**'],
  message:
    'shared, kit et domain ne lisent aucune fonctionnalité : ce sont elles qui les lisent.',
};

export default tseslint.config(
  // `src/components/ui/**` figurait ici : ce chemin n'existe plus depuis que
  // le front est rangé par domaine, et l'exception ne portait donc plus sur
  // rien. Les extraits de Chakra passent le lint comme le reste.
  { ignores: ['dist', 'verify/node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Le banc et les scripts sont du code, et rien ne les gardait : ni lint ni
  // formateur ne les regardaient. Ils tournent sous Node, d'où leurs propres
  // variables globales.
  {
    files: ['verify/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}', 'src/kit/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [NO_FEATURE] }] },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            NO_FEATURE,
            {
              group: ['@/kit', '@/kit/*', 'react', 'react-*', '@chakra-ui/*'],
              message:
                'domain est de la logique pure : ni React ni le kit, pour se tester sans écran.',
            },
          ],
        },
      ],
    },
  },
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/**', `!@/features/${feature}/**`],
              message:
                'Une fonctionnalité n’entre dans une autre que par son index.ts.',
            },
          ],
        },
      ],
    },
  })),
  prettierConfig
);
