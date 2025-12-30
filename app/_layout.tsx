import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        // Buscamos la llave en el bolsillo del usuario
        const token = await SecureStore.getItemAsync('user_token');
        const inAuthGroup = segments[0] === '(auth)'; // ¿Está intentando loguearse?

        if (!token && !inAuthGroup) {
          // ⛔ NO TIENE LLAVE -> AL CALABOZO (LOGIN)
          router.replace('/login');
        } else if (token && inAuthGroup) {
          // ✅ TIENE LLAVE -> A CASA
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.log("Error checking auth", e);
      }
    };

    checkAuth();
  }, [isMounted, segments]);

  if (!isMounted) return <View style={{flex:1, backgroundColor:'#000'}} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}