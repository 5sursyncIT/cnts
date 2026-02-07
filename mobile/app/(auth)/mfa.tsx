import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { colors, fontSize, spacing } from "../../src/constants/theme";
import { useAuthStore } from "../../src/stores/auth.store";

export default function MFAScreen() {
  const [code, setCode] = useState("");
  const { verifyMFA, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleVerify = async () => {
    clearError();
    const success = await verifyMFA(code);
    if (success) {
      router.replace("/(main)/home");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vérification MFA</Text>
        <Text style={styles.subtitle}>
          Entrez le code de votre application d'authentification
        </Text>

        <Input
          label="Code TOTP"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          autoFocus
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title="Vérifier"
          onPress={handleVerify}
          loading={isLoading}
          disabled={code.length < 6}
        />

        <Button
          title="Retour"
          onPress={() => router.back()}
          variant="outline"
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
