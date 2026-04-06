import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface IconWithBadgeProps {
  name: keyof typeof Ionicons.glyphMap; 
  color: string;
  size?: number;
  count: number;
}

export const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  name,
  color,
  size = 24,
  count,
}) => {
  return (
    <View style={{ width: size + 6, height: size + 6 }}>
      <Ionicons name={name} size={size} color={color} />
      {count > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "#FF3B30", 
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
