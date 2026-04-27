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
import { EmailVerificationBanner } from "../../src/components/worker/EmailVerificationBanner";
import { IdentityImages } from "../../src/components/worker/IdentityImages";
import { LocationPicker } from "../../src/components/worker/LocationPicker";
import { AVAILABLE_TAGS } from "../../src/constants/Categories";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useCompleteProfile } from "../../src/hooks/useCompleteProfile";

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
    isDraft,
    toggleTag,
    pickImage,
    getLocation,
    handleMapPress,
    searchManualAddress,
    handlePressVerify,
    saveProfile,
    saveDraftManually,
    profileCompletion,
  } = useCompleteProfile();

  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isEditing
          ? "Editar Perfil Profesional"
          : isDraft
          ? "Continuar Perfil Profesional"
          : "Completar Perfil Profesional"}
      </Text>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Perfil completado
          </Text>
          <Text style={[styles.progressPercent, { color: colors.text }]}>
            {profileCompletion}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${profileCompletion}%` as any,
                backgroundColor: profileCompletion === 100 ? "#28A745" : "#007AFF",
              },
            ]}
          />
        </View>
      </View>

      {/* Banner de borrador */}
      {isDraft && (
        <View style={styles.draftBanner}>
          <Ionicons name="time-outline" size={20} color="#E65100" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.draftBannerTitle}>Perfil incompleto</Text>
            <Text style={styles.draftBannerText}>
              Completá todos los campos para que tu perfil sea revisado y puedas recibir trabajo.
            </Text>
          </View>
        </View>
      )}

      <EmailVerificationBanner
        email={user?.email}
        isVerified={user?.emailVerified}
        onPressVerify={handlePressVerify}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Ocupación</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        placeholder="Ej: Plomero"
        placeholderTextColor={colors.textLight}
        value={form.occupation}
        onChangeText={(t) => setForm((prev) => ({ ...prev, occupation: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Precio por Hora (ARS)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        keyboardType="numeric"
        placeholderTextColor={colors.textLight}
        value={form.hourlyRate}
        onChangeText={(t) => setForm((prev) => ({ ...prev, hourlyRate: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Provincia</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        placeholder="Ej: Buenos Aires"
        placeholderTextColor={colors.textLight}
        value={form.province}
        onChangeText={(t) => setForm((prev) => ({ ...prev, province: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Ciudad</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        placeholder="Ej: Capital Federal"
        placeholderTextColor={colors.textLight}
        value={form.city}
        onChangeText={(t) => setForm((prev) => ({ ...prev, city: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>DNI / Identificación</Text>
      <TextInput
        style={[
          styles.input,
          isEditing && styles.disabledInput,
          { backgroundColor: isEditing ? colors.border : colors.surface, color: isEditing ? colors.textLight : colors.text },
        ]}
        keyboardType="numeric"
        editable={!isEditing}
        placeholderTextColor={colors.textLight}
        value={form.dni}
        onChangeText={(t) => setForm((prev) => ({ ...prev, dni: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Biografía</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
        multiline
        placeholderTextColor={colors.textLight}
        value={form.description}
        onChangeText={(t) => setForm((prev) => ({ ...prev, description: t }))}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Mis Especialidades (Tags)</Text>
      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
        Selecciona todas las que apliquen a tu trabajo
      </Text>

      <View style={styles.tagsContainer}>
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = form.tags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tagChip,
                isSelected && styles.tagChipSelected,
                !isSelected && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  isSelected && styles.tagChipTextSelected,
                  !isSelected && { color: colors.text },
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

      <Text style={[styles.label, { color: colors.textSecondary }]}>Ubicación de Trabajo</Text>
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

      <Text style={[styles.label, { color: colors.textSecondary }]}>Validación de Identidad</Text>
      <IdentityImages images={images} onPickImage={pickImage} />

      {!isEditing && (
        <TouchableOpacity
          style={[styles.draftButton, loading && styles.buttonDisabled]}
          onPress={saveDraftManually}
          disabled={loading}
        >
          <Ionicons name="save-outline" size={18} color="#555" style={{ marginRight: 8 }} />
          <Text style={styles.draftButtonText}>Guardar progreso</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? "Guardar Cambios" : "Enviar Perfil"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    flexGrow: 1,
    paddingTop: 60,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  locationContainer: {
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
  disabledInput: { opacity: 0.6 },
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
    textAlign: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  progressContainer: { marginBottom: 16 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13 },
  progressPercent: { fontSize: 13, fontWeight: "bold" },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFB74D",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  draftBannerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 2,
  },
  draftBannerText: {
    fontSize: 12,
    color: "#BF360C",
    lineHeight: 17,
  },
  draftButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  draftButtonText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 16,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagChipText: {
    fontSize: 14,
  },
  tagChipTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
