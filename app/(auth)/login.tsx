import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { API_URL } from '../../utils/api';
// ✅ IMPORTAMOS EL SISTEMA DE ALERTAS
import { useAlert } from '../../src/context/AlertContext';

// 📂 Cargar la imagen del logo
const LOGO_IMAGE = require('@/assets/icon.png'); 

export default function LoginScreen() {
  const router = useRouter();
  // ✅ USAMOS EL HOOK DE ALERTAS
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

      // --- ÉXITO ---
      if (data.access_token) {
        if (Platform.OS === 'web') {
          localStorage.setItem('user_token', data.access_token);
        } else {
          await SecureStore.setItemAsync('user_token', data.access_token);
        }

        if (data.onboarding_completed === false) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      }
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
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  linkText: { color: '#10B981', fontWeight: 'bold' },
});