import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { SyncStatusBadge } from "../../../src/components/ui/SyncStatusBadge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import { getDon, type LocalDon } from "../../../src/db/repositories/dons.repo";
import { getDonneur, type LocalDonneur } from "../../../src/db/repositories/donneurs.repo";
import { formatDate, formatDateTime } from "../../../src/utils/date";

export default function DonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [don, setDon] = useState<LocalDon | null>(null);
  const [donneur, setDonneur] = useState<LocalDonneur | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const db = getDatabase();
      const d = await getDon(db, id);
      setDon(d);
      if (d) {
        const donr = await getDonneur(db, d.donneur_local_id);
        setDonneur(donr);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!don) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Don introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info don */}
      <Card style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Informations du don</Text>
          <SyncStatusBadge status={don.sync_status} />
        </View>

        <InfoRow label="Type" value={don.type_don.replace("_", " ")} />
        <InfoRow label="Date" value={formatDate(don.date_don)} />
        {don.din && <InfoRow label="DIN (ISBT)" value={don.din} mono />}
        <InfoRow label="ID local" value={don.local_id.slice(0, 8)} mono />
        {don.server_id && <InfoRow label="ID serveur" value={don.server_id} mono />}
        <InfoRow label="Créé le" value={formatDateTime(don.created_at)} />
      </Card>

      {/* Info donneur */}
      {donneur && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Donneur</Text>
          <InfoRow label="Nom" value={`${donneur.prenom} ${donneur.nom}`} />
          <InfoRow label="Sexe" value={donneur.sexe === "H" ? "Homme" : "Femme"} />
          {donneur.groupe_sanguin && (
            <InfoRow label="Groupe" value={donneur.groupe_sanguin} />
          )}
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title="Voir la fiche donneur"
              variant="outline"
              onPress={() => router.push(`/(main)/donneurs/${donneur.local_id}`)}
            />
          </View>
        </Card>
      )}

      {/* Statut sync */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        <InfoRow label="Statut" value={don.sync_status} />
        {don.idempotency_key && (
          <InfoRow label="Clé idempotence" value={don.idempotency_key.slice(0, 12) + "..."} mono />
        )}
      </Card>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, mono && infoStyles.mono]}>{value}</Text>
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
  mono: { fontFamily: "monospace", fontSize: fontSize.xs },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { padding: spacing.md, marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
