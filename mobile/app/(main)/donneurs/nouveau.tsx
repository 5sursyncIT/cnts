import React, { useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { DonneurForm } from "../../../src/components/donneurs/DonneurForm";
import { colors } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import {
  createDonneur,
  updateDonneur,
  type DonneurCreateInput,
} from "../../../src/db/repositories/donneurs.repo";
import { enqueueDonneurUpsert } from "../../../src/sync/event-builder";

export default function NouveauDonneurScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const pendingPhotoUri = useRef<string | null>(null);

  const handleSubmit = async (data: DonneurCreateInput) => {
    setLoading(true);
    try {
      const db = getDatabase();
      let donneur = await createDonneur(db, data);
      // Associer la photo si elle a été prise
      if (pendingPhotoUri.current) {
        donneur = await updateDonneur(db, donneur.local_id, {
          photo_uri: pendingPhotoUri.current,
        });
      }
      await enqueueDonneurUpsert(db, { ...donneur, cni_raw: data.cni });
      Alert.alert("Succès", "Donneur enregistré avec succès", [
        { text: "Voir", onPress: () => router.replace(`/(main)/donneurs/${donneur.local_id}`) },
        { text: "Nouveau", style: "cancel" },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer le donneur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <DonneurForm
        onSubmit={handleSubmit}
        loading={loading}
        onPhotoChange={(uri) => { pendingPhotoUri.current = uri; }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
