module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/Tests/component/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    // Navigation mocks
    '^@react-navigation/native$': '<rootDir>/Tests/component/__mocks__/@react-navigation/native.ts',
    '^@react-navigation/bottom-tabs$': '<rootDir>/Tests/component/__mocks__/@react-navigation/bottom-tabs.ts',
    // API service mock — matches the relative import path used by src/screens/main/PremiumScreen.tsx
    // and the absolute-style import from the test file itself
    '^../../services/api$': '<rootDir>/Tests/component/__mocks__/api.ts',
    '^../services/api$': '<rootDir>/Tests/component/__mocks__/api.ts',
    '^../../src/services/api$': '<rootDir>/Tests/component/__mocks__/api.ts',
    // AuthContext mock — test file imports via ../../src/context/AuthContext
    // The actual jest.mock() inline call overrides this, but we keep the mapper as fallback
    '^../../src/context/AuthContext$': '<rootDir>/Tests/component/__mocks__/AuthContext.ts',
  },
  testTimeout: 15000,
};
