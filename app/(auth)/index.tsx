import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://wishpermind-backend.onrender.com'; 

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("Email Required", "Please enter your email address first so we can send you the reset link.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() })
            });
            Alert.alert("Request Sent", "If an account exists for this email, you will receive a reset link shortly.");
        } catch (error) {
            Alert.alert("Error", "Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Login Failed', 'Incorrect email or password');
                setLoading(false);
                return;
            }

            if (Platform.OS === 'web') {
                localStorage.setItem('user_token', data.access_token);
                localStorage.setItem('user_email', email);
            } else {
                await SecureStore.setItemAsync('user_token', data.access_token);
                await SecureStore.setItemAsync('user_email', email);
            }

            // Al ser login exitoso, vamos a las tabs principales
            router.replace('/(tabs)');

        } catch (error) {
            console.error(error);
            Alert.alert('Connection Error', 'Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a1a1a']}
                style={StyleSheet.absoluteFill}
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                <View style={styles.logoContainer}>
                    <Image 
                       source={require('../../assets/icon.png')}
                       style={styles.logo} 
                    />
                </View>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>WHISPERMIND</Text>
                    <Text style={styles.subtitle}>NEURAL ACCESS PORTAL</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Neural ID (Email)"
                            placeholderTextColor="#64748B"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Access Code"
                            placeholderTextColor="#64748B"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword} disabled={loading}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.loginBtn} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.loginBtnText}>INITIATE LINK</Text>
                        )}
                    </TouchableOpacity>

                    {/* RUTA CORREGIDA: Apunta al archivo register.tsx que crearemos abajo */}
                    <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/register')}>
                        <Text style={styles.registerText}>
                            New User? <Text style={styles.registerHighlight}>Create Protocol</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
    logoContainer: { alignItems: 'center', marginBottom: 30, shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    logo: { width: 120, height: 120, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    headerContainer: { marginBottom: 40, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 5 },
    subtitle: { fontSize: 12, color: '#10B981', letterSpacing: 4, fontWeight: 'bold' },
    formContainer: { width: '100%' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 15, paddingHorizontal: 15, height: 55 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 16 },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
    forgotText: { color: '#64748B', fontSize: 13 },
    loginBtn: { backgroundColor: '#10B981', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    loginBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    registerLink: { alignItems: 'center' },
    registerText: { color: '#94A3B8', fontSize: 14 },
    registerHighlight: { color: '#10B981', fontWeight: 'bold' },
});