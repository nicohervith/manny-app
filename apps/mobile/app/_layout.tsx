import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* El grupo (auth) maneja login/register */}
      <Stack.Screen name="(auth)" />
      {/* El grupo (tabs) maneja la app principal */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
