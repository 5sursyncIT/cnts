import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui/Card";
import { SyncStatusBadge } from "../ui/SyncStatusBadge";
import { EligibiliteBadge } from "./EligibiliteBadge";
import { colors, fontSize, spacing } from "../../constants/theme";
import type { LocalDonneur } from "../../db/repositories/donneurs.repo";

interface Props {
  donneur: LocalDonneur;
  onPress: () => void;
}

export function DonneurListItem({ donneur, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          {donneur.photo_uri ? (
            <Image source={{ uri: donneur.photo_uri }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbInitials}>
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
              {donneur.groupe_sanguin ? ` · ${donneur.groupe_sanguin}` : ""}
            </Text>
          </View>
          <View style={styles.badges}>
            <SyncStatusBadge status={donneur.sync_status} />
            <EligibiliteBadge sexe={donneur.sexe} dernierDon={donneur.dernier_don} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xs, padding: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },
  thumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbInitials: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  badges: { alignItems: "flex-end", gap: 4 },
});
