import { Stack } from "expo-router";
import { colors } from "../../../src/constants/theme";

export default function SyncLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Synchronisation" }} />
      <Stack.Screen name="conflits" options={{ title: "Conflits" }} />
    </Stack>
  );
}
