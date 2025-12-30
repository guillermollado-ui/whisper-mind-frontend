import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Aseguramos que el sistema de rutas esté montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Lógica de Protección de Rutas (Guard)
  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        
        // Verificamos si el usuario está en la raíz (index.tsx / Login)
        // segments es un array de las carpetas/archivos donde estamos
        const inAuthGroup = segments.length === 0 || segments[0] === 'index';

        if (!token && !inAuthGroup) {
          // ⛔ No hay token y no está en el login -> Forzar ir al Login
          router.replace('/');
        } else if (token && inAuthGroup) {
          // ✅ Hay token y está en el login -> Mandar al Nexus
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error("Error en el control de acceso:", e);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [isMounted, segments]);

  // Pantalla de carga mientras el "Jefe de Seguridad" decide qué hacer
  if (!isMounted || checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* Esta es la pantalla de Login/Registro (tu nuevo index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* Esta es la carpeta protegida con las pestañas */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
