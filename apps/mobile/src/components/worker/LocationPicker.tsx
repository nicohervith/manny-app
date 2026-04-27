import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { MapRegion } from "../../hooks/useCompleteProfile";

type Props = {
  form: { latitude: number | null; longitude: number | null };
  region: MapRegion;
  address: string;
  manualAddress: string;
  loadingLocation: boolean;
  onChangeManualAddress: (text: string) => void;
  onSearchManualAddress: () => void;
  onGetLocation: () => void;
  onMapPress: (e: any) => void;
};

export function LocationPicker({
  form,
  region,
  address,
  manualAddress,
  loadingLocation,
  onChangeManualAddress,
  onSearchManualAddress,
  onGetLocation,
  onMapPress,
}: Props) {
  return (
    <View style={styles.container}>
      {/* INSTRUCCIÓN CLARA */}
      <Text style={styles.instruction}>
        Indicá tu zona de trabajo (no importa desde dónde estés completando el perfil)
      </Text>

      {/* BÚSQUEDA POR DIRECCIÓN */}
      <Text style={styles.optionLabel}>📍 Escribir dirección</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ej: Av. 7 1234, La Plata, Buenos Aires"
          value={manualAddress}
          onChangeText={onChangeManualAddress}
          returnKeyType="search"
          onSubmitEditing={onSearchManualAddress}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearchManualAddress}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SEPARADOR */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* BOTÓN GPS */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={onGetLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.gpsButtonText}>Usar GPS (solo si estás en tu zona de trabajo)</Text>
          </>
        )}
      </TouchableOpacity>

      {/* MAPA O PLACEHOLDER */}
      {form.latitude ? (
        <View style={styles.mapContainer}>
          <Text style={styles.mapLabel}>
            <Ionicons name="checkmark-circle" size={14} color="#28A745" />{" "}
            {address}
          </Text>
          <MapView style={styles.map} region={region} onPress={onMapPress}>
            <Marker
              draggable
              onDragEnd={onMapPress}
              coordinate={{
                latitude: form.latitude,
                longitude: form.longitude!,
              }}
              title="Tu ubicación de trabajo"
            />
          </MapView>
          <Text style={styles.mapHint}>
            💡 Podés arrastrar el marcador para ajustar la ubicación exacta
          </Text>
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={40} color="#ccc" />
          <Text style={styles.placeholderText}>
            Buscá una dirección o usá tu GPS para ver el mapa
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  instruction: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  searchButton: { backgroundColor: "#1565C0", padding: 12, borderRadius: 8 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 10, color: "#999", fontSize: 13 },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1565C0",
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  gpsButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  mapContainer: { marginBottom: 8 },
  mapLabel: {
    fontSize: 13,
    color: "#28A745",
    fontWeight: "600",
    marginBottom: 6,
  },
  map: { height: 200, borderRadius: 10, marginBottom: 6 },
  mapHint: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  mapPlaceholder: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
    backgroundColor: "#fafafa",
  },
  placeholderText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
