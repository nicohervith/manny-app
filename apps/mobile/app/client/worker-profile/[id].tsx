import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import api from "../../../src/services/api";

export default function WorkerProfileDetail() {
  const { id } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/worker/profile/${id}`);
        setWorker(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      {/* Header con degradado visual */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          {worker?.user?.avatar ? (
            <Image
              source={{ uri: worker.user.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={60} color="#fff" />
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{worker?.user?.name}</Text>

          {/* BADGE DE VERIFICACIÓN - Ahora usamos las nuevas propiedades del JSON */}
          {worker?.emailVerified && worker?.isApproved && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#007AFF"
              style={{ marginLeft: 5, marginTop: 4 }}
            />
          )}
        </View>

        {/* Etiqueta debajo */}
        {worker?.emailVerified && worker?.isApproved && (
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>Perfil Verificado</Text>
          </View>
        )}
      </View>

      {/* Info Grid: Rating y Precio */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.infoValue}>
              {worker?.averageRating || "0.0"}
            </Text>
          </View>
          <Text style={styles.infoLabel}>{worker?.totalReviews} Reseñas</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>${worker?.hourlyRate}</Text>
          <Text style={styles.infoLabel}>Por hora</Text>
        </View>
      </View>

      {/* Sección Sobre mí */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre mí</Text>
        <Text style={styles.description}>{worker?.description}</Text>
      </View>

      {/* SECCIÓN DE RESEÑAS */}
      <View
        style={[
          styles.section,
          { borderTopWidth: 1, borderTopColor: "#f0f0f0" },
        ]}
      >
        <Text style={styles.sectionTitle}>Opiniones de clientes</Text>

        {worker?.reviews && worker.reviews.length > 0 ? (
          worker.reviews.map((rev: any) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{rev.reviewer?.name}</Text>
                <View style={styles.reviewStars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < rev.rating ? "star" : "star-outline"}
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
              <Text style={styles.reviewDate}>
                {new Date(rev.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>
            Este profesional aún no tiene reseñas.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#007AFF",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  occupation: { fontSize: 16, color: "#E0E0E0", marginTop: 4 },

  infoGrid: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 8,
    borderBottomColor: "#F5F5F5",
  },
  infoItem: { flex: 1, alignItems: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  infoValue: { fontSize: 18, fontWeight: "bold", color: "#333", marginLeft: 5 },
  infoLabel: { fontSize: 13, color: "#999", marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: "#EEE" },

  section: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  description: { fontSize: 15, color: "#555", lineHeight: 22 },

  // Estilos de Reviews
  reviewCard: {
    backgroundColor: "#FAFAFA",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  reviewerName: { fontWeight: "600", fontSize: 15, color: "#333" },
  reviewStars: { flexDirection: "row" },
  reviewComment: { fontSize: 14, color: "#666", fontStyle: "italic" },
  reviewDate: { fontSize: 11, color: "#BBB", marginTop: 8, textAlign: "right" },
  noReviews: { color: "#999", textAlign: "center", marginTop: 10 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  verifiedTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  verifiedTagText: {
    color: "#1976D2",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
