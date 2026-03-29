import eslint from '@eslint/js';
import commentLengthPlugin from 'eslint-plugin-comment-length';
import jestPlugin from 'eslint-plugin-jest';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import unicornPlugin from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  commentLengthPlugin.configs['flat/recommended'],
  unicornPlugin.configs.unopinionated,
  prettierPlugin,

  {
    plugins: {
      perfectionist: perfectionistPlugin,
    },

    rules: {
      'comment-length/limit-multi-line-comments': ['warn', { maxLength: 97 }],
      'comment-length/limit-single-line-comments': ['warn', { maxLength: 97 }],

      'perfectionist/sort-enums': 'warn',
      'perfectionist/sort-imports': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'perfectionist/sort-interfaces': 'warn',
      'perfectionist/sort-named-imports': 'warn',
      'perfectionist/sort-object-types': 'warn',
      'perfectionist/sort-objects': 'warn',
      'perfectionist/sort-sets': 'warn',
      'perfectionist/sort-union-types': 'warn',

      'unicorn/no-array-for-each': ['off'],
      'unicorn/numeric-separators-style': ['off'],
      'unicorn/prefer-module': ['off'],
    },
  },

  {
    extends: [tsEslint.configs.strictTypeChecked, tsEslint.configs.stylisticTypeChecked],

    files: ['**/*.ts'],

    languageOptions: {
      globals: globals.node,
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
      },
    },

    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/prefer-nullish-coalescing': 'off',

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
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'jest/no-conditional-expect': 'off',
    },
  },

  globalIgnores(['node_modules', 'dist', 'infra/cdk/cdk.out']),
);
