import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/services/api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return Alert.alert("Error", "Código incompleto");

    setLoading(true);
    try {
      const res = await api.post("/api/users/verify-otp", { code });

      if (res.data.success) {
        // 1. Obtener datos actuales del storage
        const userDataRaw = await SecureStore.getItemAsync("userData");
        if (userDataRaw) {
          const userData = JSON.parse(userDataRaw);
          // 2. Actualizar solo el campo verificado
          userData.emailVerified = true;
          // 3. Guardar de nuevo
          await SecureStore.setItemAsync("userData", JSON.stringify(userData));
        }

        Alert.alert("¡Éxito!", "Email verificado.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu Email</Text>
      <Text style={styles.subtitle}>
        Hemos enviado un código de verificación a tu correo electrónico.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmar Código</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendContainer}>
        <Text style={styles.resendText}>
          ¿No recibiste el código?{" "}
          <Text style={styles.resendLink}>Reenviar</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 30,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 20,
    fontSize: 32,
    textAlign: "center",
    letterSpacing: 10,
    fontWeight: "bold",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#A0CFFF" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  resendContainer: { marginTop: 25, alignItems: "center" },
  resendText: { color: "#666", fontSize: 14 },
  resendLink: { color: "#007AFF", fontWeight: "bold" },
});
