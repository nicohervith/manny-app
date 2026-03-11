import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
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
import api from "../../src/services/api";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const role = user?.role;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Necesitamos permisos para acceder a tu galería.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forzar cuadrado para avatar
      quality: 0.5,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    if (!user?.id) return; // Seguridad
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

      // El contexto se encarga de actualizar SecureStore
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
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ height: 100 }}
          />
        ) : user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle" size={120} color="#007AFF" />
        )}
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={15} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={styles.userName}>{user?.name || "Cargando..."}</Text>
      {/*   <Text style={styles.title}>Mi Cuenta</Text> */}

      {role === "WORKER" && (
        <>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push("/worker/complete-profile")}
          >
            <Ionicons name="briefcase-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Editar Perfil Profesional</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* BOTÓN DE MERCADO PAGO AÑADIDO AQUÍ */}
          <TouchableOpacity
            style={[
              styles.menuButton,
              { borderLeftWidth: 4, borderLeftColor: "#00B1EA" },
            ]}
            onPress={handleLinkMercadoPago}
          >
            <Ionicons name="wallet-outline" size={20} color="#00B1EA" />
            <Text style={[styles.menuText, { color: "#00B1EA" }]}>
              Vincular Mercado Pago
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    backgroundColor: "#fff",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, marginTop: 20 },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 12,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    width: "90%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  menuText: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Círculo perfecto
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#007AFF",
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
    color: "#333",
  },
});
