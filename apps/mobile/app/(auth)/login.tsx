import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { setToken } = useAuth();
  const { colors } = useTheme();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token) {
        Alert.alert("Error", "Problema de autenticación en el servidor.");
        return;
      }

      await setToken(token, user);

      console.log("Login exitoso");
      if (user.role === "WORKER" && !user.profile) {
        router.replace("/worker/complete-profile");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Error en login:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Error al iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Manny Oficios Cerca
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Inicia sesión para continuar
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
        placeholder="Email"
        placeholderTextColor={colors.textLight}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View
        style={[
          styles.passwordContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="Contraseña"
          placeholderTextColor={colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Cargando..." : "Ingresar"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/forgot-password")}
        style={{ marginTop: 15 }}
      >
        <Text
          style={[
            styles.linkText,
            { color: colors.textSecondary, fontSize: 14 },
          ]}
        >
          ¿Olvidaste tu contraseña?
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 15,
    position: "relative",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
});
