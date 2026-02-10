import { Stack } from "expo-router";

export default function CarteLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Ma Carte Donneur",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="historique"
        options={{
          title: "Historique Points",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
