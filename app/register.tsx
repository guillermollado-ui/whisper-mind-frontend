import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Linking,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://wishpermind-backend.onrender.com';
const LEMON_SQUEEZY_URL = 'https://google.com'; 

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // --- ESTADO PARA ALERTA PERSONALIZADA ---
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });

    const showCustomAlert = (title: string, message: string, type: 'error' | 'success' = 'error') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
    };

    const handleRegister = async () => {
        if (!disclaimerAccepted) {
            showCustomAlert('Access Denied', 'You must accept the Medical Disclaimer to proceed.');
            return;
        }

        if (!username || !email || !password) {
            showCustomAlert('Missing Data', 'All neural fields are required for identification.');
            return;
        }

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

            const data = await response.json();

            if (!response.ok) {
                showCustomAlert('Protocol Failed', data.detail || 'Identity could not be established.');
                setLoading(false);
                return;
            }

            // AUTO-LOGIN
            const formData = new URLSearchParams();
            formData.append('username', username.toLowerCase().trim());
            formData.append('password', password);

            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const loginData = await loginRes.json();

            if (loginRes.ok && loginData.access_token) {
                await SecureStore.setItemAsync('user_token', loginData.access_token);
                showCustomAlert('Protocol Established', 'Identity verified. Let Alice meet you.', 'success');
            } else {
                showCustomAlert('Manual Access Required', 'Account created, but neural link failed. Please login manually.');
            }

        } catch (error) {
            showCustomAlert('Connection Error', 'Neural link failed. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const closeAlert = () => {
        setAlertVisible(false);
        if (alertConfig.type === 'success') {
            router.replace('/(auth)/onboarding');
        }
    };

    const openPayment = () => { Linking.openURL(LEMON_SQUEEZY_URL); };

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

                    <TouchableOpacity style={styles.disclaimerContainer} onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}>
                        <Ionicons name={disclaimerAccepted ? "checkbox" : "square-outline"} size={24} color={disclaimerAccepted ? "#10B981" : "#64748B"} style={{marginRight: 10}} />
                        <Text style={styles.disclaimerText}>I acknowledge that Whisper Mind is an AI tool, <Text style={{color: '#ef4444', fontWeight: 'bold'}}>NOT a doctor</Text>.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.registerBtn, !disclaimerAccepted && {opacity: 0.5}]} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.registerBtnText}>ESTABLISH PROTOCOL</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.founderBtn} onPress={openPayment}>
                         <Text style={styles.founderText}>💎  GET FOUNDER PASS</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* --- MODAL DE ALERTA COACH ORANGE --- */}
            <Modal visible={alertVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertBox}>
                        <LinearGradient colors={['#1a1a1a', '#050505']} style={styles.alertGradient} />
                        <Ionicons 
                            name={alertConfig.type === 'success' ? "flash" : "alert-circle"} 
                            size={50} 
                            color="#F59E0B" 
                            style={{marginBottom: 15}} 
                        />
                        <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                        <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                        <TouchableOpacity style={styles.alertBtn} onPress={closeAlert}>
                            <Text style={styles.alertBtnText}>ACKNOWLEDGE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    disclaimerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
    disclaimerText: { color: '#94A3B8', fontSize: 12, flex: 1 },
    registerBtn: { backgroundColor: '#10B981', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    registerBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    founderBtn: { borderWidth: 1, borderColor: '#ca8a04', borderRadius: 12, height: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(202, 138, 4, 0.1)' },
    founderText: { color: '#facc15', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    
    // --- ESTILOS MODAL NARANJA ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '85%', borderRadius: 30, padding: 35, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
    alertGradient: { ...StyleSheet.absoluteFillObject },
    alertTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center', letterSpacing: 1 },
    alertMessage: { color: '#D1D5DB', fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    alertBtn: { backgroundColor: '#F59E0B', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 15 },
    alertBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1.5, fontSize: 14 }
});