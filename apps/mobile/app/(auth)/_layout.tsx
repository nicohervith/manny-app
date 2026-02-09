import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* El nombre debe coincidir EXACTAMENTE con el nombre del archivo .tsx */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
