// Mock expo-crypto
jest.mock("expo-crypto", () => ({
  randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 10),
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  Paths: { document: { uri: "file:///mock/document/" } },
  File: jest.fn(),
  Directory: jest.fn(),
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));
