import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useSyncStore } from "../../../src/stores/sync.store";
import { useNetworkStore } from "../../../src/stores/network.store";
import { getDatabase } from "../../../src/db/database";
import { countTodayDons } from "../../../src/db/repositories/dons.repo";
import { countPendingDonneurs } from "../../../src/db/repositories/donneurs.repo";
import { countUpcomingRdv } from "../../../src/db/repositories/rdv.repo";
import { todayISO, formatDateTime } from "../../../src/utils/date";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isConnected } = useNetworkStore();
  const { pendingCount, lastSyncAt, isSyncing } = useSyncStore();
  const [todayDons, setTodayDons] = useState(0);
  const [pendingDonneurs, setPendingDonneurs] = useState(0);
  const [upcomingRdv, setUpcomingRdv] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const db = getDatabase();
      const [donsCount, donneursCount, rdvCount] = await Promise.all([
        countTodayDons(db, todayISO()),
        countPendingDonneurs(db),
        countUpcomingRdv(db),
      ]);
      setTodayDons(donsCount);
      setPendingDonneurs(donneursCount);
      setUpcomingRdv(rdvCount);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, pendingCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* En-tête */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{user?.email ?? "Agent"}</Text>
        </View>
        <Badge
          label={isConnected ? "En ligne" : "Hors ligne"}
          variant={isConnected ? "success" : "warning"}
        />
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{todayDons}</Text>
          <Text style={styles.statLabel}>Dons aujourd'hui</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, pendingCount > 0 && { color: colors.warning }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>En attente sync</Text>
        </Card>
      </View>

      {/* RDV à venir */}
      {upcomingRdv > 0 && (
        <Pressable onPress={() => router.push("/(main)/donneurs/rdv")}>
          <Card style={{ ...styles.statCard, marginBottom: spacing.md }}>
            <Text style={[styles.statValue, { color: colors.info }]}>{upcomingRdv}</Text>
            <Text style={styles.statLabel}>RDV à venir</Text>
          </Card>
        </Pressable>
      )}

      {/* Actions rapides */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>

      <Pressable onPress={() => router.push("/(main)/donneurs/nouveau")}>
        <Card style={styles.actionCard}>
          <Text style={styles.actionIcon}>➕</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Nouveau donneur</Text>
            <Text style={styles.actionSub}>Enregistrer un donneur sur le terrain</Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/(main)/dons/nouveau")}>
        <Card style={styles.actionCard}>
          <Text style={styles.actionIcon}>🩸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Enregistrer un don</Text>
            <Text style={styles.actionSub}>Prélèvement de sang total</Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/(main)/donneurs")}>
        <Card style={styles.actionCard}>
          <Text style={styles.actionIcon}>🔍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Rechercher un donneur</Text>
            <Text style={styles.actionSub}>Vérifier éligibilité, historique</Text>
          </View>
        </Card>
      </Pressable>

      {/* Sync status */}
      {lastSyncAt && (
        <Text style={styles.syncInfo}>
          Dernière sync : {formatDateTime(lastSyncAt)}
          {isSyncing ? " (en cours...)" : ""}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: fontSize.md, color: colors.textSecondary },
  name: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: "center", padding: spacing.md },
  statValue: { fontSize: fontSize.xxxl, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: "700", color: colors.text,
    marginBottom: spacing.sm,
  },
  actionCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    marginBottom: spacing.sm,
  },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  actionSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  syncInfo: {
    fontSize: fontSize.xs, color: colors.textMuted,
    textAlign: "center", marginTop: spacing.lg,
  },
});
