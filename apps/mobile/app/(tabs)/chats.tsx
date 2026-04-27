import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

interface Chat {
  id: string | number;
  clientId: string | number;
  worker: { name: string };
  client: { name: string };
  title: string;
  messages: Array<{ id: number; content: string }>;
  _count: { messages: number };
  status: string;
}

export default function ChatListScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  const { colors } = useTheme();

  const fetchChats = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/chat/list/${user.id}`);
      setChats(res.data);
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [user]),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        Mis Conversaciones
      </Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const unreadCount = item._count.messages;
          const otherParty =
            item.clientId === user?.id ? item.worker : item.client;
          const lastMsg = item.messages[0];
          const isCompleted = item.status === "COMPLETED";

          return (
            <TouchableOpacity
              style={[
                styles.chatCard,
                isCompleted && styles.completedCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/chat/[jobId]",
                  params: { jobId: item.id },
                })
              }
            >
              <View
                style={[
                  styles.avatar,
                  isCompleted && styles.completedAvatar,
                  {
                    backgroundColor: isCompleted
                      ? colors.textLight
                      : colors.primary,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.background }]}>
                  {otherParty?.name[0]}
                </Text>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.jobTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isCompleted && (
                    <View
                      style={[
                        styles.completedBadge,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.completedBadgeText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        FINALIZADO
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.otherPartyName, { color: colors.primary }]}
                >
                  {item.clientId === user?.id
                    ? `👷 ${item.worker?.name}`
                    : `👤 ${item.client?.name}`}
                </Text>

                <Text
                  style={[styles.lastMessage, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {isCompleted && "⚠️ Chat temporal: "}
                  {lastMsg ? lastMsg.content : "No hay mensajes aún"}
                </Text>
              </View>

              {unreadCount > 0 && !isCompleted && (
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: colors.error },
                  ]}
                >
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  chatInfo: { flex: 1, marginLeft: 15 },
  jobTitle: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { fontSize: 14 },
  unreadBadge: {
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  completedCard: {
    opacity: 0.7,
  },
  completedAvatar: {
    opacity: 0.6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  otherPartyName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
});
