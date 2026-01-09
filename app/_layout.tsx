import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Ignorar advertencias específicas
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Audio Playback Error',
  'Method writeAsStringAsync'
]);

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Buscamos la llave (Token)
        let token;
        if (Platform.OS === 'web') {
            token = localStorage.getItem('user_token');
        } else {
            token = await SecureStore.getItemAsync('user_token');
        }
        
        // 2. Vemos si estás intentando entrar en la zona de autenticación
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
                router.replace('/(auth)'); 
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