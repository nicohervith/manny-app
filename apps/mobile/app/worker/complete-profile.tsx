import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    occupation: "", 
    dni: "",
    description: "", 
  });
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    const userDataRaw = await SecureStore.getItemAsync("userData");
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

    if (!userData) {
      Alert.alert("Error", "No session found");
      return;
    }

    // Usamos FormData para el envío de archivos (Multer en backend)
    const formData = new FormData();
    formData.append("userId", userData.id.toString());
    formData.append("occupation", form.occupation);
    formData.append("dni", form.dni);
    formData.append("description", form.description);

    if (image) {
      const filename = image.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("dniPhoto", {
        // Antes: fotoDni
        uri: image,
        name: filename,
        type,
      } as any);
    }

    try {
      await axios.post(`${API_URL}/api/worker/complete-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Your professional profile has been created.");
      router.replace("/(tabs)/worker-feed"); // Redirigir al feed de trabajos
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload profile.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Professional Profile</Text>

      <Text style={styles.label}>Occupation</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Plumber, Electrician..."
        placeholderTextColor="#999"
        onChangeText={(t) => setForm({ ...form, occupation: t })}
      />

      <Text style={styles.label}>DNI Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Identity number"
        placeholderTextColor="#999"
        onChangeText={(t) => setForm({ ...form, dni: t })}
      />

      <Text style={styles.label}>Experience / Bio</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        multiline
        placeholder="Tell clients about your work experience..."
        placeholderTextColor="#999"
        onChangeText={(t) => setForm({ ...form, description: t })}
      />

      <Text style={styles.label}>Identity Validation</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <Text style={styles.imagePickerText}>📸 Upload DNI front photo</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingTop: 60,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, color: "#333" },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    color: "#555",
  },
  input: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  imagePicker: {
    backgroundColor: "#F0F2F5",
    height: 150,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
  },
  imagePickerText: { color: "#007AFF", fontWeight: "600" },
  preview: { width: "100%", height: "100%" },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
