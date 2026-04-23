import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: typeof lightColors;
  setTheme: (theme: ThemeMode) => void;
}

// Colores para light mode
const lightColors = {
  background: "#FFFFFF",
  surface: "#F9F9F9",
  primary: "#007AFF",
  primaryDark: "#0051D5",
  text: "#333333",
  textSecondary: "#666666",
  textLight: "#999999",
  border: "#EEEEEE",
  card: "#F9F9F9",
  error: "#FF3B30",
  success: "#28A745",
  warning: "#FFC107",
  info: "#00B1EA",
  progressBg: "#D0E4FF",
  progressFill: "#007AFF",
  commissionBg: "#F0F6FF",
};

// Colores para dark mode
const darkColors = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#0A84FF",
  primaryDark: "#0055D4",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  textLight: "#777777",
  border: "#2C2C2C",
  card: "#1E1E1E",
  error: "#FF453A",
  success: "#32D74B",
  warning: "#FFD60A",
  info: "#64D2FF",
  progressBg: "#1C2A3A",
  progressFill: "#0A84FF",
  commissionBg: "#1A2A3A",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    // Cargar tema guardado
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("app_theme");
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem("app_theme", newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const isDark =
    theme === "dark" || (theme === "system" && systemColorScheme === "dark");
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        setTheme: saveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
