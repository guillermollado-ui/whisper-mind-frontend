import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

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

    const checkAuth = () => {
      try {
        // 🌐 Usamos localStorage para que funcione en la WEB de Render
        const token = localStorage.getItem('user_token');
        const isAtLogin = segments.length === 0 || segments[0] === 'index';

        if (!token && !isAtLogin) {
          router.replace('/');
        } else if (token && isAtLogin) {
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
      <View style={styles.loadingContainer}>
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

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }
});
