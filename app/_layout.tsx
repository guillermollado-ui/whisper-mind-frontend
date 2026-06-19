import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, LogBox, StyleSheet } from 'react-native'; // ✅ Añadido StyleSheet
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AlertProvider } from '../src/context/AlertContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { GodModeProvider } from '../src/context/GodModeContext'; 
import Purchases from 'react-native-purchases'; // ✅ INYECTADO: Motor de RevenueCat
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // ✅ INYECTADO: Motor de Google

// Silenciar logs
LogBox.ignoreLogs([
  'expo-av', 
  'expo-notifications', 
  'setLayoutAnimationEnabledExperimental'
]);

const WhisperTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#ffffff',
    border: '#1e293b',
  },
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments(); 
  const [ready, setReady] = useState(false);

  // ✅ 1. INICIALIZACIÓN DE MOTORES (Hardware & API)
  useEffect(() => {
    const initServices = async () => {
      // Configuración de RevenueCat
      if (Platform.OS !== 'web') {
        // REEMPLAZA: goog_TU_CLAVE_AQUI con tu clave pública de RevenueCat
        Purchases.configure({ apiKey: "goog_TU_CLAVE_AQUI" });
        
        // Configuración de Google Sign-In
        GoogleSignin.configure({
          // webClientId: 'TU_WEB_CLIENT_ID_DE_GOOGLE_CLOUD.apps.googleusercontent.com', 
          offlineAccess: true,
        });
      }
    };
    initServices();
  }, []);

  // ✅ 2. LÓGICA DE NAVEGACIÓN Y AUTENTICACIÓN
  useEffect(() => {
    const checkAuth = async () => {
      let token;
      let userId;
      try {
        token = Platform.OS === 'web'
          ? localStorage.getItem('user_token')
          : await SecureStore.getItemAsync('user_token');
          
        // Intentamos recuperar el ID de usuario para RevenueCat
        userId = Platform.OS === 'web'
          ? localStorage.getItem('user_id')
          : await SecureStore.getItemAsync('user_id');
      } catch (e) { console.log(e); }

      // ✅ 3. SINCRONIZACIÓN DE IDENTIDAD (RevenueCat)
      // Si hay un usuario logueado, se lo presentamos a RevenueCat
      if (token && userId && Platform.OS !== 'web') {
        await Purchases.logIn(userId);
      }

      const inAuthGroup = segments[0] === '(auth)'; 
      const inOnboarding = segments[0] === 'onboarding';
      const isIndex = segments.length === 0 || segments[0] === 'index';
      const inPublicZone = inAuthGroup || inOnboarding;

      if (ready) {
        if (!token && !inPublicZone) {
          router.replace('/(auth)/login'); 
        } else if (token && (inAuthGroup || isIndex)) {
          router.replace('/(tabs)');
        }
      }
      
      setReady(true);
    };

    checkAuth();
  }, [segments, ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <GodModeProvider>
      <LanguageProvider>
        <AlertProvider>
          <ThemeProvider value={WhisperTheme}>
            {/* ✅ EL CONTENEDOR MAESTRO (CHASIS WEB) */}
            <View style={styles.masterBackground}>
              <View style={styles.appContainer}>
                <StatusBar style="light" />
                
                <Stack screenOptions={{ 
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000000' }, 
                  animation: 'fade',
                }}>
                  
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="onboarding" />
                  
                  <Stack.Screen 
                    name="subscription" 
                    options={{ 
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      headerShown: false 
                    }} 
                  />
                </Stack>
              </View>
            </View>
          </ThemeProvider>
        </AlertProvider>
      </LanguageProvider>
    </GodModeProvider>
  );
}

// ✅ ESTILOS DEL CONTENEDOR MAESTRO
const styles = StyleSheet.create({
  masterBackground: {
    flex: 1,
    // En PC mostramos un gris súper oscuro de fondo para que contraste, en móvil es negro total
    backgroundColor: Platform.OS === 'web' ? '#050505' : '#000000', 
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    // El toque mágico: En móvil ocupa el 100%, en web máximo 480px
    maxWidth: Platform.OS === 'web' ? 480 : '100%', 
    backgroundColor: '#000000',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#1e293b', // Borde elegante tipo cristal
      boxShadow: '0px 0px 30px rgba(0,0,0,0.5)', // Sombra para que flote
    })
  }
});