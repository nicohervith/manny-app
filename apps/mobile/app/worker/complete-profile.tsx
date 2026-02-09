import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { API_URL } from "../../src/constants/Config";
import * as SecureStore from "expo-secure-store";

export default function CompleteProfileScreen() {
  const [form, setForm] = useState({
    oficio: "",
    dni: "",
    descripcion: "",
  });
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    const formData = new FormData();
    const userDataRaw = await SecureStore.getItemAsync("userData");
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

    if (!userData) {
      Alert.alert("Error", "No se encontró sesión de usuario");
      return;
    }

    formData.append("userId", userData.id.toString());
    formData.append("oficio", form.oficio);
    formData.append("dni", form.dni);
    formData.append("descripcion", form.descripcion);

    // Agregar la imagen
    if (image) {
      const filename = image.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("fotoDni", {
        uri: image,
        name: filename,
        type,
      } as any);
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/worker/complete-profile`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      Alert.alert("Éxito", "Tu perfil profesional ha sido creado.");
    } catch (error) {
      Alert.alert("Error", "No se pudo subir el perfil.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Perfil Profesional</Text>

      <Text style={styles.label}>Oficio / Profesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Carpintero, Programador..."
        onChangeText={(t) => setForm({ ...form, oficio: t })}
      />

      <Text style={styles.label}>Número de DNI</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        onChangeText={(t) => setForm({ ...form, dni: t })}
      />

      <Text style={styles.label}>Cuéntanos sobre tu experiencia</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        placeholder="Describe tu trabajo..."
        onChangeText={(t) => setForm({ ...form, descripcion: t })}
      />

      <Text style={styles.label}>Validación de Identidad</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <Text style={styles.imagePickerText}>
            📸 Subir foto de frente del DNI
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Guardar Perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5, marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  imagePicker: {
    height: 150,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    overflow: "hidden",
  },
  imagePickerText: { color: "#007AFF", fontWeight: "bold" },
  preview: { width: "100%", height: "100%" },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 50,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
