import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/constants/theme";

/** Icônes simples en texte (remplaçables par @expo/vector-icons). */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#FFF",
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: { paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Accueil",
          headerTitle: "CNTS Agent",
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="donneurs"
        options={{
          title: "Donneurs",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dons"
        options={{
          title: "Dons",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="🩸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="carte"
        options={{
          title: "Ma Carte",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="📇" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: "Sync",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="🔄" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: "Plus",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
