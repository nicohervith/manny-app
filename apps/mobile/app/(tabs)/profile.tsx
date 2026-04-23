import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const role = user?.role;

  const [isMpLinked, setIsMpLinked] = useState(false);

  const [profileCompletion, setProfileCompletion] = useState(0);

  const { colors } = useTheme();

  useEffect(() => {
    if (role !== "WORKER" || !user?.id) return;
    const fetchCompletion = async () => {
      try {
        const res = await api.get(`/api/worker/profile/${user.id}`);
        const p = res.data;
        const checks = [
          !!p.occupation,
          !!p.dni,
          !!p.description,
          !!p.hourlyRate,
          !!p.latitude,
          p.tags?.length > 0,
          !!p.dniFront,
          !!p.dniBack,
          !!p.selfie,
        ];
        const completed = checks.filter(Boolean).length;
        setProfileCompletion(Math.round((completed / checks.length) * 100));
      } catch (e) {}
    };
    fetchCompletion();
  }, [user]);

  useEffect(() => {
    if (role !== "WORKER" || !user?.id) return;
    const checkMpStatus = async () => {
      try {
        const res = await api.get(`/api/worker/profile/${user.id}`);
        setIsMpLinked(!!res.data.mercadopagoId);
      } catch (e) {
        console.error(e);
      }
    };
    checkMpStatus();
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Necesitamos permisos para acceder a tu galería.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      const fileName = uri.split("/").pop();
      const fileType = fileName?.split(".").pop();

      formData.append("avatar", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: `avatar_${user.id}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await api.patch(
        `/api/users/update-avatar/${user.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      updateUser({ avatar: response.data.user.avatar });
      alert("Foto de perfil actualizada.");
    } catch (error) {
      console.error(error);
      alert("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkMercadoPago = async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/api/payments/auth/url/${user.id}`);

      const result = await WebBrowser.openAuthSessionAsync(
        response.data.url,
        "manny-oficios-cerca://profile",
      );

      if (result.type === "success") {
        alert("Proceso de vinculación finalizado.");
      }
    } catch (error) {
      console.error("Error vinculando MP:", error);
      alert("No se pudo iniciar la vinculación.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ height: 100 }}
          />
        ) : user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={[styles.avatarImage, { borderColor: colors.primary }]}
          />
        ) : (
          <Ionicons name="person-circle" size={120} color={colors.primary} />
        )}
        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="camera" size={15} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={[styles.userName, { color: colors.text }]}>
        {user?.name || "Cargando..."}
      </Text>
      {/*   <Text style={styles.title}>Mi Cuenta</Text> */}

      {role === "WORKER" && (
        <>
          {profileCompletion < 100 && (
            <View
              style={[
                styles.completionContainer,
                {
                  backgroundColor: colors.commissionBg,
                  borderColor: colors.progressBg,
                },
              ]}
            >
              <View style={styles.completionHeader}>
                <Text style={[styles.completionLabel, { color: colors.text }]}>
                  Perfil completado
                </Text>
                <Text
                  style={[styles.completionPercent, { color: colors.primary }]}
                >
                  {profileCompletion}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.progressBg },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${profileCompletion}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              {profileCompletion < 100 && (
                <Text
                  style={[
                    styles.completionHint,
                    { color: colors.textSecondary },
                  ]}
                >
                  Completá tu perfil para recibir más trabajos
                </Text>
              )}
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.menuButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => router.push("/worker/complete-profile")}
          >
            <Ionicons name="briefcase-outline" size={20} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              Editar Perfil Profesional
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.menuButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => router.push("/settings" as any)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              Ajustes
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
          {isMpLinked ? (
            <View
              style={[
                styles.menuButton,
                {
                  borderLeftWidth: 4,
                  borderLeftColor: colors.success,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: colors.success }]}>
                  Mercado Pago vinculado ✓
                </Text>
                <Text
                  style={[styles.mpLinkedSubtext, { color: colors.textLight }]}
                >
                  Tu cuenta está lista para recibir pagos
                </Text>
              </View>
              <TouchableOpacity onPress={handleLinkMercadoPago}>
                <Text style={[styles.mpChangeText, { color: colors.info }]}>
                  Cambiar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.menuButton,
                {
                  borderLeftWidth: 4,
                  borderLeftColor: colors.info,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleLinkMercadoPago}
            >
              <Ionicons name="wallet-outline" size={20} color={colors.info} />
              <Text style={[styles.menuText, { color: colors.info }]}>
                Vincular Mercado Pago
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.commissionInfo,
              { backgroundColor: colors.commissionBg },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.commissionText, { color: colors.text }]}>
              Manny Oficios Cerca retiene una comisión del 10% sobre cada pago
              recibido a través de la plataforma. El monto que acreditamos en tu
              cuenta ya tiene descontada esta comisión.
            </Text>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, marginTop: 20 },
  logoutButton: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    width: "90%",
    marginBottom: 20,
    borderWidth: 1,
  },
  menuText: { flex: 1, marginLeft: 10, fontSize: 16 },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  commissionInfo: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
    alignItems: "flex-start",
    marginHorizontal: "5%",
  },
  commissionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  completionContainer: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    marginHorizontal: "5%",
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  completionLabel: { fontSize: 14, fontWeight: "600" },
  completionPercent: { fontSize: 14, fontWeight: "700" },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 12,
    marginTop: 6,
  },
  settingsButton: {},
  mpLinkedSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  mpChangeText: {
    fontSize: 12,
  },
});
