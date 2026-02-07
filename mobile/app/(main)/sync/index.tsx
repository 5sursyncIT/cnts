import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { useNetworkStore } from "../../../src/stores/network.store";
import { useSyncStore } from "../../../src/stores/sync.store";
import { useAuthStore } from "../../../src/stores/auth.store";
import { getDatabase } from "../../../src/db/database";
import { getQueueStats, getFailedEvents } from "../../../src/db/repositories/event-queue.repo";
import { runSyncCycle } from "../../../src/sync/engine";
import { formatDateTime } from "../../../src/utils/date";

export default function SyncScreen() {
  const router = useRouter();
  const { isConnected } = useNetworkStore();
  const { isSyncing, lastSyncAt, pendingCount, acceptedCount, rejectedCount } =
    useSyncStore();
  const { token } = useAuthStore();
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [failedCount, setFailedCount] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const db = getDatabase();
      const s = await getQueueStats(db);
      setStats(s);
      const failed = await getFailedEvents(db);
      setFailedCount(failed.length);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, pendingCount]);

  const handleForceSync = async () => {
    if (!isConnected) {
      Alert.alert("Hors ligne", "La synchronisation nécessite une connexion réseau.");
      return;
    }
    if (!token) {
      Alert.alert("Non authentifié", "Veuillez vous reconnecter.");
      return;
    }
    try {
      const db = getDatabase();
      await runSyncCycle(db, token);
      await loadStats();
      Alert.alert("Succès", "Synchronisation terminée.");
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Échec de la synchronisation");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Statut connexion */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connexion</Text>
          <Badge
            label={isConnected ? "En ligne" : "Hors ligne"}
            variant={isConnected ? "success" : "warning"}
          />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Synchronisation</Text>
          <Badge
            label={isSyncing ? "En cours..." : "Inactive"}
            variant={isSyncing ? "info" : "neutral"}
          />
        </View>
        {lastSyncAt && (
          <Text style={styles.lastSync}>
            Dernière sync : {formatDateTime(lastSyncAt)}
          </Text>
        )}
      </Card>

      {/* Statistiques file */}
      <Text style={styles.sectionTitle}>File d'événements</Text>
      <View style={styles.statsGrid}>
        <StatCard label="En attente" value={stats.pending} color={colors.warning} />
        <StatCard label="Acceptés" value={stats.accepted} color={colors.success} />
        <StatCard label="Rejetés" value={stats.rejected} color={colors.error} />
      </View>

      {failedCount > 0 && (
        <Card style={styles.warningCard}>
          <Text style={styles.warningText}>
            {failedCount} événement(s) en échec après plusieurs tentatives.
          </Text>
          <Button
            title={`Voir les conflits (${failedCount})`}
            variant="outline"
            onPress={() => router.push("/(main)/sync/conflits")}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}

      {/* Lien vers conflits même sans failed */}
      {stats.rejected > 0 && failedCount === 0 && (
        <Button
          title={`Voir les ${stats.rejected} conflit(s)`}
          variant="outline"
          onPress={() => router.push("/(main)/sync/conflits")}
          style={{ marginBottom: spacing.md }}
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Forcer la synchronisation"
          onPress={handleForceSync}
          loading={isSyncing}
          disabled={isSyncing || !isConnected}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card style={statStyles.card}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Card>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: "center", padding: spacing.sm },
  value: { fontSize: fontSize.xxl, fontWeight: "800" },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  statusCard: { padding: spacing.md, marginBottom: spacing.md },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statusLabel: { fontSize: fontSize.md, color: colors.text },
  lastSync: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  warningCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "#FEF3C7",
    borderColor: colors.warning,
    borderWidth: 1,
  },
  warningText: { fontSize: fontSize.sm, color: "#92400E" },
  actions: { marginTop: spacing.md },
});
