import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, LogBox } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
// ✅ 1. IMPORTAMOS EL TEMA NATIVO
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AlertProvider } from '../src/context/AlertContext';

// Silenciar logs molestos
LogBox.ignoreLogs([
  'expo-av', 
  'expo-notifications', 
  'setLayoutAnimationEnabledExperimental'
]);

// ✅ 2. DEFINIMOS EL TEMA "WHISPER" (NEGRO PURO PARA MATAR EL FLASH BLANCO)
const WhisperTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000', // <--- ESTO ES LA CLAVE
    card: '#000000',
    text: '#ffffff',
    border: '#1e293b',
  },
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments(); 
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      let token;
      try {
        token = Platform.OS === 'web'
          ? localStorage.getItem('user_token')
          : await SecureStore.getItemAsync('user_token');
      } catch (e) { console.log(e); }

      const inAuthGroup = segments[0] === '(auth)'; 
      const inOnboarding = segments[0] === 'onboarding';
      const inPublicZone = inAuthGroup || inOnboarding;

      // 🧠 LÓGICA DEL PORTERO
      if (!token && !inPublicZone) {
        router.replace('/login'); 
      } 
      
      setReady(true);
    };

    checkAuth();
  }, [segments]);

  if (!ready) {
    // 3️⃣ MIENTRAS CARGA, FONDO NEGRO
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <AlertProvider>
      {/* 4️⃣ ENVOLVEMOS LA APP CON EL TEMA OSCURO */}
      <ThemeProvider value={WhisperTheme}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <StatusBar style="light" />
          
          <Stack screenOptions={{ 
            headerShown: false,
            // 5️⃣ REFUERZO FINAL: FONDO NEGRO EN EL STACK
            contentStyle: { backgroundColor: '#000000' }, 
            animation: 'fade', // Transición suave por defecto
          }}>
            
            {/* Pantallas principales */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="onboarding" />
            
            {/* 💎 LA JOYITA: Configuración Modal para Suscripción */}
            <Stack.Screen 
              name="subscription" 
              options={{ 
                presentation: 'modal', // Esto hace que suba desde abajo
                animation: 'slide_from_bottom', // Refuerza la animación en Android
                headerShown: false 
              }} 
            />

            {/* Cualquier otra ruta usa la config por defecto */}
            <Stack.Screen name="index" />
          </Stack>
          
        </View>
      </ThemeProvider>
    </AlertProvider>
  );
}