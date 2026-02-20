import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { API_URL } from "../../src/constants/Config";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    occupation: "",
    dni: "",
    description: "",
    hourlyRate: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [images, setImages] = useState({
    dniFront: null as string | null,
    dniBack: null as string | null,
    selfie: null as string | null,
  });

  const [address, setAddress] = useState("Ubicación no establecida");
  const [region, setRegion] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const userDataRaw = await SecureStore.getItemAsync("userData");
      const user = userDataRaw ? JSON.parse(userDataRaw) : null;
      if (!user) return;

      const res = await axios.get(`${API_URL}/api/worker/profile/${user.id}`);
      if (res.data) {
        const p = res.data;
        setIsEditing(true);
        setForm({
          occupation: p.occupation || "",
          dni: p.dni || "",
          description: p.description || "",
          hourlyRate: p.hourlyRate ? p.hourlyRate.toString() : "",
          latitude: p.latitude,
          longitude: p.longitude,
        });

        // Cargar URLs existentes si el backend las devuelve
        setImages({
          dniFront: p.dniFront || null,
          dniBack: p.dniBack || null,
          selfie: p.selfie || null,
        });

        if (p.latitude && p.longitude) {
          setRegion((prev) => ({
            ...prev,
            latitude: p.latitude,
            longitude: p.longitude,
          }));
          setAddress("Ubicación guardada anteriormente");
        }
      }
    } catch (e) {
      console.log("Perfil nuevo o no encontrado");
      setIsEditing(false);
    }
  };

  const pickImage = async (key: keyof typeof images) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5, // Comprimimos para subir más rápido
    });

    if (!result.canceled) {
      setImages({ ...images, [key]: result.assets[0].uri });
    }
  };

  const getLocation = async () => {
    setLoadingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos tu ubicación.");
      setLoadingLocation(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    setForm({ ...form, latitude, longitude });
    setRegion({ ...region, latitude, longitude });

    let reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    if (reverseGeocode.length > 0) {
      const item = reverseGeocode[0];
      setAddress(
        `${item.street || "Calle"} ${item.name || ""}, ${item.city || ""}`,
      );
    }
    setLoadingLocation(false);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const userDataRaw = await SecureStore.getItemAsync("userData");
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

      if (!form.latitude || !form.hourlyRate || !form.dni) {
        Alert.alert("Error", "Completa los campos obligatorios y ubicación.");
        setLoading(false);
        return;
      }

      // Validar que tengamos las 3 imágenes (especialmente si es perfil nuevo)
      if (
        !isEditing &&
        (!images.dniFront || !images.dniBack || !images.selfie)
      ) {
        Alert.alert("Validación", "Sube las 3 fotos de identidad.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("userId", userData.id.toString());
      formData.append("occupation", form.occupation);
      formData.append("dni", form.dni);
      formData.append("description", form.description);
      formData.append("hourlyRate", form.hourlyRate);
      formData.append("latitude", form.latitude.toString());
      formData.append("longitude", form.longitude.toString());

      // Solo adjuntar si son URIs locales (nuevas fotos)
      const appendIfLocal = (uri: string | null, fieldName: string) => {
        if (uri && !uri.startsWith("http")) {
          // Cambiamos la condición
          const filename = uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename || "");
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          const cleanUri =
            Platform.OS === "android" ? uri : uri.replace("file://", "");

          formData.append(fieldName, {
            uri: uri, // Mantén el uri original primero
            name: filename || `photo_${fieldName}.jpg`,
            type: type,
          } as any);
        }
      };

      appendIfLocal(images.dniFront, "dniFront");
      appendIfLocal(images.dniBack, "dniBack");
      appendIfLocal(images.selfie, "selfie");

      await axios.post(`${API_URL}/api/worker/complete-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Éxito", "Perfil enviado a revisión.");
      router.replace("/(tabs)/worker-feed");
    } catch (error: any) {
      if (error.response) {
        // El servidor respondió con un código de error (400, 500, etc)
        console.error("Data:", error.response.data);
        console.error("Status:", error.response.status);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta (Error de Red real)
        console.error("Request error (No response):", error.request);
      } else {
        console.error("Error mensaje:", error.message);
      }
      Alert.alert("Error", "Error de red o servidor no alcanzado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isEditing
          ? "Editar Perfil Profesional"
          : "Completar Perfil Profesional"}
      </Text>

      {/* Inputs Básicos */}
      <Text style={styles.label}>Ocupación</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Plomero"
        value={form.occupation}
        onChangeText={(t) => setForm({ ...form, occupation: t })}
      />

      <Text style={styles.label}>Precio por Hora (USD)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.hourlyRate}
        onChangeText={(t) => setForm({ ...form, hourlyRate: t })}
      />

      <Text style={styles.label}>DNI / Identificación</Text>
      <TextInput
        style={[styles.input, isEditing && styles.disabledInput]}
        keyboardType="numeric"
        editable={!isEditing}
        value={form.dni}
        onChangeText={(t) => setForm({ ...form, dni: t })}
      />

      <Text style={styles.label}>Biografía</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={form.description}
        onChangeText={(t) => setForm({ ...form, description: t })}
      />

      {/* Ubicación */}
      <Text style={styles.label}>Ubicación de Trabajo</Text>
      <View style={styles.locationContainer}>
        {form.latitude ? (
          <MapView style={styles.map} region={region}>
            <Marker
              coordinate={{
                latitude: form.latitude,
                longitude: form.longitude!,
              }}
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text>Sin ubicación</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.whiteText}>Fijar Ubicación Actual</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      {/* Validación de Identidad - LAS 3 FOTOS */}
      <Text style={styles.label}>Validación de Identidad (Obligatorio)</Text>
      <View style={styles.imageGrid}>
        <View style={styles.imageBox}>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("dniFront")}
          >
            {images.dniFront ? (
              <Image source={{ uri: images.dniFront }} style={styles.preview} />
            ) : (
              <Ionicons name="card-outline" size={30} color="#666" />
            )}
          </TouchableOpacity>
          <Text style={styles.imageLabel}>Frente DNI</Text>
        </View>

        <View style={styles.imageBox}>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("dniBack")}
          >
            {images.dniBack ? (
              <Image source={{ uri: images.dniBack }} style={styles.preview} />
            ) : (
              <Ionicons name="card-outline" size={30} color="#666" />
            )}
          </TouchableOpacity>
          <Text style={styles.imageLabel}>Dorso DNI</Text>
        </View>

        <View style={styles.imageBox}>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("selfie")}
          >
            {images.selfie ? (
              <Image source={{ uri: images.selfie }} style={styles.preview} />
            ) : (
              <Ionicons name="camera-outline" size={30} color="#666" />
            )}
          </TouchableOpacity>
          <Text style={styles.imageLabel}>Selfie de Seguridad</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? "Guardar Cambios" : "Crear Perfil"}
          </Text>
        )}
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
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
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
  },
  locationContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
    padding: 10,
  },
  map: { width: "100%", height: 180, borderRadius: 10 },
  mapPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  locationButton: {
    flexDirection: "row",
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  locationButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  addressText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  imagePicker: {
    backgroundColor: "#F0F2F5",
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  preview: { width: "100%", height: "100%", borderRadius: 15 },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  /* container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#666", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#f9f9f9" }, */
  disabledInput: { backgroundColor: "#eee", color: "#999" },
  textArea: { height: 100, textAlignVertical: "top" },
  /* locationContainer: { marginVertical: 15 },
  map: { width: "100%", height: 150, borderRadius: 10, marginBottom: 10 },
  mapPlaceholder: { width: "100%", height: 150, backgroundColor: "#eee", justifyContent: "center", alignItems: "center", borderRadius: 10 },
  locationButton: { backgroundColor: "#007AFF", padding: 12, borderRadius: 8, alignItems: "center" }, */
  whiteText: { color: "#fff", fontWeight: "bold" },
  /*  addressText: { fontSize: 12, color: "#888", marginTop: 5, textAlign: "center" }, */

  // Estilos nuevos para las 3 fotos
  imageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  imageBox: { alignItems: "center", width: "30%" },
  /* imagePicker: { width: "100%", height: 80, backgroundColor: "#f0f0f0", borderRadius: 8, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "#ddd", borderStyle: "dashed" }, */
  /* preview: { width: "100%", height: "100%" }, */
  imageLabel: {
    fontSize: 10,
    marginTop: 5,
    color: "#666",
    textAlign: "center",
  },

  /*   button: { backgroundColor: "#28a745", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 20, marginBottom: 40 }, */
  buttonDisabled: { opacity: 0.6 },
  /*  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" } */
});
