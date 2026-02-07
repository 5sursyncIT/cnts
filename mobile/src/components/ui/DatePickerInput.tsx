import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { colors, fontSize, spacing } from "../../constants/theme";

interface DatePickerInputProps {
  label: string;
  /** Date au format ISO "YYYY-MM-DD" ou chaîne vide. */
  value: string;
  /** Callback avec la date au format "YYYY-MM-DD". */
  onChange: (isoDate: string) => void;
  error?: string;
  placeholder?: string;
  /** Mode du picker : date ou datetime. */
  mode?: "date" | "datetime";
  /** Date minimale autorisée. */
  minimumDate?: Date;
  /** Date maximale autorisée. */
  maximumDate?: Date;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  placeholder = "Sélectionner une date",
  mode = "date",
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  const currentDate = value ? parseISO(value) : new Date();

  const displayValue = value
    ? format(
        parseISO(value),
        mode === "datetime" ? "dd MMM yyyy HH:mm" : "dd MMM yyyy",
        { locale: fr }
      )
    : "";

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    // Sur Android, le picker se ferme automatiquement
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      const formatted =
        mode === "datetime"
          ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss")
          : format(selectedDate, "yyyy-MM-dd");
      onChange(formatted);
    }
  };

  const handleConfirmIOS = () => {
    setShow(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShow(true)}
      >
        <Text style={displayValue ? styles.inputText : styles.placeholder}>
          {displayValue || placeholder}
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && Platform.OS === "ios" && (
        <View style={styles.iosPickerWrapper}>
          <DateTimePicker
            value={currentDate}
            mode={mode === "datetime" ? "datetime" : "date"}
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="fr-FR"
          />
          <Pressable style={styles.iosDoneBtn} onPress={handleConfirmIOS}>
            <Text style={styles.iosDoneText}>Valider</Text>
          </Pressable>
        </View>
      )}

      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={currentDate}
          mode={mode === "datetime" ? "datetime" : "date"}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    minHeight: 48,
    justifyContent: "center",
  },
  inputError: {
    borderColor: colors.error,
  },
  inputText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  iosPickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  iosDoneBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  iosDoneText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
  },
});
