import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

export default function CreateJobScreen() {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    presupuesto: "",
  });
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");

      if (!form.titulo || !form.descripcion) {
        Alert.alert("Error", "Por favor completa los campos básicos");
        return;
      }

      await axios.post(`${API_URL}/api/jobs/create`, {
        ...form,
        clienteId: user.id,
      });

      Alert.alert("¡Éxito!", "Tu solicitud ha sido publicada.");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "No se pudo publicar el trabajo");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Qué necesitas arreglar?</Text>

      <TextInput
        style={styles.input}
        placeholder="Ej: Arreglar persiana de madera"
        onChangeText={(text) => setForm({ ...form, titulo: text })}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe el problema con detalle..."
        multiline
        numberOfLines={4}
        onChangeText={(text) => setForm({ ...form, descripcion: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Presupuesto estimado (opcional)"
        keyboardType="numeric"
        onChangeText={(text) => setForm({ ...form, presupuesto: text })}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Publicar Solicitud</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
