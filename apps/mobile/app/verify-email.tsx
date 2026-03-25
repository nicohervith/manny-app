import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../src/context/AuthContext";
import api from "../src/services/api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerify = async () => {
    if (code.length < 6) return Alert.alert("Error", "Código incompleto");
    setLoading(true);
    try {
      const res = await api.post("/api/users/verify-otp", { code });
      if (res.data.success) {
        await updateUser({ emailVerified: true });
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

  const handleResend = async () => {
    if (timer > 0 || resending) return;

    setResending(true);
    try {
      await api.post("/api/users/send-code");
      setTimer(60);
      Alert.alert("Enviado", "Hemos enviado un nuevo código a tu email.");
    } catch (error) {
      Alert.alert("Error", "No se pudo reenviar el código. Intenta más tarde.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu Email</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de 6 dígitos que enviamos a tu correo.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.button,
          (loading || code.length < 6) && styles.buttonDisabled,
        ]}
        onPress={handleVerify}
        disabled={loading || code.length < 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmar Código</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendContainer}
        onPress={handleResend}
        disabled={timer > 0 || resending}
      >
        {resending ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
            {timer > 0
              ? `Reenviar código en ${timer}s`
              : "¿No recibiste el código? Reenviar"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    textAlign: "center",
    letterSpacing: 10,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#B0D4FF" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  resendContainer: { marginTop: 25, alignItems: "center" },
  resendText: { color: "#007AFF", fontWeight: "500" },
  resendDisabled: { color: "#999" },
});
