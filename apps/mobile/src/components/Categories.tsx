import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORIES } from "../constants/Categories";

export const CategoryGrid = ({
  onSelectCategory,
}: {
  onSelectCategory: (name: string) => void;
}) => {
  return (
    <View style={styles.gridContainer}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.categoryCard}
          onPress={() => onSelectCategory(cat.name)}
        >
          <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
            <Ionicons name={cat.icon as any} size={28} color={cat.iconColor} />
          </View>
          <Text style={styles.categoryText}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start", // Alinea al inicio para mantener consistencia
    paddingVertical: 10,
    width: "100%",
  },
  categoryCard: {
    width: "33.33%", // Divide el ancho en 3 partes iguales exactamente
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30, // Círculo perfecto
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    // Sombra ligera para que resalte del fondo
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    // Asegura que nombres largos no rompan el diseño
    paddingHorizontal: 2,
  },
});
