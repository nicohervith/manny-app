import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// RECUERDA: Cambia esto por TU IP LOCAL (ej: 192.168.1.50)
const API_URL = "http://192.168.100.2:3000";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "CLIENTE", // Valor por defecto
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!form.nombre || !form.email || !form.password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, form);
      Alert.alert("¡Éxito!", "Cuenta creada. Ahora puedes iniciar sesión.");
      router.replace("/login");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Error al registrar";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        onChangeText={(text) => setForm({ ...form, nombre: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(text) => setForm({ ...form, email: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        onChangeText={(text) => setForm({ ...form, password: text })}
      />

      <Text style={styles.label}>¿Qué buscas hacer?</Text>
      <View style={styles.roleContainer}>
        {["CLIENTE", "TRABAJADOR"].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.roleButton,
              form.role === r && styles.roleButtonActive,
            ]}
            onPress={() => setForm({ ...form, role: r })}
          >
            <Text
              style={[
                styles.roleText,
                form.role === r && styles.roleTextActive,
              ]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Registrando..." : "Registrarse"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  label: { fontSize: 16, marginBottom: 10, fontWeight: "600" },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  roleButtonActive: { backgroundColor: "#007AFF" },
  roleText: { color: "#007AFF", fontWeight: "bold" },
  roleTextActive: { color: "#fff" },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
