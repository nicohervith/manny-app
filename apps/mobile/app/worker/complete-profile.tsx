import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IdentityImages } from "../../src/components/worker/IdentityImages";
import { LocationPicker } from "../../src/components/worker/LocationPicker";
import { AVAILABLE_TAGS } from "../../src/constants/Categories";
import { useCompleteProfile } from "../../src/hooks/useCompleteProfile";
import { EmailVerificationBanner } from "../../src/components/worker/EmailVerificationBanner";

export default function CompleteProfileScreen() {
  const {
    form,
    setForm,
    images,
    region,
    address,
    manualAddress,
    setManualAddress,
    loading,
    loadingLocation,
    isEditing,
    isEmailVerified,
    userEmail,
    toggleTag,
    pickImage,
    getLocation,
    handleMapPress,
    searchManualAddress,
    handlePressVerify,
    saveProfile,
  } = useCompleteProfile();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isEditing
          ? "Editar Perfil Profesional"
          : "Completar Perfil Profesional"}
      </Text>

      <EmailVerificationBanner
        email={userEmail}
        isVerified={isEmailVerified}
        onPressVerify={handlePressVerify}
      />

      <Text style={styles.label}>Ocupación</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Plomero"
        value={form.occupation}
        onChangeText={(t) => setForm((prev) => ({ ...prev, occupation: t }))}
      />

      <Text style={styles.label}>Precio por Hora (ARS)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.hourlyRate}
        onChangeText={(t) => setForm((prev) => ({ ...prev, hourlyRate: t }))}
      />

      <Text style={styles.label}>DNI / Identificación</Text>
      <TextInput
        style={[styles.input, isEditing && styles.disabledInput]}
        keyboardType="numeric"
        editable={!isEditing}
        value={form.dni}
        onChangeText={(t) => setForm((prev) => ({ ...prev, dni: t }))}
      />

      <Text style={styles.label}>Biografía</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={form.description}
        onChangeText={(t) => setForm((prev) => ({ ...prev, description: t }))}
      />

      <Text style={styles.label}>Mis Especialidades (Tags)</Text>
      <Text style={styles.subLabel}>
        Selecciona todas las que apliquen a tu trabajo
      </Text>

      <View style={styles.tagsContainer}>
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = form.tags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[styles.tagChip, isSelected && styles.tagChipSelected]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  isSelected && styles.tagChipTextSelected,
                ]}
              >
                {tag}
              </Text>
              {isSelected && (
                <Ionicons
                  name="close-circle"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Ubicación de Trabajo</Text>
      <LocationPicker
        form={form}
        region={region}
        address={address}
        manualAddress={manualAddress}
        loadingLocation={loadingLocation}
        onChangeManualAddress={setManualAddress}
        onSearchManualAddress={searchManualAddress}
        onGetLocation={getLocation}
        onMapPress={handleMapPress}
      />

      <Text style={styles.label}>Validación de Identidad</Text>
      <IdentityImages images={images} onPickImage={pickImage} />

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
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  disabledInput: { backgroundColor: "#eee", color: "#999" },
  textArea: { height: 100, textAlignVertical: "top" },
  whiteText: { color: "#fff", fontWeight: "bold" },
  imageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  imageBox: {
    alignItems: "center",
    width: "32%",
  },
  imagePicker: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCC",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageLabel: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: "500",
    color: "#444",
    textAlign: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    marginBottom: 20,
    marginTop: 5,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#C62828",
  },
  verificationSub: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
    lineHeight: 16,
  },
  verifyButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  locationButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
  },
  subLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    marginTop: -8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  tagChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagChipText: {
    fontSize: 14,
    color: "#444",
  },
  tagChipTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
