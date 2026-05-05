import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo', () => ({
  useAssets: () => [true],
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [null, null, null],
  useAutoDiscovery: () => null,
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Non-serializable values') ||
      args[0].includes('Reanimated') ||
      args[0].includes('ViewPropTypes'))
  ) {
    return;
  }
  originalWarn(...args);
};
