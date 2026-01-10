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
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 🌍 TU BACKEND EN RENDER
const API_URL = 'https://wishpermind-backend.onrender.com';

// 🍋 TU LINK DE PAGO (Lo actualizaremos mañana)
const LEMON_SQUEEZY_URL = 'https://google.com'; 

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // 🛡️ ESTADO PARA EL DISCLAIMER
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        // 1. VALIDACIÓN DEL DISCLAIMER
        if (!disclaimerAccepted) {
            Alert.alert(
                'Access Denied', 
                'You must accept the Medical Disclaimer to establish a neural link.'
            );
            return;
        }

        if (!username || !email || !password) {
            Alert.alert('Missing Data', 'Please fill in all fields to create your protocol.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    disclaimer_accepted: true // Enviamos TRUE porque el usuario ya validó el checkbox
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Registration Failed', data.detail || 'Could not create account.');
                setLoading(false);
                return;
            }

            Alert.alert('Success', 'Protocol Created. Please Login.', [
                { text: 'OK', onPress: () => router.back() } // Vuelve al index (login)
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('Connection Error', 'Neural link failed. Check your internet.');
        } finally {
            setLoading(false);
        }
    };

    const openPayment = () => {
        Linking.openURL(LEMON_SQUEEZY_URL);
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
                {/* Botón atrás */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#10B981" />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>NEW PROTOCOL</Text>
                    <Text style={styles.subtitle}>CREATE YOUR NEURAL IDENTITY</Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Username */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#64748B"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#64748B"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Create Password"
                            placeholderTextColor="#64748B"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* 🛡️ DISCLAIMER MÉDICO (CHECKBOX) */}
                    <TouchableOpacity 
                        style={styles.disclaimerContainer} 
                        onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
                    >
                        <Ionicons 
                            name={disclaimerAccepted ? "checkbox" : "square-outline"} 
                            size={24} 
                            color={disclaimerAccepted ? "#10B981" : "#64748B"} 
                            style={{marginRight: 10}}
                        />
                        <Text style={styles.disclaimerText}>
                            I acknowledge that Whisper Mind is an AI tool, <Text style={{color: '#ef4444', fontWeight: 'bold'}}>NOT a doctor</Text>. I accept the terms.
                        </Text>
                    </TouchableOpacity>

                    {/* BOTÓN REGISTRO */}
                    <TouchableOpacity 
                        style={[styles.registerBtn, !disclaimerAccepted && {opacity: 0.5}]} 
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.registerBtnText}>ESTABLISH PROTOCOL</Text>
                        )}
                    </TouchableOpacity>

                    {/* 💎 BOTÓN FOUNDER (Opcional) */}
                    <TouchableOpacity style={styles.founderBtn} onPress={openPayment}>
                         <Text style={styles.founderText}>💎  GET FOUNDER PASS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                        <Text style={styles.loginText}>
                            Already have an ID? <Text style={styles.loginHighlight}>Login</Text>
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
    backButton: { position: 'absolute', top: 60, left: 30, zIndex: 10 },
    headerContainer: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 5 },
    subtitle: { fontSize: 10, color: '#10B981', letterSpacing: 3, fontWeight: 'bold' },
    formContainer: { width: '100%' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 15, paddingHorizontal: 15, height: 55 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 16 },
    
    // Estilos nuevos para Disclaimer
    disclaimerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
    disclaimerText: { color: '#94A3B8', fontSize: 12, flex: 1 },

    registerBtn: { backgroundColor: '#10B981', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    registerBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    
    // Estilo botón Founder
    founderBtn: { borderWidth: 1, borderColor: '#ca8a04', borderRadius: 12, height: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(202, 138, 4, 0.1)' },
    founderText: { color: '#facc15', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    loginLink: { alignItems: 'center' },
    loginText: { color: '#94A3B8', fontSize: 14 },
    loginHighlight: { color: '#10B981', fontWeight: 'bold' },
});