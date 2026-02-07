import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../../src/components/ui/Button";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { EligibiliteBadge } from "../../../src/components/donneurs/EligibiliteBadge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { DON_TYPES } from "../../../src/constants/blood-groups";
import { getDatabase } from "../../../src/db/database";
import {
  getDonneur,
  listDonneurs,
  type LocalDonneur,
} from "../../../src/db/repositories/donneurs.repo";
import { createDon, type DonCreateInput } from "../../../src/db/repositories/dons.repo";
import { enqueueDonCreate } from "../../../src/sync/event-builder";
import { todayISO, checkEligibilite } from "../../../src/utils/date";

export default function NouveauDonScreen() {
  const { donneur_local_id } = useLocalSearchParams<{ donneur_local_id?: string }>();
  const router = useRouter();
  const [donneur, setDonneur] = useState<LocalDonneur | null>(null);
  const [donneurs, setDonneurs] = useState<LocalDonneur[]>([]);
  const [searchText, setSearchText] = useState("");
  const [typeDon, setTypeDon] = useState("SANG_TOTAL");
  const [loading, setLoading] = useState(false);

  const loadDonneur = useCallback(async () => {
    if (!donneur_local_id) return;
    try {
      const db = getDatabase();
      const d = await getDonneur(db, donneur_local_id);
      setDonneur(d);
    } catch {}
  }, [donneur_local_id]);

  const searchDonneurs = useCallback(async () => {
    if (donneur) return;
    try {
      const db = getDatabase();
      const q = searchText.trim();
      const list = await listDonneurs(db, q ? { query: q } : undefined);
      setDonneurs(list);
    } catch {}
  }, [donneur, searchText]);

  useEffect(() => {
    loadDonneur();
  }, [loadDonneur]);

  useEffect(() => {
    searchDonneurs();
  }, [searchDonneurs]);

  const handleSubmit = async () => {
    if (!donneur) {
      Alert.alert("Erreur", "Veuillez sélectionner un donneur");
      return;
    }

    const elig = checkEligibilite(donneur.sexe, donneur.dernier_don);
    if (!elig.eligible) {
      Alert.alert(
        "Non éligible",
        `Ce donneur n'est pas encore éligible. Il reste ${elig.joursRestants} jours.`
      );
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase();
      const input: DonCreateInput = {
        donneur_local_id: donneur.local_id,
        date_don: todayISO(),
        type_don: typeDon,
      };
      const don = await createDon(db, input);
      await enqueueDonCreate(db, don, donneur.cni_raw ?? "");
      Alert.alert("Succès", "Don enregistré avec succès", [
        { text: "Voir", onPress: () => router.replace(`/(main)/dons/${don.local_id}`) },
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer le don");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Donneur sélectionné */}
      {donneur ? (
        <Card style={styles.selectedCard}>
          <View style={styles.selectedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>
                {donneur.prenom} {donneur.nom}
              </Text>
              <Text style={styles.selectedMeta}>
                {donneur.sexe === "H" ? "Homme" : "Femme"}
                {donneur.groupe_sanguin ? ` · ${donneur.groupe_sanguin}` : ""}
              </Text>
            </View>
            <EligibiliteBadge sexe={donneur.sexe} dernierDon={donneur.dernier_don} />
          </View>
          {!donneur_local_id && (
            <Button
              title="Changer"
              variant="outline"
              onPress={() => setDonneur(null)}
            />
          )}
        </Card>
      ) : (
        <Card style={styles.searchCard}>
          <Text style={styles.label}>Sélectionner un donneur</Text>
          <View style={styles.searchBox}>
            <Badge label="Rechercher" variant="info" />
          </View>
          {donneurs.map((d) => (
            <Button
              key={d.local_id}
              title={`${d.prenom} ${d.nom}`}
              variant="outline"
              onPress={() => setDonneur(d)}
            />
          ))}
          {donneurs.length === 0 && (
            <Text style={styles.emptyText}>
              Aucun donneur trouvé. Enregistrez d'abord un donneur.
            </Text>
          )}
        </Card>
      )}

      {/* Type de don */}
      <Text style={styles.label}>Type de don</Text>
      <View style={styles.typeGrid}>
        {DON_TYPES.map((t) => (
          <Button
            key={t}
            title={t.replace(/_/g, " ")}
            variant={typeDon === t ? "primary" : "outline"}
            onPress={() => setTypeDon(t)}
          />
        ))}
      </View>

      {/* Submit */}
      <View style={styles.footer}>
        <Button
          title="Enregistrer le don"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !donneur}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  selectedCard: { padding: spacing.md, marginBottom: spacing.md },
  selectedRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  selectedName: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  selectedMeta: { fontSize: fontSize.sm, color: colors.textSecondary },
  searchCard: { padding: spacing.md, marginBottom: spacing.md, gap: spacing.xs },
  searchBox: { marginBottom: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  footer: { marginTop: spacing.xl },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
