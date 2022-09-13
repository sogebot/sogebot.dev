module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    'func-call-spacing':                        'off',
    '@typescript-eslint/func-call-spacing':     ['error'],
    'key-spacing':                              ['error', {
      beforeColon: false, afterColon: true, align: 'value',
    }],
    'object-property-newline': ['error', {
      'allowAllPropertiesOnSameLine': true,
    }],
    'object-curly-spacing': ['error', 'always'],
    'object-curly-newline': ['error', {
      ObjectExpression:  {
        multiline: true, minProperties: 2,
      },
      ImportDeclaration: {
        multiline: true, minProperties: 3,
      },
      ExportDeclaration: {
        multiline: true, minProperties: 3,
      },
    }],
    '@typescript-eslint/no-unused-vars': ['error', {
      ignoreRestSiblings: true,
    }],
    'no-multiple-empty-lines': ['error', {
      max: 1, maxEOF: 0, maxBOF: 0,
    }],

    'import/order': ['error', {
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
    indent:                                             'off',
    '@typescript-eslint/indent':                        ['error', 2],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    quotes:                                             ['error', 'single', {
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
    semi:                                               'off',
    '@typescript-eslint/semi':                          ['error'],
    curly:                                              ['error'],
    'prefer-const':                                     ['error', {
      destructuring:          'all',
      ignoreReadBeforeAssign: false,
    }],
    'no-var':        2,
    'prefer-spread': 'error',
    'comma-dangle':  [2, 'always-multiline'],
    'sort-imports':  ['error', {
      ignoreCase:            true,
      ignoreDeclarationSort: true,
      ignoreMemberSort:      false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],
    'dot-notation':       2,
    'operator-linebreak': ['error', 'before'],
    'brace-style':        'error',
    'no-useless-call':    'error',
  },
};
