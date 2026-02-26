import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const WorkerCard = ({ item }: { item: any }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      {/* Lado Izquierdo: Avatar */}
      <View style={styles.imageContainer}>
        {item.user.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="person" size={30} color="#BBB" />
          </View>
        )}
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
          </View>
        )}
      </View>

      {/* Centro: Info Principal */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.user.name}</Text>
        <Text style={styles.occupation}>
          {item.occupation || "Servicios Generales"}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.rating || "5.0"}{" "}
            <Text style={styles.reviewsText}>({item.totalReviews || 0})</Text>
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>A 3 km de distancia</Text>
        </View>
      </View>

      {/* Lado Derecho: Precio y Acción */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${item.hourlyRate || "---"}</Text>
        <Text style={styles.perHour}>/hr</Text>
        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Ver</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
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
    color: "#1A1A1A",
  },
  occupation: {
    fontSize: 14,
    color: "#007AFF",
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
  },
  reviewsText: {
    color: "#999",
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
    color: "#1A1A1A",
  },
  perHour: {
    fontSize: 12,
    color: "#999",
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
});
