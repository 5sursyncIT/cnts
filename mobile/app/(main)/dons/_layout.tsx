import { Stack } from "expo-router";
import { colors } from "../../../src/constants/theme";

export default function DonsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Collectes du jour" }} />
      <Stack.Screen name="nouveau" options={{ title: "Nouveau Don" }} />
      <Stack.Screen name="[id]" options={{ title: "Détail Don" }} />
    </Stack>
  );
}
