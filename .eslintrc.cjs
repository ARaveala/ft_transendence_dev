module.exports = {
  root: true,
	env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:promise/recommended',
    'plugin:node/recommended'],

  plugins: ['node', 'promise', 'security', 'unicorn', 'no-floating-promise',],
  rules: {
 // ✅ Promise rules
  'promise/always-return': 'warn',
  'promise/no-nesting': 'warn',
  'promise/catch-or-return': 'warn',
  'promise/no-return-wrap': 'warn',

  // ✅ Node.js rules
  'node/no-unsupported-features/es-syntax': 'off',
  'node/no-missing-import': 'off',
  'node/no-extraneous-import': 'warn',
  'node/no-missing-require': 'off',
  'node/no-unpublished-require': 'warn',

  // ✅ Security rules
  'security/detect-object-injection': 'warn',
  'security/detect-unsafe-regex': 'warn',
  'security/detect-eval-with-expression': 'error',

  // ✅ Unicorn rules (modern JS best practices)
  'unicorn/prefer-array-flat': 'warn',
  'unicorn/prefer-optional-catch-binding': 'warn',
  'unicorn/no-null': 'warn',
  'unicorn/prefer-switch': 'warn',

  // ✅ Floating promise detection (experimental)
  'no-floating-promise/no-floating-promise': 'warn',

  // ✅ General JS rules
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'eqeqeq': 'error',
  'no-console': 'warn',
  },
};

/**
 * module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:security/recommended'],
  plugins: [
    'promise',
    'node',
    'security',
    'unicorn',
    'no-floating-promise',
  ],
  rules: {
    'promise/always-return': 'warn',
    'promise/no-nesting': 'warn',
    'node/no-unsupported-features/es-syntax': 'off',
    'unicorn/prefer-array-flat': 'warn',
    'security/detect-object-injection': 'warn',
    'no-floating-promise/no-floating-promise': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'eqeqeq': 'error',
    'no-console': 'warn',
  },
 */

//module.exports = {
//  root: true,
//  env: {
//    node: true,
//    es2021: true,
//  },
//  parser: '@typescript-eslint/parser',
//  plugins: ['node', 'promise', '@typescript-eslint'],
//  extends: ['eslint:recommended'],
//  rules: {
//    'node/no-unsupported-features/es-syntax': 'off',
//    'node/no-missing-import': 'off',
//    'promise/always-return': 'warn',
//    'promise/no-nesting': 'warn',
//    '@typescript-eslint/no-floating-promises': 'warn',
//    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
//    'eqeqeq': 'error',
//    'no-console': 'warn',
//  },
//};
