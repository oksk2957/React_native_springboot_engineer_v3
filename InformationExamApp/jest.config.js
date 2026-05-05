module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(expo|expo-modules-core|expo-modules-core/build|@react-native|@react-navigation|@react-native-async-storage|react-native-pager-view|react-native-screens|react-native-safe-area-context|react-native-web|zustand)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
