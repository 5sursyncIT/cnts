import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { SyncStatusBadge } from "../../../src/components/ui/SyncStatusBadge";
import { EligibiliteBadge } from "../../../src/components/donneurs/EligibiliteBadge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import { getDonneur, type LocalDonneur } from "../../../src/db/repositories/donneurs.repo";
import { listDons, type LocalDon } from "../../../src/db/repositories/dons.repo";
import { formatDate, formatDateTime } from "../../../src/utils/date";

export default function DonneurDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [donneur, setDonneur] = useState<LocalDonneur | null>(null);
  const [dons, setDons] = useState<LocalDon[]>([]);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const db = getDatabase();
      const d = await getDonneur(db, id);
      setDonneur(d);
      if (d) {
        const donsList = await listDons(db, { donneurLocalId: d.local_id });
        setDons(donsList);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!donneur) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Donneur introuvable</Text>
      </View>
    );
  }

  const qrData = JSON.stringify({
    type: "cnts_donneur",
    id: donneur.server_id ?? donneur.local_id,
    nom: donneur.nom,
    prenom: donneur.prenom,
    groupe_sanguin: donneur.groupe_sanguin,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Identité */}
      <Card style={styles.section}>
        <View style={styles.headerRow}>
          {donneur.photo_uri ? (
            <Image
              source={{ uri: donneur.photo_uri }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {donneur.prenom[0]}{donneur.nom[0]}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {donneur.prenom} {donneur.nom}
            </Text>
            <Text style={styles.meta}>
              {donneur.sexe === "H" ? "Homme" : "Femme"}
              {donneur.date_naissance ? ` · Né(e) le ${donneur.date_naissance}` : ""}
            </Text>
            {donneur.telephone && (
              <Text style={styles.meta}>Tél: {donneur.telephone}</Text>
            )}
            {donneur.region && (
              <Text style={styles.meta}>Région: {donneur.region}</Text>
            )}
          </View>
          <SyncStatusBadge status={donneur.sync_status} />
        </View>

        {/* Groupe sanguin */}
        {donneur.groupe_sanguin && (
          <View style={styles.bloodGroup}>
            <Text style={styles.bloodGroupLabel}>Groupe sanguin</Text>
            <Badge label={donneur.groupe_sanguin} variant="info" />
          </View>
        )}

        {/* Éligibilité */}
        <View style={styles.eligRow}>
          <Text style={styles.eligLabel}>Éligibilité</Text>
          <EligibiliteBadge sexe={donneur.sexe} dernierDon={donneur.dernier_don} />
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Enregistrer un don"
          onPress={() =>
            router.push({
              pathname: "/(main)/dons/nouveau",
              params: { donneur_local_id: donneur.local_id },
            })
          }
        />
        <Button
          title="Rendez-vous"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/(main)/donneurs/rdv",
              params: { donneur_local_id: donneur.local_id },
            })
          }
        />
        <Button
          title="Modifier"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/(main)/donneurs/modifier",
              params: { id: donneur.local_id },
            })
          }
        />
        <Button
          title={showQR ? "Masquer carte QR" : "Afficher carte QR"}
          variant="outline"
          onPress={() => setShowQR(!showQR)}
        />
      </View>

      {/* QR Code */}
      {showQR && (
        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>Carte Donneur Numérique</Text>
          <View style={styles.qrContainer}>
            <QRCode value={qrData} size={200} backgroundColor="#fff" />
          </View>
          <Text style={styles.qrName}>
            {donneur.prenom} {donneur.nom}
          </Text>
          {donneur.groupe_sanguin && (
            <Text style={styles.qrGroup}>{donneur.groupe_sanguin}</Text>
          )}
          <Text style={styles.qrId}>
            ID: {donneur.server_id ?? donneur.local_id.slice(0, 8)}
          </Text>
        </Card>
      )}

      {/* Historique des dons */}
      <Text style={styles.sectionTitle}>Historique des dons ({dons.length})</Text>
      {dons.length === 0 ? (
        <Text style={styles.emptyText}>Aucun don enregistré</Text>
      ) : (
        dons.map((don) => (
          <Pressable
            key={don.local_id}
            onPress={() => router.push(`/(main)/dons/${don.local_id}`)}
          >
            <Card style={styles.donRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.donType}>
                  {don.type_don.replace("_", " ")}
                </Text>
                <Text style={styles.donDate}>{formatDate(don.date_don)}</Text>
              </View>
              {don.din && <Text style={styles.din}>{don.din}</Text>}
              <SyncStatusBadge status={don.sync_status} />
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { padding: spacing.md, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textMuted,
  },
  name: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  bloodGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bloodGroupLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  eligRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  eligLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
  qrCard: { alignItems: "center", padding: spacing.lg, marginBottom: spacing.lg },
  qrTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  qrName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  qrGroup: { fontSize: fontSize.lg, fontWeight: "800", color: colors.primary, marginTop: 4 },
  qrId: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4, fontFamily: "monospace" },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, textAlign: "center" },
  donRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  donType: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  donDate: { fontSize: fontSize.xs, color: colors.textSecondary },
  din: { fontSize: fontSize.xs, color: colors.primary, fontFamily: "monospace" },
});
