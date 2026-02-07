import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import {
  getAllRejectedEvents,
  retryEvent,
  dismissEvent,
  type EventQueueItem,
} from "../../../src/db/repositories/event-queue.repo";
import { formatDateTime } from "../../../src/utils/date";

const EVENT_TYPE_LABELS: Record<string, string> = {
  "donneur.upsert": "Donneur",
  "don.create": "Don",
  "rdv.create": "Rendez-vous",
};

export default function ConflitsScreen() {
  const [events, setEvents] = useState<EventQueueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const db = getDatabase();
      const list = await getAllRejectedEvents(db);
      setEvents(list);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRetry = async (item: EventQueueItem) => {
    try {
      const db = getDatabase();
      await retryEvent(db, item.client_event_id);
      await load();
    } catch {}
  };

  const handleRetryAll = async () => {
    try {
      const db = getDatabase();
      for (const e of events) {
        await retryEvent(db, e.client_event_id);
      }
      await load();
      Alert.alert("Succès", `${events.length} événement(s) remis en file d'attente`);
    } catch {}
  };

  const handleDismiss = (item: EventQueueItem) => {
    Alert.alert(
      "Supprimer l'événement",
      "Cet événement ne sera plus synchronisé. Les données locales restent intactes. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabase();
              await dismissEvent(db, item.client_event_id);
              await load();
            } catch {}
          },
        },
      ]
    );
  };

  const parsePayload = (payload: string): Record<string, unknown> => {
    try {
      return JSON.parse(payload);
    } catch {
      return {};
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {events.length} conflit(s)
        </Text>
        {events.length > 0 && (
          <Button
            title="Tout retenter"
            variant="outline"
            onPress={handleRetryAll}
          />
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.client_event_id}
        renderItem={({ item }) => {
          const isExpanded = expanded === item.client_event_id;
          const payload = parsePayload(item.payload);
          const isFinal = item.retry_count >= item.max_retries;

          return (
            <Pressable onPress={() => toggleExpand(item.client_event_id)}>
              <Card style={styles.eventCard}>
                {/* Ligne principale */}
                <View style={styles.eventRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.typeRow}>
                      <Badge
                        label={EVENT_TYPE_LABELS[item.event_type] ?? item.event_type}
                        variant="info"
                      />
                      {isFinal && <Badge label="Définitif" variant="error" />}
                    </View>
                    <Text style={styles.errorText}>
                      {item.error_message ?? "Erreur inconnue"}
                    </Text>
                    <Text style={styles.meta}>
                      Tentative {item.retry_count}/{item.max_retries} · {formatDateTime(item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
                </View>

                {/* Détails expandés */}
                {isExpanded && (
                  <View style={styles.details}>
                    {/* Code erreur */}
                    {item.error_code && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Code erreur</Text>
                        <Text style={styles.detailValue}>{item.error_code}</Text>
                      </View>
                    )}

                    {/* Payload */}
                    <Text style={styles.detailLabel}>Données envoyées</Text>
                    <View style={styles.payloadBox}>
                      {Object.entries(payload).map(([key, val]) => (
                        <Text key={key} style={styles.payloadLine}>
                          {key}: {String(val ?? "—")}
                        </Text>
                      ))}
                    </View>

                    {/* ID */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ID événement</Text>
                      <Text style={styles.detailMono}>
                        {item.client_event_id.slice(0, 12)}...
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                      <Button
                        title="Retenter"
                        variant="primary"
                        onPress={() => handleRetry(item)}
                      />
                      <Button
                        title="Supprimer"
                        variant="danger"
                        onPress={() => handleDismiss(item)}
                      />
                    </View>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyText}>Aucun conflit de synchronisation</Text>
            <Text style={styles.emptySubtext}>
              Tous les événements ont été synchronisés avec succès
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  title: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  eventCard: { padding: spacing.sm, marginBottom: spacing.sm },
  eventRow: { flexDirection: "row", alignItems: "flex-start" },
  typeRow: { flexDirection: "row", gap: spacing.xs, marginBottom: 4 },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: "500",
    marginTop: 2,
  },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  chevron: { fontSize: fontSize.sm, color: colors.textMuted, paddingLeft: spacing.sm },
  details: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: { fontSize: fontSize.xs, color: colors.text },
  detailMono: { fontSize: fontSize.xs, color: colors.text, fontFamily: "monospace" },
  payloadBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  payloadLine: { fontSize: fontSize.xs, color: colors.text, fontFamily: "monospace", lineHeight: 18 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  emptyContainer: { alignItems: "center", marginTop: spacing.xxl },
  emptyIcon: { fontSize: 48, color: colors.success, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, textAlign: "center" },
});
