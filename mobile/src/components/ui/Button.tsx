import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";
import { colors, fontSize, spacing } from "../../constants/theme";

type Variant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: "#FFFFFF" },
  secondary: { bg: colors.secondary, text: "#FFFFFF" },
  outline: { bg: "transparent", text: colors.primary, border: colors.primary },
  danger: { bg: colors.error, text: "#FFFFFF" },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.textMuted : v.bg,
          borderColor: v.border ?? v.bg,
          borderWidth: v.border ? 1.5 : 0,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: disabled ? "#FFF" : v.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
