import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Paths, File, Directory } from "expo-file-system";
import { colors, fontSize, spacing } from "../../constants/theme";

interface AvatarPickerProps {
  /** URI local de la photo actuelle. */
  photoUri: string | null;
  /** Callback avec le nouveau URI persisté dans le documentDirectory. */
  onPhotoPicked: (uri: string) => void;
  /** Initiales à afficher quand pas de photo. */
  initials?: string;
  /** Taille du cercle en px. */
  size?: number;
}

export function AvatarPicker({
  photoUri,
  onPhotoPicked,
  initials = "?",
  size = 100,
}: AvatarPickerProps) {
  const pickImage = async (useCamera: boolean) => {
    // Demander les permissions
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès à la caméra est nécessaire pour prendre une photo.");
        return;
      }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour choisir une photo.");
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (result.canceled || !result.assets[0]) return;

    // Copier l'image dans le répertoire persistant de l'app
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    const filename = `donneur_photo_${Date.now()}.${ext}`;

    // Créer le dossier photos s'il n'existe pas
    const photosDir = new Directory(Paths.document, "photos");
    if (!photosDir.exists) {
      photosDir.create({ intermediates: true });
    }

    // Copier le fichier source vers la destination persistante
    const source = new File(asset.uri);
    const dest = new File(photosDir, filename);
    source.copy(dest);

    onPhotoPicked(dest.uri);
  };

  const handlePress = () => {
    Alert.alert("Photo du donneur", "Comment souhaitez-vous ajouter la photo ?", [
      { text: "Prendre une photo", onPress: () => pickImage(true) },
      { text: "Choisir depuis la galerie", onPress: () => pickImage(false) },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const borderRadius = size / 2;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={[styles.avatar, { width: size, height: size, borderRadius }]}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[styles.image, { width: size, height: size, borderRadius }]}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
            {initials}
          </Text>
        )}
        <View style={[styles.editBadge, { right: 0, bottom: 0 }]}>
          <Text style={styles.editIcon}>+</Text>
        </View>
      </Pressable>
      <Text style={styles.hint}>Appuyez pour ajouter une photo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  initials: {
    fontWeight: "700",
    color: colors.textMuted,
  },
  editBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
