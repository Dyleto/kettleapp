import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // `src/components/ui/**` figurait ici : ce chemin n'existe plus depuis que
  // le front est rangé par domaine, et l'exception ne portait donc plus sur
  // rien. Les extraits de Chakra passent le lint comme le reste.
  { ignores: ['dist', 'verif/node_modules'] },
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
    files: ['verif/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  prettierConfig
);
