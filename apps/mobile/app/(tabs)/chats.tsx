import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  const fetchChats = async () => {
    const userData = await SecureStore.getItemAsync("userData");
    if (!userData) return;
    const user = JSON.parse(userData);
    setUserId(user.id);

    try {
      const res = await axios.get(`${API_URL}/api/chat/list/${user.id}`);
      setChats(res.data);
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  // Reemplaza tu useEffect por este useFocusEffect
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Conversaciones</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const unreadCount = item._count.messages;
          const otherParty =
            item.clientId === userId ? item.worker : item.client;
          const lastMsg = item.messages[0];
          const isCompleted = item.status === "COMPLETED";

          return (
            <TouchableOpacity
              style={[styles.chatCard, isCompleted && styles.completedCard]}
              onPress={() =>
                router.push({
                  pathname: "/chat/[jobId]",
                  params: { jobId: item.id },
                })
              }
            >
              <View
                style={[styles.avatar, isCompleted && styles.completedAvatar]}
              >
                <Text style={styles.avatarText}>{otherParty?.name[0]}</Text>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>FINALIZADO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {isCompleted && "⚠️ Chat temporal: "}
                  {lastMsg ? lastMsg.content : "No hay mensajes aún"}
                </Text>
              </View>

              {unreadCount > 0 && !isCompleted && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  chatInfo: { flex: 1, marginLeft: 15 },
  jobTitle: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { color: "#888", fontSize: 14 },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  completedCard: {
    backgroundColor: "#F9F9F9", // Fondo sutilmente gris
    opacity: 0.8,
  },
  completedAvatar: {
    backgroundColor: "#94A3B8", // Avatar gris
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completedBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748B",
  },
});
