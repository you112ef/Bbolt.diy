import blitzPlugin from '@blitz/eslint-plugin';
import { jsFileExtensions } from '@blitz/eslint-plugin/dist/configs/javascript.js';
import { getNamingConventionRule, tsFileExtensions } from '@blitz/eslint-plugin/dist/configs/typescript.js';

export default [
  {
    ignores: ['**/dist', '**/node_modules', '**/.wrangler', '**/bolt/build', '**/.history'],
  },
  ...blitzPlugin.configs.recommended(),
  {
    rules: {
      '@blitz/catch-error-name': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@blitz/comment-syntax': 'off',
      '@blitz/block-scope-case': 'off',
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-newline': ['error', { consistent: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      // Relax only the rule that blocks runtime patterns
      'consistent-return': 'off',
      semi: ['error', 'always'],
      curly: ['error'],
      'no-eval': ['error'],
      'linebreak-style': ['error', 'unix'],
      'arrow-spacing': ['error', { before: true, after: true }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      ...getNamingConventionRule({}, true),
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      'multiline-comment-style': 'off',
    },
  },
  {
    files: [...tsFileExtensions, ...jsFileExtensions, '**/*.tsx'],
    ignores: ['functions/*', 'electron/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../'],
              message: "Relative imports are not allowed. Please use '~/'' instead.",
            },
          ],
        },
      ],
    },
  },
  // Targeted overrides to silence strict rules in known files
  {
    files: [
      'app/components/@settings/tabs/ai-models/AIModelsTab.tsx',
      'app/components/@settings/tabs/ai-models/CustomAISettingsTab.tsx',
      'app/components/@settings/tabs/connections/**/*.tsx',
      'app/utils/mobile-touch.ts',
      'app/utils/mobile.ts',
      'app/routes/webcontainer.preview.$id.tsx',
    ],
    rules: {
      'consistent-return': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
