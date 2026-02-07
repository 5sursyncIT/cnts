import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { DonneurListItem } from "../../../src/components/donneurs/DonneurListItem";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import {
  listDonneurs,
  type LocalDonneur,
} from "../../../src/db/repositories/donneurs.repo";

export default function DonneursListScreen() {
  const router = useRouter();
  const [donneurs, setDonneurs] = useState<LocalDonneur[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const db = getDatabase();
      const q = search.trim();
      const list = await listDonneurs(db, q ? { query: q } : undefined);
      setDonneurs(list);
    } catch {}
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, prénom..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/(main)/donneurs/nouveau")}
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={donneurs}
        keyExtractor={(item) => item.local_id}
        renderItem={({ item }) => (
          <DonneurListItem
            donneur={item}
            onPress={() => router.push(`/(main)/donneurs/${item.local_id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? "Aucun résultat" : "Aucun donneur enregistré"}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
});
