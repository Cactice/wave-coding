const withTM = require('next-transpile-modules')(['three']);
module.exports = withTM({
  reactStrictMode: true,
  basePath: process.env.NODE_ENV === 'production' ? '/audiorn' : '',
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
  ],
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  globals: {
    React: 'writable',
  },
});
