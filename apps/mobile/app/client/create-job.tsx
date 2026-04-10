import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../src/services/api";

export default function CreateJobScreen() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a tus fotos para mostrar el problema.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Permitir varias
      selectionLimit: 5, // Límite de 5 fotos
      quality: 0.6, // Comprimir un poco para subir más rápido
    });

    if (!result.canceled) {
      // Agregamos las nuevas imágenes al array existente
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages([...images, ...selectedUris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Obtener ubicación al montar el componente
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permiso necesario",
            "Para que los trabajadores cercanos puedan ayudarte, necesitamos conocer la ubicación del problema.",
          );
          setGettingLocation(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc.coords);
      } catch (error) {
        console.error("Error obteniendo ubicación:", error);
        Alert.alert(
          "Error de GPS",
          "No pudimos obtener tu ubicación automática.",
        );
      } finally {
        setGettingLocation(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      Alert.alert(
        "Campos obligatorios",
        "Por favor, cuéntanos qué necesitas arreglar.",
      );
      return;
    }

    if (!location) {
      Alert.alert(
        "Ubicación faltante",
        "No podemos publicar sin tu ubicación GPS.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");

      // IMPORTANTE: Usamos FormData para enviar archivos
      const formData = new FormData();
      formData.append("title", form.title); // Asegúrate que coincida con lo que el backend espera
      formData.append("description", form.description);
      formData.append("clientId", user.id.toString());
      formData.append("budget", form.budget || "0");
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());

      // Adjuntamos las imágenes
      images.forEach((uri, index) => {
        const fileName = uri.split("/").pop();
        const fileType = fileName?.split(".").pop();

        // @ts-ignore
        formData.append("images", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: `job_image_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      await api.post(`/api/jobs/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("¡Publicado!", "Tu solicitud ya es visible.");
      router.replace("/(tabs)/my-jobs");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo publicar el trabajo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuevo Trabajo</Text>
        <Text style={styles.subtitle}>
          Describe el inconveniente para recibir presupuestos.
        </Text>

        {/* Estado de Ubicación */}
        <View
          style={[
            styles.locationCard,
            location ? styles.locSuccess : styles.locPending,
          ]}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons
              name={location ? "location" : "location-outline"}
              size={20}
              color={location ? "#2ecc71" : "#e67e22"}
            />
          )}
          <Text style={styles.locationText}>
            {gettingLocation
              ? "Obteniendo ubicación precisa..."
              : location
                ? "Ubicación detectada correctamente"
                : "No se pudo detectar la ubicación"}
          </Text>
        </View>

        {/* SECCIÓN DE IMÁGENES */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fotos del problema (Máx. 5)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            <TouchableOpacity style={styles.pickImageBtn} onPress={pickImages}>
              <Ionicons name="camera" size={30} color="#007AFF" />
              <Text style={styles.pickImageText}>Añadir</Text>
            </TouchableOpacity>

            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            ¿Qué necesitas? (Ej: Plomero urgente)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Título breve del problema"
            placeholderTextColor="#999"
            onChangeText={(text) => setForm({ ...form, title: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción detallada</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej: El grifo de la cocina pierde agua por la base y necesito cambiar el cuerito..."
            multiline
            numberOfLines={5}
            placeholderTextColor="#999"
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Presupuesto sugerido (Opcional)</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#999"
              onChangeText={(text) => setForm({ ...form, budget: text })}
            />
          </View>
        </View>

        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#28A745" />
          <Text style={styles.trustText}>
            Si no recibís postulaciones en las primeras horas, te asignaremos
            uno de nuestros profesionales verificados sin costo adicional.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (gettingLocation || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={gettingLocation || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Publicar Solicitud</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    marginTop: 4,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  locPending: {
    backgroundColor: "#fff7ed",
    borderColor: "#ffedd5",
  },
  locSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#dcfce7",
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currency: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 55,
    fontSize: 18,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  imageScroll: {
    flexDirection: "row",
    marginTop: 8,
  },
  pickImageBtn: {
    width: 100,
    height: 100,
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pickImageText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  trustText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
    lineHeight: 18,
  },
});
