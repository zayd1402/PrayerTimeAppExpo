/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-gesture-handler|react-native-reanimated|@expo|@expo/vector-icons|expo|expo-.*|@testing-library)/)',
  ],
  moduleNameMapper: {
    '@expo/vector-icons': '<rootDir>/src/__mocks__/@expo/vector-icons.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        jsx: 'react-jsx',
        types: ['jest', 'node'],
      },
    }],
  },
};
