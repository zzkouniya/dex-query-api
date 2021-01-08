module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-standard-with-typescript'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    indent: ['error', 2],
    'no-await-in-loop': 'off',
    'no-constant-condition': 'off',
    'no-continue': 'off',
    'no-restricted-syntax': 'off',
    'no-console': 'off',
    'max-len': 'off',
    'prefer-destructuring': 'off',
    'class-methods-use-this': 'off',
    camelcase: 'off',
    'consistent-return': 'off',
    'no-use-before-define': 'off',
    'no-plusplus': 'off',
    'no-bitwise': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  }
}
