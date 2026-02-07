import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DonneurForm } from "../../../src/components/donneurs/DonneurForm";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import {
  getDonneur,
  updateDonneur,
  type DonneurCreateInput,
  type LocalDonneur,
} from "../../../src/db/repositories/donneurs.repo";
import { enqueueDonneurUpsert } from "../../../src/sync/event-builder";

export default function ModifierDonneurScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [donneur, setDonneur] = useState<LocalDonneur | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const db = getDatabase();
      const d = await getDonneur(db, id);
      setDonneur(d);
    } catch {}
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePhotoChange = async (uri: string) => {
    if (!donneur) return;
    try {
      const db = getDatabase();
      await updateDonneur(db, donneur.local_id, { photo_uri: uri });
    } catch {}
  };

  const handleSubmit = async (data: DonneurCreateInput) => {
    if (!donneur) return;
    setLoading(true);
    try {
      const db = getDatabase();
      const updated = await updateDonneur(db, donneur.local_id, {
        nom: data.nom,
        prenom: data.prenom,
        sexe: data.sexe,
        date_naissance: data.date_naissance ?? null,
        telephone: data.telephone ?? null,
        groupe_sanguin: data.groupe_sanguin ?? null,
        region: data.region ?? null,
      });
      // Re-sync le donneur modifié
      await enqueueDonneurUpsert(db, {
        ...updated,
        cni_raw: donneur.cni_raw,
      });
      Alert.alert("Succès", "Donneur modifié avec succès", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible de modifier le donneur");
    } finally {
      setLoading(false);
    }
  };

  if (!donneur) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DonneurForm
        onSubmit={handleSubmit}
        loading={loading}
        editMode
        onPhotoChange={handlePhotoChange}
        initialValues={{
          nom: donneur.nom,
          prenom: donneur.prenom,
          sexe: donneur.sexe,
          date_naissance: donneur.date_naissance,
          telephone: donneur.telephone,
          groupe_sanguin: donneur.groupe_sanguin,
          region: donneur.region,
          photo_uri: donneur.photo_uri,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
