// Silence React Native warnings in test environment
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return Object.setPrototypeOf({
    Platform: { OS: 'ios', Version: 16 },
    Appearance: { getColorScheme: () => 'light', addChangeListener: () => ({ remove: () => {} }) },
    NativeModules: {
      ...RN.NativeModules,
      SettingsManager: { settings: {} },
    },
  }, RN);
});

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    getNumber: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
