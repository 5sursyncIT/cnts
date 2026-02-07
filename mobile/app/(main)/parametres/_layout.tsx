import { Stack } from "expo-router";
import { colors } from "../../../src/constants/theme";

export default function ParametresLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Paramètres" }} />
    </Stack>
  );
}
