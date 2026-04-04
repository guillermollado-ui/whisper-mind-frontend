import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkNavigation = async () => {
      try {
        let token;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('user_token');
        } else {
          token = await SecureStore.getItemAsync('user_token');
        }

        // 🚦 DIRECCIONAMIENTO SEGÚN TU ESTRUCTURA
        if (token) {
          // Tienes token -> Al Nexus
          router.replace('/(tabs)');
        } else {
          // NO tienes token -> Al Login
          // Expo Router buscará "login" dentro de tu carpeta "(auth)"
          router.replace('/(auth)/login'); 
        }
      } catch (e) {
        console.error("Error checking token:", e);
        router.replace('/(auth)/login');
      }
    };

    checkNavigation();
  }, [isMounted]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}