import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps"; // Importamos el mapa
import { API_URL } from "../../src/constants/Config";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [form, setForm] = useState({
    occupation: "",
    dni: "",
    description: "",
    hourlyRate: "", // Nuevo campo
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [address, setAddress] = useState("Ubicación no establecida");
  const [image, setImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Región para controlar la vista del mapa
  const [region, setRegion] = useState({
    latitude: -34.6037, // Buenos Aires por defecto
    longitude: -58.3816,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const getLocation = async () => {
    setLoadingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos la ubicación para el feed de trabajos.",
      );
      setLoadingLocation(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    setForm({ ...form, latitude, longitude });
    setRegion({ ...region, latitude, longitude }); // Mover el mapa a la posición

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
    const userDataRaw = await SecureStore.getItemAsync("userData");
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

    if (!form.latitude || !form.hourlyRate) {
      Alert.alert(
        "Error",
        "Por favor completa la ubicación y el precio por hora.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("userId", userData.id.toString());
    formData.append("occupation", form.occupation);
    formData.append("dni", form.dni);
    formData.append("description", form.description);
    formData.append("hourlyRate", form.hourlyRate); // Envío de hourlyRate
    formData.append("latitude", form.latitude.toString());
    formData.append("longitude", form.longitude.toString());

    if (image) {
      const filename = image.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;
      formData.append("dniPhoto", { uri: image, name: filename, type } as any);
    }

    try {
      await axios.post(`${API_URL}/api/worker/complete-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert(
        "Éxito",
        isEditing ? "Perfil actualizado." : "Perfil creado.",
      );
      router.replace("/(tabs)/worker-feed");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo subir el perfil.");
    }
  };

  // Dentro de CompleteProfileScreen

  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const userDataRaw = await SecureStore.getItemAsync("userData");
        const user = userDataRaw ? JSON.parse(userDataRaw) : null;

        console.log("ID del usuario logueado:", user.id); // Debería imprimir 3

        const res = await axios.get(
          `${API_URL}/api/worker/profile/${user.id}`,
        );
        console.log("Datos recibidos del servidor:", res.data);

        if (res.data) {
          const p = res.data;
          setIsEditing(true);
          setForm({
            occupation: p.occupation || "",
            dni: p.dni || "",
            description: p.description || "",
            hourlyRate: p.hourlyRate ? p.hourlyRate.toString() : "", // Ojo con el null
            latitude: p.latitude,
            longitude: p.longitude,
          });

          if (p.latitude) {
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
    loadExistingProfile();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 3. Título dinámico */}
      <Text style={styles.title}>
        {isEditing
          ? "Editar Perfil Profesional"
          : "Completar Perfil Profesional"}
      </Text>

      <Text style={styles.label}>Ocupación</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Plomero, Electricista..."
        value={form.occupation} // 4. CAMBIO: Agregamos value
        onChangeText={(t) => setForm({ ...form, occupation: t })}
      />

      <Text style={styles.label}>Precio por Hora (USD)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ej: 15"
        value={form.hourlyRate} // 4. CAMBIO: Agregamos value
        onChangeText={(t) => setForm({ ...form, hourlyRate: t })}
      />

      <Text style={styles.label}>DNI / Identificación</Text>
      <TextInput
        style={[styles.input, isEditing && { backgroundColor: "#f0f0f0" }]} // Gris si edita
        keyboardType="numeric"
        editable={!isEditing} // 5. OPCIONAL: No permitir editar DNI una vez creado
        value={form.dni} // 4. CAMBIO: Agregamos value
        onChangeText={(t) => setForm({ ...form, dni: t })}
      />

      <Text style={styles.label}>Biografía / Experiencia</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        multiline
        value={form.description} // 4. CAMBIO: Agregamos value
        onChangeText={(t) => setForm({ ...form, description: t })}
      />

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
            <Text>El mapa aparecerá al fijar tu ubicación</Text>
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
            <>
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>
                Obtener ubicación actual
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      <Text style={styles.label}>Validación de Identidad</Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => {
          /* pickImage function */
        }}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <Text>📸 Subir foto del DNI</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>
          {isEditing ? "Guardar Cambios" : "Crear Perfil"}
        </Text>
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
});
