import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// ✅ IMPORTAMOS EL MOTOR WEB DE GOOGLE
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { API_URL } from '../../utils/api';
// ✅ IMPORTAMOS EL SISTEMA DE ALERTAS
import { useAlert } from '../../src/context/AlertContext';

// 📂 Cargar la imagen del logo
const LOGO_IMAGE = require('@/assets/icon.png'); 

// 🌐 Le decimos al navegador que puede abrir ventanas emergentes para autenticarse
WebBrowser.maybeCompleteAuthSession();

// 🔑 CLIENT ID ACTUALIZADO (GENERADO MANUALMENTE EN GOOGLE CLOUD)
const WEB_CLIENT_ID = '966157018634-o6t4dk13db3b0ordjfk7fgdmsb013gr0.apps.googleusercontent.com'; // El ID de Tipo 3 (Aplicación Web)

export default function LoginScreen() {
  const router = useRouter();
  // ✅ USAMOS EL HOOK DE ALERTAS
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🌐 PREPARAMOS EL MOTOR DE GOOGLE PARA LA WEB
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
  });

  // 📱 CONFIGURACIÓN DE GOOGLE (SOLO EN MÓVIL PARA EVITAR CRASH)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID, 
        offlineAccess: true,
      });
    }
  }, []);

  // 🌐 ESCUCHADOR DEL RESULTADO DE GOOGLE WEB
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        sendGoogleTokenToBackend(id_token);
      }
    } else if (response?.type === 'error') {
       setGoogleLoading(false);
       showAlert('GOOGLE ERROR', 'Authentication cancelled or failed.', 'error');
    }
  }, [response]);

  // 🌍 MANEJO DE RESPUESTA DEL BACKEND (COMÚN PARA EMAIL Y GOOGLE)
  const handleAuthResponse = async (data: any) => {
    if (data.access_token) {
      if (Platform.OS === 'web') {
        localStorage.setItem('user_token', data.access_token);
        if (data.user && data.user.id) localStorage.setItem('user_id', data.user.id.toString());
      } else {
        await SecureStore.setItemAsync('user_token', data.access_token);
        if (data.user && data.user.id) await SecureStore.setItemAsync('user_id', data.user.id.toString());
      }

      if (data.onboarding_completed === false) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      throw new Error('No access token received');
    }
  };

  // 🧠 FUNCIÓN CENTRALIZADA PARA ENVIAR EL TOKEN AL BACKEND
  const sendGoogleTokenToBackend = async (idToken: string) => {
    try {
      const backendResponse = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(data.detail || 'Google Auth Failed');
      }

      await handleAuthResponse(data);
    } catch (error: any) {
      console.error("Backend Error:", error);
      showAlert('AUTH ERROR', error.message || 'Could not verify with Nexus.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 🤖 LOGIN CON GOOGLE (BOTÓN UNIFICADO)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    // 🌐 RUTA WEB
    if (Platform.OS === 'web') {
      promptAsync(); // Esto abre el popup de Google en Chrome/Safari
      return;
    }

    // 📱 RUTA MÓVIL
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken || userInfo.idToken; // Compatibilidad entre versiones
      if (!idToken) throw new Error('No ID Token from Google');

      await sendGoogleTokenToBackend(idToken);

    } catch (error: any) {
      setGoogleLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Usuario canceló, no hacemos nada
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showAlert('WAIT', 'Sign in is already in progress.', 'info');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('ERROR', 'Google Play Services not available.', 'error');
      } else {
        console.error(error);
        showAlert('GOOGLE ERROR', 'Could not sign in with Google.', 'error');
      }
    }
  };

  // 📧 LOGIN CON EMAIL (LEGACY)
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('MISSING DATA', 'Please fill in all fields.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email.toLowerCase().trim());
      formData.append('password', password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString(),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        showAlert('SYSTEM OVERLOAD', `Too many attempts. Wait ${seconds}s.`, 'error');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          showAlert(
            'VERIFICATION PENDING',
            'Check your email inbox/spam for the activation link.',
            'warning'
          );
          return;
        }

        let errorMsg = 'Invalid credentials';
        if (data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : 'Server error.';
        }
        showAlert('ACCESS DENIED', errorMsg, 'error');
        return;
      }

      await handleAuthResponse(data);

    } catch (error: any) {
      showAlert('CONNECTION LOST', 'Could not reach Nexus. Check internet.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.innerContainer}>
        
        {/* HEADER CON LOGO E IMAGEN */}
        <View style={styles.header}>
          <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />
          
          <Text style={styles.logoText}>WHISPER<Text style={{ color: '#10B981' }}>MIND</Text></Text>
          <Text style={styles.tagline}>Ruthless Mental Organization.</Text>
        </View>

        <View style={styles.form}>
          
          {/* BOTÓN GOOGLE */}
          <TouchableOpacity 
            onPress={handleGoogleLogin} 
            disabled={googleLoading || loading || !request && Platform.OS === 'web'} 
            style={styles.googleButton}
          >
            {googleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>G</Text> 
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR EMAIL</Text>
            <View style={styles.line} />
          </View>

          <Text style={styles.label}>Username or Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="founder OR founder@whisper.com"
            placeholderTextColor="#444"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#444"
            secureTextEntry
            autoComplete="current-password"
            style={styles.input}
          />

          <TouchableOpacity onPress={() => showAlert('RESET PROTOCOL', 'Contact admin to reset credentials.', 'info')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: '#666', fontSize: 13 }}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.button, loading && { opacity: 0.7 }]}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>GET ACCESS</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: '#666' }}>Don't have an account?</Text>
          <Link href="/register" asChild>
            <TouchableOpacity><Text style={styles.linkText}>Create Account</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  innerContainer: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 80, height: 80, marginBottom: 20, opacity: 0.9 }, 
  logoText: { color: '#ffffff', fontSize: 36, fontWeight: '900', letterSpacing: -2 },
  tagline: { color: '#666', fontSize: 14, marginTop: 5, fontWeight: '500' },
  form: { width: '100%' },
  label: { color: '#fff', marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#111', color: '#fff', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#222', fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#10B981', padding: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  // ESTILOS GOOGLE
  googleButton: {
    backgroundColor: '#1A1A1A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 25,
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  orText: {
    color: '#444',
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },

  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  linkText: { color: '#10B981', fontWeight: 'bold' },
});