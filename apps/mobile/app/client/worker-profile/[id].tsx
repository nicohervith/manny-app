import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../src/constants/Config";

export default function WorkerProfileDetail() {
  const { id } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/worker/profile/${id}`);
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
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{worker?.user?.name}</Text>
        <Text style={styles.occupation}>{worker?.occupation}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre mí</Text>
        <Text style={styles.description}>{worker?.description}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.infoValue}>4.9</Text>
          <Text style={styles.infoLabel}>Rating</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={20} color="#28A745" />
          <Text style={styles.infoValue}>${worker?.hourlyRate}</Text>
          <Text style={styles.infoLabel}>Por hora</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", padding: 40, backgroundColor: "#007AFF" },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  occupation: { fontSize: 16, color: "#E0E0E0", marginTop: 5 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: { fontSize: 15, color: "#666", lineHeight: 22 },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  infoItem: { alignItems: "center" },
  infoValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  infoLabel: { fontSize: 12, color: "#999" },
});
