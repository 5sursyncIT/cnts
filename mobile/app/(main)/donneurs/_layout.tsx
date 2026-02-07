import { Stack } from "expo-router";
import { colors } from "../../../src/constants/theme";

export default function DonneursLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Donneurs" }} />
      <Stack.Screen name="nouveau" options={{ title: "Nouveau Donneur" }} />
      <Stack.Screen name="[id]" options={{ title: "Fiche Donneur" }} />
      <Stack.Screen name="modifier" options={{ title: "Modifier Donneur" }} />
      <Stack.Screen name="rdv" options={{ title: "Rendez-vous" }} />
    </Stack>
  );
}
