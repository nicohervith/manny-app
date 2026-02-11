import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface JobCardProps {
  item: any;
  distance: number | null;
  onApply: (job: any) => void;
}

export const JobCard = ({ item, distance, onApply }: JobCardProps) => {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        {distance !== null && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#007AFF" />
            <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.descripcion}
      </Text>

      <View style={styles.footer}>
        <View>
          <Text style={styles.clientLabel}>Posted by:</Text>
          <Text style={styles.clientName}>{item.client?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApply(item)}
        >
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    padding: 6,
    borderRadius: 8,
  },
  distanceText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  description: { color: "#555", marginVertical: 10, lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  clientLabel: { fontSize: 10, color: "#AAA", textTransform: "uppercase" },
  clientName: { fontSize: 14, fontWeight: "600", color: "#333" },
  applyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: { color: "#fff", fontWeight: "bold" },
});
