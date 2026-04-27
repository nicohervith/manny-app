import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Manny Oficios Cerca</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tu próximo trabajo (o trabajador) está a un click.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.loginText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: colors.background }]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerText}>Crear cuenta nueva</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-around",
  },
  header: { alignItems: "center", marginTop: 50 },
  title: { fontSize: 42, fontWeight: "bold" },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: { width: "100%", gap: 15 },
  loginButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  registerButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  registerText: { color: "#007AFF", fontSize: 18, fontWeight: "bold" },
});
