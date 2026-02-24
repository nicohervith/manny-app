import axios from "axios";
import { useRouter } from "expo-router";
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
import { API_URL } from "../../src/constants/Config";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async () => {
    if (!email) return Alert.alert("Error", "Ingresa tu email");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      Alert.alert("Enviado", "Revisa tu correo electrónico.");
      setStep(2);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (code.length < 6 || newPassword.length < 6) {
      return Alert.alert("Error", "Completa los campos correctamente");
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        code,
        newPassword,
      });
      Alert.alert("Éxito", "Tu contraseña ha sido cambiada.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", "Código incorrecto o error de servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Cuenta</Text>

      {step === 1 ? (
        <>
          <Text style={styles.subtitle}>
            Ingresa tu email para recibir un código
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar Código</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Ingresa el código enviado a {email}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Código de 6 dígitos"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
          />
          <TextInput
            style={styles.input}
            placeholder="Nueva Contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cambiar Contraseña</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
