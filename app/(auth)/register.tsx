/**
 * (auth)/register.tsx — WHISPERIZED
 * * Fixes:
 * 1. Integrated AlertContext (Black/Neon Alerts).
 * 2. Integrated Google Sign-In with Disclaimer Check.
 * 3. Auto-redirect to login on success.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../utils/api';
// ✅ IMPORTAMOS EL SISTEMA DE ALERTAS
import { useAlert } from '../../src/context/AlertContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    return null; // valid
};

export default function RegisterScreen() {
    const router = useRouter();
    // ✅ HOOK DE ALERTAS
    const { showAlert } = useAlert();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 🔑 CONFIGURACIÓN GOOGLE (Solo una vez)
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '405439242898-9pi71e0nfge6nagoa6usn59nscpvndui.apps.googleusercontent.com', // ✅ TU CLIENT ID TIPO 3
            offlineAccess: true,
        });
    }, []);

    // 🤖 REGISTRO CON GOOGLE
    const handleGoogleRegister = async () => {
        if (!disclaimerAccepted) {
            showAlert('PROTOCOL HALTED', 'You must accept the Medical Disclaimer before using Google Sign-In.', 'warning');
            return;
        }

        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) throw new Error('No ID Token from Google');

            // Enviamos el token al endpoint unificado /auth/google
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ token: idToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Google Registration Failed');
            }

            // Guardamos token
            if (Platform.OS === 'web') {
                localStorage.setItem('user_token', data.access_token);
            } else {
                await SecureStore.setItemAsync('user_token', data.access_token);
            }

            // Redirigir según estado
            if (data.onboarding_completed === false) {
                router.replace('/onboarding');
            } else {
                router.replace('/(tabs)');
            }

        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // Cancelado por usuario
            } else {
                console.error(error);
                showAlert('GOOGLE ERROR', 'Could not register with Google.', 'error');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleRegister = async () => {
        // --- CLIENT-SIDE VALIDATION ---
        if (!disclaimerAccepted) {
            showAlert('ACCESS DENIED', 'You must accept the Medical Disclaimer to proceed.', 'warning');
            return;
        }

        if (!username.trim() || !email.trim() || !password) {
            showAlert('MISSING DATA', 'All fields are required.', 'warning');
            return;
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            showAlert('INVALID SYNTAX', 'Please enter a valid email address.', 'warning');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            showAlert('WEAK SECURITY', passwordError, 'warning');
            return;
        }

        // --- NETWORK ---
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.toLowerCase().trim(),
                    email: email.toLowerCase().trim(),
                    password: password,
                    disclaimer_accepted: true
                }),
            });

            // Rate limited
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const seconds = retryAfter ? parseInt(retryAfter, 10) : 3600;
                showAlert(
                    'SYSTEM OVERLOAD',
                    `Registration limit reached. Wait ${Math.ceil(seconds / 60)} min.`,
                    'error'
                );
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                showAlert('PROTOCOL FAILED', data.detail || 'Identity could not be established.', 'error');
                return;
            }

            // Success
            showAlert(
                'IDENTITY ESTABLISHED',
                "Verification link sent. Check your inbox to activate protocol.",
                'success'
            );
            
            // Auto-redirect to login after a moment so user reads the message
            setTimeout(() => {
                router.replace('/login');
            }, 2500);

        } catch (error) {
            showAlert('CONNECTION ERROR', 'Neural link failed. Check your connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#1a1a1a']} style={StyleSheet.absoluteFill} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#10B981" />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>NEW PROTOCOL</Text>
                    <Text style={styles.subtitle}>CREATE YOUR NEURAL IDENTITY</Text>
                </View>

                <View style={styles.formContainer}>
                    
                    {/* BOTÓN GOOGLE */}
                    <TouchableOpacity 
                        onPress={handleGoogleRegister} 
                        disabled={googleLoading || loading} 
                        style={[styles.googleButton, !disclaimerAccepted && {opacity: 0.5}]}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>G</Text> 
                                <Text style={styles.googleButtonText}>Join with Google</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR MANUAL ENTRY</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#64748B" value={username} onChangeText={setUsername} autoCapitalize="none" />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#64748B" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Create Password" placeholderTextColor="#64748B" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Password hint */}
                    <Text style={styles.passwordHint}>
                        8+ characters, uppercase, lowercase, and a number
                    </Text>

                    <TouchableOpacity style={styles.disclaimerContainer} onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}>
                        <Ionicons name={disclaimerAccepted ? "checkbox" : "square-outline"} size={24} color={disclaimerAccepted ? "#10B981" : "#64748B"} style={{marginRight: 10}} />
                        <Text style={styles.disclaimerText}>I acknowledge that Whisper Mind is an AI tool, <Text style={{color: '#ef4444', fontWeight: 'bold'}}>NOT a doctor</Text>.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.registerBtn, !disclaimerAccepted && {opacity: 0.5}]} onPress={handleRegister} disabled={loading || !disclaimerAccepted}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.registerBtnText}>ESTABLISH PROTOCOL</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
    backButton: { position: 'absolute', top: 60, left: 30, zIndex: 10 },
    headerContainer: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 5 },
    subtitle: { fontSize: 10, color: '#10B981', letterSpacing: 3, fontWeight: 'bold' },
    formContainer: { width: '100%' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 15, paddingHorizontal: 15, height: 55 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 16 },
    passwordHint: { color: '#64748B', fontSize: 11, marginBottom: 18, marginTop: -8, paddingLeft: 5 },
    disclaimerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
    disclaimerText: { color: '#94A3B8', fontSize: 12, flex: 1 },
    registerBtn: { backgroundColor: '#10B981', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    registerBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    // ESTILOS GOOGLE
    googleButton: {
        backgroundColor: '#1A1A1A',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
    },
    googleButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    orText: {
        color: '#64748B',
        marginHorizontal: 10,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1
    },
});