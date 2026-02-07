import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DatePickerInput } from "../ui/DatePickerInput";
import { AvatarPicker } from "./AvatarPicker";
import { colors, fontSize, spacing } from "../../constants/theme";
import { BLOOD_GROUPS, REGIONS_SENEGAL } from "../../constants/blood-groups";
import type { DonneurCreateInput } from "../../db/repositories/donneurs.repo";

interface InitialValues {
  cni?: string;
  nom?: string;
  prenom?: string;
  sexe?: "H" | "F";
  date_naissance?: string | null;
  telephone?: string | null;
  groupe_sanguin?: string | null;
  region?: string | null;
  photo_uri?: string | null;
}

interface Props {
  onSubmit: (data: DonneurCreateInput) => Promise<void>;
  loading?: boolean;
  initialValues?: InitialValues;
  /** Mode édition : masque le champ CNI et change le libellé du bouton. */
  editMode?: boolean;
  /** Callback quand la photo est changée (URI persisté dans le filesystem). */
  onPhotoChange?: (uri: string) => void;
}

export function DonneurForm({ onSubmit, loading, initialValues, editMode, onPhotoChange }: Props) {
  const [cni, setCni] = useState(initialValues?.cni ?? "");
  const [nom, setNom] = useState(initialValues?.nom ?? "");
  const [prenom, setPrenom] = useState(initialValues?.prenom ?? "");
  const [sexe, setSexe] = useState<"H" | "F">(initialValues?.sexe ?? "H");
  const [dateNaissance, setDateNaissance] = useState(initialValues?.date_naissance ?? "");
  const [telephone, setTelephone] = useState(initialValues?.telephone ?? "");
  const [groupeSanguin, setGroupeSanguin] = useState(initialValues?.groupe_sanguin ?? "");
  const [region, setRegion] = useState(initialValues?.region ?? "");
  const [photoUri, setPhotoUri] = useState(initialValues?.photo_uri ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editMode && !cni.trim()) errs.cni = "CNI obligatoire";
    if (!nom.trim()) errs.nom = "Nom obligatoire";
    if (!prenom.trim()) errs.prenom = "Prénom obligatoire";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({
      cni: cni.trim(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      sexe,
      date_naissance: dateNaissance.trim() || undefined,
      telephone: telephone.trim() || undefined,
      groupe_sanguin: groupeSanguin || undefined,
      region: region.trim() || undefined,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AvatarPicker
        photoUri={photoUri}
        onPhotoPicked={(uri) => {
          setPhotoUri(uri);
          onPhotoChange?.(uri);
        }}
        initials={`${(prenom || "?")[0]}${(nom || "?")[0]}`.toUpperCase()}
      />

      {!editMode && (
        <Input
          label="Numéro CNI *"
          value={cni}
          onChangeText={setCni}
          error={errors.cni}
          placeholder="1234567890123"
          keyboardType="numeric"
        />
      )}
      <Input
        label="Nom *"
        value={nom}
        onChangeText={setNom}
        error={errors.nom}
        placeholder="Diop"
        autoCapitalize="characters"
      />
      <Input
        label="Prénom *"
        value={prenom}
        onChangeText={setPrenom}
        error={errors.prenom}
        placeholder="Amadou"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Sexe *</Text>
      <View style={styles.segmented}>
        <Button
          title="Homme"
          variant={sexe === "H" ? "primary" : "outline"}
          onPress={() => setSexe("H")}
        />
        <Button
          title="Femme"
          variant={sexe === "F" ? "primary" : "outline"}
          onPress={() => setSexe("F")}
        />
      </View>

      <DatePickerInput
        label="Date de naissance"
        value={dateNaissance}
        onChange={setDateNaissance}
        placeholder="Sélectionner la date de naissance"
        maximumDate={new Date()}
      />
      <Input
        label="Téléphone"
        value={telephone}
        onChangeText={setTelephone}
        placeholder="+221 77 123 45 67"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Groupe sanguin</Text>
      <View style={styles.groupGrid}>
        {BLOOD_GROUPS.map((g) => (
          <Button
            key={g}
            title={g}
            variant={groupeSanguin === g ? "primary" : "outline"}
            onPress={() => setGroupeSanguin(groupeSanguin === g ? "" : g)}
          />
        ))}
      </View>

      <Text style={styles.label}>Région</Text>
      <View style={styles.groupGrid}>
        {REGIONS_SENEGAL.map((r) => (
          <Button
            key={r}
            title={r}
            variant={region === r ? "primary" : "outline"}
            onPress={() => setRegion(region === r ? "" : r)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={editMode ? "Enregistrer les modifications" : "Enregistrer le donneur"}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: { marginTop: spacing.lg },
});
