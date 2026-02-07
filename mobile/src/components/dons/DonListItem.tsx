import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui/Card";
import { SyncStatusBadge } from "../ui/SyncStatusBadge";
import { colors, fontSize, spacing } from "../../constants/theme";
import { formatDate } from "../../utils/date";
import type { LocalDon } from "../../db/repositories/dons.repo";

interface Props {
  don: LocalDon;
  donneurNom?: string;
  onPress: () => void;
}

export function DonListItem({ don, donneurNom, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.type}>{don.type_don.replace("_", " ")}</Text>
            {donneurNom && <Text style={styles.donneur}>{donneurNom}</Text>}
            <Text style={styles.date}>{formatDate(don.date_don)}</Text>
          </View>
          <View style={styles.right}>
            <SyncStatusBadge status={don.sync_status} />
            {don.din && <Text style={styles.din}>{don.din}</Text>}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xs, padding: spacing.sm },
  row: { flexDirection: "row", alignItems: "center" },
  type: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  donneur: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 4 },
  din: { fontSize: fontSize.xs, color: colors.primary, fontFamily: "monospace" },
});
