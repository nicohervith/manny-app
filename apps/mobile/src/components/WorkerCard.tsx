import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export const WorkerCard = ({ item }: { item: any }) => {
  const { colors } = useTheme();
  const isOnline =
    item.user.lastSeen &&
    new Date().getTime() - new Date(item.user.lastSeen).getTime() <
      5 * 60 * 1000;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/client/worker-profile/[id]",
          params: { id: item.user.id },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />

        {/* PUNTO VERDE ONLINE */}
        {isOnline && <View style={styles.onlineDot} />}
      </View>
      {/* Centro: Info Principal */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>
          {item.user.name}
        </Text>
        {/* LISTADO DE TAGS */}
        <View style={styles.tagsContainer}>
          {item.tags?.map((tag: any) => (
            <View
              key={tag.id}
              style={[styles.tagBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.tagText, { color: colors.background }]}>
                {tag.name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.occupation, { color: colors.primary }]}>
          {item.occupation || "Servicios Generales"}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {item.averageRating > 0
              ? Number(item.averageRating).toFixed(1)
              : "Nuevo"}{" "}
            <Text style={[styles.reviewsText, { color: colors.textLight }]}>
              ({item.totalReviews || 0} reseñas)
            </Text>
          </Text>
        </View>
      </View>

      {/* Lado Derecho: Precio y Acción */}
      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: colors.text }]}>
          ${item.hourlyRate || "---"}
        </Text>
        <Text style={[styles.perHour, { color: colors.textLight }]}>/hr</Text>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF", // será sobrescrito por el theme
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 2,
  },
  imageContainer: {
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
  },
  placeholderAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A", // será sobrescrito por el theme
  },
  occupation: {
    fontSize: 14,
    color: "#007AFF", // será sobrescrito por el theme
    fontWeight: "500",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
    color: "#333", // será sobrescrito por el theme
  },
  reviewsText: {
    color: "#999", // será sobrescrito por el theme
    fontWeight: "400",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A", // será sobrescrito por el theme
  },
  perHour: {
    fontSize: 12,
    color: "#999", // será sobrescrito por el theme
    marginTop: -4,
  },
  viewButton: {
    marginTop: 8,
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50", // Verde
    borderWidth: 2,
    borderColor: "#FFF",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: "#E8F2FF", // será sobrescrito por el theme
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: "#666", // será sobrescrito por el theme
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
});
