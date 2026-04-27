import { Ionicons } from "@expo/vector-icons";
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
import { useTheme } from "../../../src/context/ThemeContext";

export default function WorkerProfileDetail() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const styles = getStyles(colors, isDark);

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

          {worker?.emailVerified && worker?.isApproved && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#fff"
              style={{ marginLeft: 5, marginTop: 4 }}
            />
          )}
        </View>

        {worker?.emailVerified && worker?.isApproved && (
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>Perfil Verificado</Text>
          </View>
        )}
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre mí</Text>
        <Text style={styles.description}>{worker?.description}</Text>
      </View>

      <View style={[styles.section, styles.reviewsSection]}>
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

function getStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      alignItems: "center",
      paddingVertical: 40,
      backgroundColor: colors.primary,
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

    infoGrid: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 8,
      borderBottomColor: colors.border,
    },
    infoItem: { flex: 1, alignItems: "center" },
    ratingRow: { flexDirection: "row", alignItems: "center" },
    infoValue: { fontSize: 18, fontWeight: "bold", color: colors.text, marginLeft: 5 },
    infoLabel: { fontSize: 13, color: colors.textLight, marginTop: 2 },
    divider: { width: 1, height: 30, backgroundColor: colors.border },

    section: { padding: 20, backgroundColor: colors.background },
    reviewsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      color: colors.text,
    },
    description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

    reviewCard: {
      backgroundColor: colors.surface,
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
    reviewerName: { fontWeight: "600", fontSize: 15, color: colors.text },
    reviewStars: { flexDirection: "row" },
    reviewComment: { fontSize: 14, color: colors.textSecondary, fontStyle: "italic" },
    reviewDate: { fontSize: 11, color: colors.textLight, marginTop: 8, textAlign: "right" },
    noReviews: { color: colors.textLight, textAlign: "center", marginTop: 10 },
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
      backgroundColor: isDark ? "#1A2A3A" : "#E3F2FD",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDark ? "#2A4A7A" : "#BBDEFB",
    },
    verifiedTagText: {
      color: isDark ? "#64D2FF" : "#1976D2",
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },
  });
}
