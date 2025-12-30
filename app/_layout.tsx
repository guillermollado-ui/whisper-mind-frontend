import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        // 🔑 Lógica híbrida para leer el token
        let token = null;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('user_token');
        } else {
          token = await SecureStore.getItemAsync('user_token');
        }

        const inAuthGroup = segments.length === 0 || segments[0] === 'index';

        if (!token && !inAuthGroup) {
          // Si no hay token y no estás en el login, te manda al login
          router.replace('/');
        } else if (token && inAuthGroup) {
          // Si hay token y estás en el login, te manda al Nexus
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.log("Error en el control de acceso:", e);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [isMounted, segments]);

  if (!isMounted || checkingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
