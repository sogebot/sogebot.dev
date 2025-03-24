import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import stylisticMigrate from '@stylistic/eslint-plugin-migrate';
import { defineConfig } from 'eslint/config';
import importNewlines from 'eslint-plugin-import-newlines';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([{
  extends: fixupConfigRules(compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  )),

  plugins: {
    '@stylistic': stylistic,
    '@stylistic/migrate': stylisticMigrate,
    'import-newlines': importNewlines,
  },

  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'no-restricted-imports': 'off',
    'import/no-unresolved': 'off',

    '@typescript-eslint/no-restricted-imports': ['warn', {
      name: 'react-redux',
      importNames: ['useSelector', 'useDispatch'],
      message: 'Use typed hooks `useAppDispatch` and `useAppSelector` instead.',
    }],

    '@typescript-eslint/no-non-null-assertion': 'off',
    '@stylistic/func-call-spacing': 'off',
    'no-useless-escape': 'off',

    '@stylistic/object-property-newline': ['error', {
      allowAllPropertiesOnSameLine: true,
    }],

    '@stylistic/object-curly-spacing': ['error', 'always'],

    '@typescript-eslint/no-unused-vars': ['error', {
      ignoreRestSiblings: true,
    }],

    '@stylistic/no-multiple-empty-lines': ['error', {
      max: 1,
      maxEOF: 0,
      maxBOF: 0,
    }],

    'import/no-named-as-default': 'off',

    'import/order': ['error', {
      groups: ['builtin', 'external', ['internal'], ['parent', 'sibling'], 'index'],
      'newlines-between': 'always',

      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },

      pathGroups: [{
        pattern: 'src/**',
        group: 'internal',
        position: 'after',
      }],
    }],

    'import/no-cycle': [2, {
      maxDepth: 1,
    }],

    'import/newline-after-import': ['error', {
      count: 1,
    }],

    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@stylistic/indent': ['error', 2],
    '@typescript-eslint/explicit-member-accessibility': 'off',

    '@stylistic/quotes': ['error', 'single', {
      allowTemplateLiterals: true,
    }],

    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/class-name-casing': 0,
    '@typescript-eslint/prefer-interface': 0,
    '@typescript-eslint/no-namespace': 0,
    'interface-over-type-literal': 0,
    '@typescript-eslint/no-var-requires': 1,
    '@typescript-eslint/no-inferrable-types': 2,
    '@stylistic/semi': 'error',
    curly: ['error'],

    'prefer-const': ['error', {
      destructuring: 'all',
      ignoreReadBeforeAssign: false,
    }],

    'no-var': 2,
    'prefer-spread': 'error',

    'sort-imports': ['error', {
      ignoreCase: true,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],

    'dot-notation': 2,
    '@stylistic/operator-linebreak': ['error', 'before'],
    '@stylistic/brace-style': 'error',
    'no-useless-call': 'error',

    'import-newlines/enforce': ['error', {
      items: 40,
    }],
  },
}]);