import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { colors, fontSize, spacing } from "../../src/constants/theme";
import { useAuthStore } from "../../src/stores/auth.store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, mfaRequired, clearError } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    clearError();
    const success = await login(email, password);
    if (success) {
      router.replace("/(main)/home");
    } else if (mfaRequired) {
      router.push("/(auth)/mfa");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CNTS</Text>
          </View>
          <Text style={styles.title}>Agent Terrain</Text>
          <Text style={styles.subtitle}>
            Centre National de Transfusion Sanguine
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="agent@cnts.sn"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Votre mot de passe"
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoText: {
    color: "#FFF",
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  form: {
    gap: spacing.xs,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
