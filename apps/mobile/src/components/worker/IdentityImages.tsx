import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ProfileImages } from "../../hooks/useCompleteProfile";

type ImageKey = keyof ProfileImages;

type ImageConfig = {
  key: ImageKey;
  label: string;
  icon: "card-outline" | "camera-outline";
};

const IMAGE_FIELDS: ImageConfig[] = [
  { key: "dniFront", label: "Frente DNI", icon: "card-outline" },
  { key: "dniBack", label: "Dorso DNI", icon: "card-outline" },
  { key: "selfie", label: "Selfie de Seguridad", icon: "camera-outline" },
];

type Props = {
  images: ProfileImages;
  onPickImage: (key: ImageKey) => void;
};

export function IdentityImages({ images, onPickImage }: Props) {
  return (
    <View style={styles.grid}>
      {IMAGE_FIELDS.map(({ key, label, icon }) => (
        <View key={key} style={styles.box}>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => onPickImage(key)}
          >
            {images[key] ? (
              <Image source={{ uri: images[key]! }} style={styles.preview} />
            ) : (
              <Ionicons name={icon} size={30} color="#666" />
            )}
          </TouchableOpacity>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  box: { alignItems: "center", width: "30%" },
  picker: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  label: { fontSize: 11, marginTop: 4, color: "#555", textAlign: "center" },
});
