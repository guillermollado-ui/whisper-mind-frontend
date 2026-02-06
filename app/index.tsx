import { Redirect } from 'expo-router';

export default function Index() {
  // Si el usuario llega aquí, es que el RootLayout ya le dejó pasar.
  // Así que le redirigimos automáticamente al Nexus.
  return <Redirect href="/(tabs)" />;
}