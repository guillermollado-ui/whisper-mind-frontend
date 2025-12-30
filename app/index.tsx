import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// TU SERVIDOR
const API_URL = 'https://wishpermind-backend.onrender.com';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔑 FUNCIÓN PARA GUARDAR LA LLAVE EN CUALQUIER DISPOSITIVO
  const saveToken = async (token: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('user_token', token);
    } else {
      await SecureStore.setItemAsync('user_token', token);
    }
  };

  const handleAuth = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor escribe usuario y contraseña');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- 🛠️ LÓGICA DE LOGIN BLINDADA (OAuth2 Form Data) ---
        const details: any = {
          'username': username.toLowerCase().trim(),
          'password': password,
          'grant_type': 'password', // Estándar OAuth2 que a veces FastAPI requiere
        };

        const formBody = Object.keys(details)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
          .join('&');

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Accept': 'application/json'
          },
          body: formBody,
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
          await saveToken(data.access_token);
          console.log("Login exitoso. Entrando...");
          router.replace('/(tabs)'); 
        } else {
          const errorMsg = data.detail || 'Credenciales incorrectas';
          Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }

      } else {
        // --- LÓGICA DE REGISTRO REFORZADA ---
        const registrationBody = { 
            username: username.toLowerCase().trim(), 
            email: username.toLowerCase().trim(), 
            password: password,
            disclaimer_accepted: true 
        };

        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          },
          body: JSON.stringify(registrationBody),
        });

        const data = await response.json();

        if (response.ok) {
          Alert.alert('Éxito', 'Consciencia creada. Ahora puedes acceder.');
          setIsLogin(true);
        } else {
          const errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          Alert.alert('Error', errorMessage || 'Error en el registro');
        }
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo contactar con el servidor.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whisper Mind</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Usuario (Email)"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'ENTRAR' : 'REGISTRARSE'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#38BDF8', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#94A3B8', marginBottom: 40 },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: { backgroundColor: '#1E293B', color: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#38BDF8', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  switchButton: { marginTop: 20 },
  switchText: { color: '#94A3B8' }
});
