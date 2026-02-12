import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../src/constants/Config";

export default function CreateJobScreen() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
  });

  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

      const payload = {
        titulo: form.title,
        descripcion: form.description,
        presupuesto: form.budget ? parseFloat(form.budget) : null,
        latitude: location.latitude,
        longitude: location.longitude,
        clienteId: user.id,
      };

      await axios.post(`${API_URL}/api/jobs/create`, payload);

      Alert.alert(
        "¡Publicado!",
        "Tu solicitud ya es visible para los trabajadores cercanos.",
      );
      router.replace("/(tabs)/my-jobs");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al conectar con el servidor.");
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
    paddingTop: 60,
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
});
