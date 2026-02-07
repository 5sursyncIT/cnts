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
import { DonListItem } from "../../../src/components/dons/DonListItem";
import { Badge } from "../../../src/components/ui/Badge";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { getDatabase } from "../../../src/db/database";
import { listDons, type LocalDon, type ListDonsOpts } from "../../../src/db/repositories/dons.repo";
import { getDonneur } from "../../../src/db/repositories/donneurs.repo";
import { todayISO } from "../../../src/utils/date";

type FilterMode = "today" | "week" | "all" | "search";

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "7 jours" },
  { key: "all", label: "Tous" },
  { key: "search", label: "Recherche" },
];

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

interface DonWithNom extends LocalDon {
  donneurNom?: string;
}

export default function DonsListScreen() {
  const router = useRouter();
  const [dons, setDons] = useState<DonWithNom[]>([]);
  const [filter, setFilter] = useState<FilterMode>("today");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const db = getDatabase();
      let opts: ListDonsOpts = {};

      switch (filter) {
        case "today":
          opts = { dateDon: todayISO() };
          break;
        case "week":
          opts = { dateFrom: getWeekAgo(), dateTo: todayISO() };
          break;
        case "all":
          opts = { limit: 100 };
          break;
        case "search": {
          const q = search.trim();
          if (q) {
            opts = { query: q };
          } else {
            opts = { limit: 100 };
          }
          break;
        }
      }

      const list = await listDons(db, opts);
      const enriched: DonWithNom[] = await Promise.all(
        list.map(async (don) => {
          const donneur = await getDonneur(db, don.donneur_local_id);
          return {
            ...don,
            donneurNom: donneur ? `${donneur.prenom} ${donneur.nom}` : undefined,
          };
        })
      );
      setDons(enriched);
    } catch {}
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const emptyMessage =
    filter === "today"
      ? "Aucun don enregistré aujourd'hui"
      : filter === "search" && search.trim()
        ? "Aucun résultat"
        : "Aucun don enregistré";

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.filterText, filter === f.key && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/(main)/dons/nouveau")}
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Barre de recherche */}
      {filter === "search" && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom du donneur ou DIN..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoFocus
          />
        </View>
      )}

      {/* Compteur */}
      <View style={styles.countRow}>
        <Badge label={`${dons.length} don(s)`} variant="neutral" />
      </View>

      {/* Liste */}
      <FlatList
        data={dons}
        keyExtractor={(item) => item.local_id}
        renderItem={({ item }) => (
          <DonListItem
            don={item}
            donneurNom={item.donneurNom}
            onPress={() => router.push(`/(main)/dons/${item.local_id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: { color: "#fff" },
  addBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  searchRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "flex-start",
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
});
