import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getApiClient } from "../../../src/api/client";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useNetworkStore } from "../../../src/stores/network.store";
import type { CarteDonneur } from "@cnts/api";
import { formatDate } from "../../../src/utils/date";

export default function CarteDonneurScreen() {
  const { token, user } = useAuthStore();
  const { isConnected } = useNetworkStore();
  const [carte, setCarte] = useState<CarteDonneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCarte = useCallback(async () => {
    if (!token || !user?.donneur_id) {
      setLoading(false);
      setError("Vous devez être connecté comme donneur");
      return;
    }

    try {
      const client = getApiClient(token);
      const data = await client.fidelisation.getCarteByDonneur(user.donneur_id);
      setCarte(data);
      setError(null);
    } catch (err: any) {
      if (err.status === 404) {
        setError("Aucune carte donneur trouvée. Contactez le CNTS pour créer votre carte.");
      } else {
        setError(err.message || "Erreur lors du chargement");
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadCarte();
  }, [loadCarte]);

  const onRefresh = async () => {
    if (!isConnected) return;
    setRefreshing(true);
    await loadCarte();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de votre carte...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!carte) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>📇</Text>
        <Text style={styles.errorText}>Carte non trouvée</Text>
      </View>
    );
  }

  const niveauConfig = {
    BRONZE: { color: "#CD7F32", label: "Bronze", icon: "🥉" },
    ARGENT: { color: "#C0C0C0", label: "Argent", icon: "🥈" },
    OR: { color: "#FFD700", label: "Or", icon: "🥇" },
    PLATINE: { color: "#E5E4E2", label: "Platine", icon: "💎" },
  };

  const niveau = niveauConfig[carte.niveau as keyof typeof niveauConfig] || niveauConfig.BRONZE;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Carte principale */}
      <Card style={[styles.carteCard, { borderTopWidth: 4, borderTopColor: niveau.color }]}>
        <View style={styles.carteHeader}>
          <View>
            <Text style={styles.carteTitle}>Carte Donneur</Text>
            <Text style={styles.carteSubtitle}>Centre National de Transfusion Sanguine</Text>
          </View>
          <Text style={{ fontSize: 32 }}>{niveau.icon}</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {carte.qr_code_data && (
            <QRCode value={carte.qr_code_data} size={180} />
          )}
        </View>

        <View style={styles.carteInfo}>
          <Text style={styles.carteNumero}>{carte.numero_carte}</Text>
          <Badge
            label={niveau.label}
            variant={carte.is_active ? "success" : "muted"}
          />
        </View>
      </Card>

      {/* Statistiques */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: colors.primary }]}>
          <Text style={styles.statValue}>{carte.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </Card>
        <Card style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
          <Text style={styles.statValue}>{carte.total_dons}</Text>
          <Text style={styles.statLabel}>Total dons</Text>
        </Card>
      </View>

      {/* Dates importantes */}
      <Card style={styles.datesCard}>
        <Text style={styles.sectionTitle}>Historique</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Premier don</Text>
          <Text style={styles.dateValue}>
            {carte.date_premier_don ? formatDate(carte.date_premier_don) : "—"}
          </Text>
        </View>
        <View style={[styles.dateRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={styles.dateLabel}>Dernier don</Text>
          <Text style={styles.dateValue}>
            {carte.date_dernier_don ? formatDate(carte.date_dernier_don) : "—"}
          </Text>
        </View>
      </Card>

      {/* Niveaux */}
      <Card style={styles.niveauxCard}>
        <Text style={styles.sectionTitle}>Paliers de fidélité</Text>
        <View style={styles.palierRow}>
          <Text style={styles.palierIcon}>🥉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.palierLabel}>Bronze</Text>
            <Text style={styles.palierSub}>0 - 199 points</Text>
          </View>
          {carte.niveau === "BRONZE" && <Text>✓</Text>}
        </View>
        <View style={styles.palierRow}>
          <Text style={styles.palierIcon}>🥈</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.palierLabel}>Argent</Text>
            <Text style={styles.palierSub}>200 - 499 points</Text>
          </View>
          {carte.niveau === "ARGENT" && <Text>✓</Text>}
        </View>
        <View style={styles.palierRow}>
          <Text style={styles.palierIcon}>🥇</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.palierLabel}>Or</Text>
            <Text style={styles.palierSub}>500 - 999 points</Text>
          </View>
          {carte.niveau === "OR" && <Text>✓</Text>}
        </View>
        <View style={styles.palierRow}>
          <Text style={styles.palierIcon}>💎</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.palierLabel}>Platine</Text>
            <Text style={styles.palierSub}>1000+ points</Text>
          </View>
          {carte.niveau === "PLATINE" && <Text>✓</Text>}
        </View>
      </Card>

      {!carte.is_active && (
        <Card style={[styles.warningCard, { backgroundColor: colors.warning + "20" }]}>
          <Text style={styles.warningText}>⚠️ Cette carte est désactivée</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.md, color: colors.textSecondary },
  errorIcon: { fontSize: 48, marginBottom: spacing.md },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
  },
  carteCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  carteHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  carteTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  carteSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  carteInfo: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carteNumero: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    fontFamily: "monospace",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: { flex: 1, padding: spacing.md },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  datesCard: { padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  dateLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  dateValue: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  niveauxCard: { padding: spacing.md, marginBottom: spacing.md },
  palierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  palierIcon: { fontSize: 24 },
  palierLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  palierSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  warningCard: { padding: spacing.md },
  warningText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.warning,
    textAlign: "center",
  },
});
