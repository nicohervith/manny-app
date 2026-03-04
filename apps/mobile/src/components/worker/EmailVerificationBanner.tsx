import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  email: string;
  isVerified: boolean;
  onPressVerify: () => void;
};

export function EmailVerificationBanner({
  email,
  isVerified,
  onPressVerify,
}: Props) {
  return (
    <View style={[styles.banner, isVerified && styles.bannerVerified]}>
      <Ionicons
        name={isVerified ? "checkmark-circle" : "mail-unread-outline"}
        size={24}
        color={isVerified ? "#2E7D32" : "#D32F2F"}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.title, isVerified && styles.titleVerified]}>
          {isVerified ? "Email verificado" : "Verifica tu correo"}
        </Text>
        <Text style={styles.sub}>
          {isVerified
            ? "Tu cuenta está vinculada a: "
            : "Enviaremos un código a: "}
          <Text style={{ fontWeight: "bold" }}>{email}</Text>
        </Text>
      </View>
      {!isVerified && (
        <TouchableOpacity style={styles.button} onPress={onPressVerify}>
          <Text style={styles.buttonText}>Verificar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerVerified: { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
  title: { fontWeight: "600", color: "#C62828" },
  titleVerified: { color: "#1B5E20" },
  sub: { fontSize: 12, color: "#555", marginTop: 2 },
  button: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
