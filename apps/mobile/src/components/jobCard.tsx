import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ImageLightbox } from "./ImageLightbox";

interface JobCardProps {
  item: any;
  distance: number | null;
  onApply: (job: any) => void;
}

export const JobCard = ({ item, distance, onApply }: JobCardProps) => {
  const { colors } = useTheme();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const jobImages = item.images ? item.images.split(",") : [];
  const isLongDescription = item.description?.length > 120;

  return (
    <View
      style={[
        styles.jobCard,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.jobHeader}>
        <Text style={[styles.jobTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        {distance !== null && (
          <View
            style={[
              styles.distanceBadge,
              { backgroundColor: colors.commissionBg },
            ]}
          >
            <Ionicons name="location" size={12} color="#007AFF" />
            <Text style={[styles.distanceText, { color: colors.text }]}>
              {distance.toFixed(1)} km
            </Text>
          </View>
        )}
      </View>

      {jobImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {jobImages.map((imgUrl: any, index: any) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImg(imgUrl)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: imgUrl }}
                style={styles.jobImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text
        style={[styles.description, { color: colors.text }]}
        numberOfLines={expanded ? undefined : 3}
      >
        {item.description}
      </Text>

      {isLongDescription && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={[styles.expandButton, { borderColor: colors.border }]}
        >
          <Text style={styles.expandText}>
            {expanded ? "Ver menos ▲" : "Ver más ▼"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.footer, { borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* FOTO DE PERFIL DEL CLIENTE */}
          {item.client?.avatar ? (
            <Image
              source={{ uri: item.client.avatar }}
              style={styles.clientAvatar}
            />
          ) : (
            <Ionicons name="person-circle" size={35} color="#CCC" />
          )}

          <View style={{ marginLeft: 8 }}>
            <Text style={styles.clientLabel}>Publicado por:</Text>
            <Text style={[styles.clientName, { color: colors.text }]}>
              {item.client?.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApply(item)}
        >
          <Text style={styles.applyButtonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
      {/* COMPONENTE LIGHTBOX */}
      <ImageLightbox
        visible={!!selectedImg}
        imageUrl={selectedImg}
        onClose={() => setSelectedImg(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    /*  backgroundColor: "#fff", */
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
    marginBottom: 8,
  },
  jobTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    padding: 6,
    borderRadius: 8,
  },
  distanceText: {
    /* color: "#007AFF", */
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  imageScroll: {
    marginVertical: 10,
  },
  jobImage: {
    width: 140,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#F0F0F0",
  },
  description: { color: "#555", marginBottom: 10, lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    /* borderTopColor: "#EEE", */
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
  clientAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#eee",
  },
  expandButton: {
    marginTop: 4,
    marginBottom: 4,
  },
  expandText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
});
