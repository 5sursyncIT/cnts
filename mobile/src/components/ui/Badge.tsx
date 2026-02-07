import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../../constants/theme";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "#D1FAE5", text: colors.success },
  warning: { bg: "#FEF3C7", text: colors.warning },
  error: { bg: "#FEE2E2", text: colors.error },
  info: { bg: "#DBEAFE", text: colors.info },
  neutral: { bg: "#F3F4F6", text: colors.textSecondary },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
});
