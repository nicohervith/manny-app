import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, colors, isDark } = useTheme();

  const themeOptions = [
    { id: "light", label: "Claro", icon: "sunny-outline" },
    { id: "dark", label: "Oscuro", icon: "moon-outline" },
    { id: "system", label: "Sistema", icon: "phone-portrait-outline" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Ajustes
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sección de Tema */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons
            name="color-palette-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tema
          </Text>
        </View>

        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.themeOption,
              theme === option.id && { backgroundColor: colors.primary + "15" },
            ]}
            onPress={() => setTheme(option.id as any)}
          >
            <View style={styles.themeOptionLeft}>
              <Ionicons
                name={option.icon as any}
                size={24}
                color={
                  theme === option.id ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.themeOptionLabel,
                  { color: theme === option.id ? colors.primary : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </View>
            {theme === option.id && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección de Preferencias */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferencias
          </Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons
              name="notifications"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Notificaciones push
            </Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: "#767577", true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Notificaciones por email
            </Text>
          </View>
          <Switch
            value={false}
            onValueChange={() => {}}
            trackColor={{ false: "#767577", true: colors.primary }}
          />
        </View>
      </View>

      {/* Sección de Privacidad */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacidad y Seguridad
          </Text>
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.settingInfo}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Cambiar contraseña
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>
              Eliminar cuenta
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Sección de Información */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Información
          </Text>
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.settingInfo}>
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Términos y condiciones
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.settingInfo}>
            <Ionicons
              name="shield-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Política de privacidad
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textLight }]}>
            Versión 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeOptionLabel: {
    fontSize: 15,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  versionInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
  },
});
