/**
 * (auth)/register.tsx — WHISPERIZED
 * * Fixes:
 * 1. Integrated AlertContext (Black/Neon Alerts).
 * 2. Removed legacy Modal code.
 * 3. Auto-redirect to login on success.
 */

import React, { useState } from 'react';
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
import { API_URL } from '../../utils/api';
// ✅ IMPORTAMOS EL SISTEMA DE ALERTAS
import { useAlert } from '../../src/context/AlertContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate password against the corrected backend's rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
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
    const [showPassword, setShowPassword] = useState(false);

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
});