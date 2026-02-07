import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { DatePickerInput } from "../../../src/components/ui/DatePickerInput";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import { getDonneur, type LocalDonneur } from "../../../src/db/repositories/donneurs.repo";
import {
  createRdv,
  listRdv,
  cancelRdv,
  type LocalRdv,
  type RdvCreateInput,
} from "../../../src/db/repositories/rdv.repo";
import { formatDate, formatDateTime } from "../../../src/utils/date";

const RDV_TYPES = ["DON_SANG", "CONSULTATION"] as const;

const STATUT_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  CONFIRME: "info",
  EFFECTUE: "success",
  ANNULE: "error",
  MANQUE: "warning",
};

export default function RdvScreen() {
  const { donneur_local_id } = useLocalSearchParams<{ donneur_local_id?: string }>();
  const router = useRouter();
  const [donneur, setDonneur] = useState<LocalDonneur | null>(null);
  const [rdvList, setRdvList] = useState<LocalRdv[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [datePrevue, setDatePrevue] = useState("");
  const [typeRdv, setTypeRdv] = useState<string>("DON_SANG");
  const [lieu, setLieu] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const db = getDatabase();
      if (donneur_local_id) {
        const d = await getDonneur(db, donneur_local_id);
        setDonneur(d);
        const list = await listRdv(db, { donneurLocalId: donneur_local_id });
        setRdvList(list);
      } else {
        const list = await listRdv(db, { upcoming: true });
        setRdvList(list);
      }
    } catch {}
  }, [donneur_local_id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!donneur_local_id) {
      Alert.alert("Erreur", "Aucun donneur sélectionné");
      return;
    }
    if (!datePrevue.trim()) {
      Alert.alert("Erreur", "La date est obligatoire (format AAAA-MM-JJ)");
      return;
    }
    setLoading(true);
    try {
      const db = getDatabase();
      const input: RdvCreateInput = {
        donneur_local_id: donneur_local_id,
        date_prevue: datePrevue.trim(),
        type_rdv: typeRdv,
        lieu: lieu.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      };
      await createRdv(db, input);
      setShowForm(false);
      setDatePrevue("");
      setLieu("");
      setCommentaire("");
      await load();
      Alert.alert("Succès", "Rendez-vous créé");
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible de créer le RDV");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (rdv: LocalRdv) => {
    Alert.alert("Annuler le RDV", `Annuler le rendez-vous du ${formatDate(rdv.date_prevue)} ?`, [
      { text: "Non", style: "cancel" },
      {
        text: "Annuler le RDV",
        style: "destructive",
        onPress: async () => {
          try {
            const db = getDatabase();
            await cancelRdv(db, rdv.local_id);
            await load();
          } catch {}
        },
      },
    ]);
  };

  const title = donneur
    ? `RDV - ${donneur.prenom} ${donneur.nom}`
    : "Prochains rendez-vous";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {donneur_local_id && (
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.addBtnText}>{showForm ? "×" : "+"}</Text>
          </Pressable>
        )}
      </View>

      {/* Formulaire de création */}
      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Nouveau rendez-vous</Text>
          <DatePickerInput
            label="Date prévue *"
            value={datePrevue}
            onChange={setDatePrevue}
            placeholder="Sélectionner la date du RDV"
            minimumDate={new Date()}
          />
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {RDV_TYPES.map((t) => (
              <Button
                key={t}
                title={t.replace(/_/g, " ")}
                variant={typeRdv === t ? "primary" : "outline"}
                onPress={() => setTypeRdv(t)}
              />
            ))}
          </View>
          <Input
            label="Lieu"
            value={lieu}
            onChangeText={setLieu}
            placeholder="CNTS Dakar"
          />
          <Input
            label="Commentaire"
            value={commentaire}
            onChangeText={setCommentaire}
            placeholder="Notes..."
          />
          <Button
            title="Créer le rendez-vous"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
          />
        </Card>
      )}

      {/* Liste des RDV */}
      <FlatList
        data={rdvList}
        keyExtractor={(item) => item.local_id}
        renderItem={({ item }) => (
          <Card style={styles.rdvCard}>
            <View style={styles.rdvRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rdvDate}>{formatDate(item.date_prevue)}</Text>
                <Text style={styles.rdvType}>{item.type_rdv.replace(/_/g, " ")}</Text>
                {item.lieu && <Text style={styles.rdvMeta}>{item.lieu}</Text>}
                {item.commentaire && (
                  <Text style={styles.rdvComment}>{item.commentaire}</Text>
                )}
              </View>
              <View style={styles.rdvActions}>
                <Badge
                  label={item.statut}
                  variant={STATUT_VARIANT[item.statut] ?? "neutral"}
                />
                {item.statut === "CONFIRME" && (
                  <Button
                    title="Annuler"
                    variant="danger"
                    onPress={() => handleCancel(item)}
                  />
                )}
              </View>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun rendez-vous</Text>
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
  title: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, flex: 1 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  formCard: { margin: spacing.md, padding: spacing.md },
  formTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  rdvCard: { padding: spacing.sm, marginBottom: spacing.xs },
  rdvRow: { flexDirection: "row", alignItems: "flex-start" },
  rdvDate: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  rdvType: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  rdvMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rdvComment: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  rdvActions: { alignItems: "flex-end", gap: 6 },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
});
