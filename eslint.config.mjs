import eslint from '@eslint/js';
import commentLengthPlugin from 'eslint-plugin-comment-length';
import jestPlugin from 'eslint-plugin-jest';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  commentLengthPlugin.configs['flat/recommended'],
  prettierPlugin,

  {
    rules: {
      'comment-length/limit-single-line-comments': ['warn', { maxLength: 97 }],
      'comment-length/limit-multi-line-comments': ['warn', { maxLength: 97 }],
    },
  },

  {
    files: ['**/*.ts'],

    extends: [tsEslint.configs.strictTypeChecked, tsEslint.configs.stylisticTypeChecked],

    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
      },
      globals: globals.node,
    },

    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
    },
  },

  {
    files: ['tests/**/*.ts', '**/*.test.ts'],

    ...jestPlugin.configs['flat/recommended'],

    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      'jest/no-conditional-expect': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  globalIgnores(['node_modules', 'dist', 'infra/cdk/cdk.out']),
);
