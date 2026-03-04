import { Ionicons } from "@expo/vector-icons";
import {
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
    <View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Escribe tu dirección (ej: Av. 7 1234, La Plata)"
          value={manualAddress}
          onChangeText={onChangeManualAddress}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearchManualAddress}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {form.latitude ? (
        <MapView style={styles.map} region={region} onPress={onMapPress}>
          <Marker
            draggable
            onDragEnd={onMapPress}
            coordinate={{ latitude: form.latitude, longitude: form.longitude! }}
            title="Tu ubicación de trabajo"
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={{ color: "#999" }}>Sin ubicación seleccionada</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.gpsButton}
        onPress={onGetLocation}
        disabled={loadingLocation}
      >
        <Ionicons name="location" size={18} color="#fff" />
        <Text style={styles.gpsButtonText}> Usar GPS actual</Text>
      </TouchableOpacity>

      <Text style={styles.addressText}>{address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  searchButton: { backgroundColor: "#1565C0", padding: 12, borderRadius: 8 },
  map: { height: 200, borderRadius: 10, marginBottom: 8 },
  mapPlaceholder: {
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1565C0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  gpsButtonText: { color: "#fff", fontWeight: "600" },
  addressText: { fontSize: 12, color: "#666", textAlign: "center" },
});
