import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Linking,
} from "react-native";
import axios from "axios";
import { API_URL } from "../../src/constants/Config";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

export default function MyBidsScreen() {
  const [myBids, setMyBids] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyBids = async () => {
    setRefreshing(true);
    const userData = await SecureStore.getItemAsync("userData");
    const user = JSON.parse(userData || "{}");
    try {
      const res = await axios.get(`${API_URL}/api/bids/worker/${user.id}`);
      setMyBids(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Postulaciones</Text>
      <FlatList
        data={myBids}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyBids} />
        }
        renderItem={({ item }) => {
          const isAccepted =
            item.job.status === "IN_PROGRESS" &&
            item.job.workerId === item.workerId;

          return (
            <View style={[styles.card, isAccepted && styles.acceptedCard]}>
              <View style={styles.row}>
                <Text style={styles.jobTitle}>{item.job.title}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>

              <Text style={styles.clientName}>
                Cliente: {item.job.client.name}
              </Text>

              <View style={styles.statusContainer}>
                {isAccepted ? (
                  <View style={styles.acceptedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#28A745"
                    />
                    <Text style={styles.acceptedText}>¡Oferta Aceptada!</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>
                    Estado:{" "}
                    {item.job.status === "PENDING" ? "Pendiente" : "Cerrado"}
                  </Text>
                )}
              </View>

              {isAccepted && (
                <Text style={styles.contactHint}>
                  El cliente ya puede ver tu contacto.
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
    paddingTop: 60,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
  },
  acceptedCard: { borderColor: "#28A745", borderWidth: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  jobTitle: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 16, fontWeight: "bold", color: "#28A745" },
  clientName: { color: "#666", fontSize: 14, marginBottom: 10 },
  statusContainer: { marginTop: 5 },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 5,
    borderRadius: 5,
  },
  acceptedText: { color: "#28A745", fontWeight: "bold", marginLeft: 5 },
  pendingText: { color: "#666", fontStyle: "italic" },
  contactHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#555",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 5,
  },
});
