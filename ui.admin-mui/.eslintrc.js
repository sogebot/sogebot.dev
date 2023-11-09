// Migrate built-in rules to @stylistic/js namespace
/* eslint @stylistic/migrate/migrate-js: "error" */

// Migrate `@typescript-eslint` rules to @stylistic/ts namespace
/* eslint @stylistic/migrate/migrate-ts: "error" */

module.exports = {
  plugins: [
    '@stylistic',
    '@stylistic/migrate',
    'import-newlines',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'no-restricted-imports':                    'off',
    '@typescript-eslint/no-restricted-imports': [
      'warn',
      {
        'name':        'react-redux',
        'importNames': ['useSelector', 'useDispatch'],
        'message':     'Use typed hooks `useAppDispatch` and `useAppSelector` instead.',
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@stylistic/func-call-spacing':             'off',
    '@stylistic/key-spacing':                   ['error', {
      beforeColon: false, afterColon: true, align: 'value',
    }],
    'no-useless-escape':                  'off',
    '@stylistic/object-property-newline': ['error', {
      'allowAllPropertiesOnSameLine': true,
    }],
    '@stylistic/object-curly-spacing':   ['error', 'always'],
    // '@stylistic/object-curly-newline': ['error', {
    //   'ObjectExpression': 'always',
    //   'ObjectPattern':    {
    //     'multiline': true,
    //   },
    //   'ImportDeclaration': 'never',
    //   'ExportDeclaration': {
    //     'multiline': true, 'minProperties': 3,
    //   },
    // }],
    '@typescript-eslint/no-unused-vars': ['error', {
      ignoreRestSiblings: true,
    }],
    '@stylistic/no-multiple-empty-lines': ['error', {
      max: 1, maxEOF: 0, maxBOF: 0,
    }],
    'import/no-named-as-default': 'off',
    'import/order':               ['error', {
      groups:             ['builtin', 'external', ['internal'], ['parent', 'sibling'], 'index'],
      'newlines-between': 'always',
      alphabetize:        {
        order: 'asc', caseInsensitive: true,
      },
      pathGroups: [
        {
          pattern:  'src/**',
          group:    'internal',
          position: 'after',
        },
      ],
    },
    ],
    'import/no-cycle': [2, {
      maxDepth: 1,
    }],
    'import/newline-after-import': ['error', {
      count: 1,
    }],

    'no-shadow':                                        'off',
    '@typescript-eslint/no-shadow':                     ['error'],
    '@stylistic/indent':                                ['error', 2],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@stylistic/quotes':                                ['error', 'single', {
      allowTemplateLiterals: true,
    }],
    '@typescript-eslint/camelcase':                     'off',
    '@typescript-eslint/no-explicit-any':               'off',
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-use-before-define':          0,
    '@typescript-eslint/class-name-casing':             0,
    '@typescript-eslint/prefer-interface':              0,
    '@typescript-eslint/no-namespace':                  0,
    'interface-over-type-literal':                      0,
    '@typescript-eslint/no-var-requires':               1,
    '@typescript-eslint/no-inferrable-types':           2,
    '@stylistic/semi':                                  'error',
    curly:                                              ['error'],
    'prefer-const':                                     ['error', {
      destructuring:          'all',
      ignoreReadBeforeAssign: false,
    }],
    'no-var':        2,
    'prefer-spread': 'error',
    // '@stylistic/comma-dangle': [2, 'always-multiline'],
    'sort-imports':  ['error', {
      ignoreCase:            true,
      ignoreDeclarationSort: true,
      ignoreMemberSort:      false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],
    'dot-notation':                  2,
    '@stylistic/operator-linebreak': ['error', 'before'],
    '@stylistic/brace-style':        'error',
    'no-useless-call':               'error',
    'import-newlines/enforce':       ['error', { items: 40 }],
  },
};
