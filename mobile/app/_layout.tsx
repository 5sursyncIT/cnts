import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { openDatabase } from "../src/db/database";
import { useAuthStore } from "../src/stores/auth.store";
import { useNetworkStore } from "../src/stores/network.store";
import { startPeriodicSync, stopPeriodicSync } from "../src/sync/engine";
import { getDatabase } from "../src/db/database";
import { colors } from "../src/constants/theme";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const { isLoading, isAuthenticated, token, restore } = useAuthStore();
  const { setConnected, isConnected } = useNetworkStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Init DB
  useEffect(() => {
    openDatabase().then(() => setDbReady(true));
  }, []);

  // 2. Restore auth session
  useEffect(() => {
    if (dbReady) restore();
  }, [dbReady]);

  // 3. Network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // 4. Sync engine lifecycle
  useEffect(() => {
    if (isAuthenticated && token && isConnected && dbReady) {
      const db = getDatabase();
      startPeriodicSync(db, token);
    } else {
      stopPeriodicSync();
    }
    return () => stopPeriodicSync();
  }, [isAuthenticated, token, isConnected, dbReady]);

  // 5. Auth redirect
  useEffect(() => {
    if (isLoading || !dbReady) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuth) {
      router.replace("/(main)/home");
    }
  }, [isAuthenticated, isLoading, dbReady, segments]);

  if (isLoading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}
