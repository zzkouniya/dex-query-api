module.exports = {
  env: {
    browser: true,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
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
    'camelcase': 'off',
    'consistent-return': 'off',
    'no-use-before-define': 'off',
    'no-plusplus': 'off',
    'no-bitwise': 'off',
  },
};
