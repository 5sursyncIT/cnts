import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getApiClient } from "../../../src/api/client";
import { Card } from "../../../src/components/ui/Card";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useNetworkStore } from "../../../src/stores/network.store";
import { formatDateTime } from "../../../src/utils/date";

interface PointsHistorique {
  id: string;
  carte_id: string;
  type_operation: string;
  points: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export default function HistoriquePointsScreen() {
  const { token, user } = useAuthStore();
  const { isConnected } = useNetworkStore();
  const [historique, setHistorique] = useState<PointsHistorique[]>([]);
  const [carteId, setCarteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCarte = useCallback(async () => {
    if (!token || !user?.donneur_id) {
      setLoading(false);
      setError("Vous devez être connecté");
      return null;
    }

    try {
      const client = getApiClient(token);
      const carte = await client.fidelisation.getCarteByDonneur(user.donneur_id);
      return carte.id;
    } catch {
      return null;
    }
  }, [token, user]);

  const loadHistorique = useCallback(async (cId: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/fidelisation/points/${cId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setHistorique(data);
        setError(null);
      } else {
        setError("Erreur lors du chargement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      const cId = await loadCarte();
      if (cId) {
        setCarteId(cId);
        loadHistorique(cId);
      } else {
        setLoading(false);
        setError("Carte non trouvée");
      }
    })();
  }, [loadCarte, loadHistorique]);

  const onRefresh = async () => {
    if (!isConnected || !carteId) return;
    setRefreshing(true);
    await loadHistorique(carteId);
    setRefreshing(false);
  };

  const typeLabel = (type: string) => {
    const map: Record<string, { label: string; icon: string; color: string }> = {
      DON: { label: "Don de sang", icon: "🩸", color: colors.primary },
      PARRAINAGE: { label: "Parrainage", icon: "👥", color: colors.success },
      BONUS_ANNIVERSAIRE: { label: "Bonus anniversaire", icon: "🎉", color: colors.info },
      UTILISATION: { label: "Utilisation", icon: "🎁", color: colors.warning },
    };
    return map[type] || { label: type, icon: "📌", color: colors.textSecondary };
  };

  const renderItem = ({ item }: { item: PointsHistorique }) => {
    const config = typeLabel(item.type_operation);
    const isPositive = item.points > 0;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={{ fontSize: 24 }}>{config.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemType}>{config.label}</Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
            </View>
          </View>
          <Text style={[styles.itemPoints, { color: isPositive ? colors.success : colors.warning }]}>
            {isPositive ? "+" : ""}{item.points}
          </Text>
        </View>
        <Text style={styles.itemDate}>{formatDateTime(item.created_at)}</Text>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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

  return (
    <View style={styles.container}>
      {historique.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>📋</Text>
          <Text style={styles.emptyText}>Aucun historique de points</Text>
        </View>
      ) : (
        <FlatList
          data={historique}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  itemCard: { padding: spacing.md, marginBottom: spacing.sm },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  itemType: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  itemDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemPoints: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  itemDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
