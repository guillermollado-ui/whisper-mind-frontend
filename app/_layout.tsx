import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Ignorar advertencias específicas de Expo Go que no afectan a la app real
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Audio Playback Error' // Por si acaso el de audio persiste como warning
]);
export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments(); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Buscamos la llave
        const token = await SecureStore.getItemAsync('user_token');
        
        // 2. Vemos en qué habitación estás intentando entrar
        const inAuthGroup = segments[0] === '(auth)';
        
        if (token) {
            // SI TIENES LLAVE -> Te mandamos directo al Nexus (Tabs)
            // Solo redirigimos si estabas en el login para no molestar
            if (inAuthGroup) {
                router.replace('/(tabs)');
            }
        } else {
            // NO TIENES LLAVE -> Te mandamos directo al Login (Auth)
            // Solo redirigimos si NO estabas ya en el login
            if (!inAuthGroup) {
                router.replace('/(auth)'); // Aquí es donde te fuerza a loguearte
            }
        }
      } catch (e) {
        console.error("Error checking auth", e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [segments]); 

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot /> 
    </>
  );
}