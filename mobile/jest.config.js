/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|expo-.*|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|date-fns|zustand)/)",
  ],
  setupFiles: ["./src/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "setup\\.ts$"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
