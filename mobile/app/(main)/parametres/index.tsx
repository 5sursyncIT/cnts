import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useNetworkStore } from "../../../src/stores/network.store";
import { useSyncStore } from "../../../src/stores/sync.store";
import Constants from "expo-constants";

export default function ParametresScreen() {
  const { user, logout } = useAuthStore();
  const { isConnected } = useNetworkStore();
  const { pendingCount, lastSyncAt } = useSyncStore();

  const handleLogout = () => {
    if (pendingCount > 0) {
      Alert.alert(
        "Données non synchronisées",
        `Vous avez ${pendingCount} événement(s) en attente de synchronisation. Se déconnecter pourrait entraîner une perte de données. Continuer ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se déconnecter", style: "destructive", onPress: logout },
        ]
      );
    } else {
      Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", onPress: logout },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Profil</Text>
        <InfoRow label="Email" value={user?.email ?? "—"} />
        <InfoRow label="Rôle" value={user?.role ?? "agent"} />
      </Card>

      {/* Statut */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Statut</Text>
        <View style={styles.statusRow}>
          <Text style={styles.infoLabel}>Réseau</Text>
          <Badge
            label={isConnected ? "En ligne" : "Hors ligne"}
            variant={isConnected ? "success" : "warning"}
          />
        </View>
        <InfoRow label="Événements en attente" value={String(pendingCount)} />
        {lastSyncAt && (
          <InfoRow label="Dernière synchronisation" value={lastSyncAt} />
        )}
      </Card>

      {/* À propos */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <InfoRow label="Application" value="CNTS Agent" />
        <InfoRow
          label="Version"
          value={Constants.expoConfig?.version ?? "0.1.0"}
        />
        <InfoRow label="SDK Expo" value={Constants.expoConfig?.sdkVersion ?? "54"} />
      </Card>

      {/* Déconnexion */}
      <View style={styles.footer}>
        <Button title="Se déconnecter" variant="danger" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  footer: { marginTop: spacing.lg },
});
