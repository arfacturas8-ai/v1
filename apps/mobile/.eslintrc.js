module.exports = {
  extends: [
    'expo',
    '@react-native',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react-hooks',
  ],
  rules: {
    // React Native specific rules
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // React rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off',
    
    // General rules
    'no-console': 'warn',
    'no-unused-vars': 'off', // Use TypeScript version instead
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off', // Use TypeScript version
    '@typescript-eslint/no-redeclare': 'error',
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    
    // Disable problematic rules for React Native
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
  },
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
  },
  globals: {
    __DEV__: 'readonly',
    NodeJS: 'readonly',
    RequestInit: 'readonly',
  },
  settings: {
    'react-native/style-sheet-object-names': ['StyleSheet', 'styles'],
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    '.expo/',
    'dist/',
    'build/',
  ],
};