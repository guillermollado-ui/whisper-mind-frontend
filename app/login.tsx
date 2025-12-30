import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://wishpermind-backend.onrender.com';

export default function LoginScreen() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleAuthAction = () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter credentials.");
            return;
        }
        if (isRegistering) {
            setShowDisclaimer(true); // 🚨 Forzamos que se abra el recuadro
        } else {
            performLogin();
        }
    };

    const performRegister = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: email.toLowerCase().trim(), 
                    email: email.toLowerCase().trim(), 
                    password: password,
                    disclaimer_accepted: true // 🔐 Enviamos la clave que pide el backend
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Registration failed");

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
            }
            
            setShowDisclaimer(false);
            setShowWaitlist(true);
        } catch (e: any) {
            Alert.alert("System Message", e.message);
        } finally {
            setLoading(false);
        }
    };

    const performLogin = async () => {
        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', email.toLowerCase().trim());
            formData.append('password', password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Incorrect email or password");

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert("Login Failed", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#1e293b']} style={StyleSheet.absoluteFill} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoOrb}>
                        <Ionicons name="planet-outline" size={40} color="#38BDF8" />
                    </View>
                    <Text style={styles.title}>WHISPER MIND</Text>
                    <Text style={styles.subtitle}>NEURAL INTERFACE LINK</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput 
                            placeholder="Email" 
                            placeholderTextColor="#64748B" 
                            style={styles.input} 
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput 
                            placeholder="Password" 
                            placeholderTextColor="#64748B" 
                            style={styles.input} 
                            secureTextEntry 
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    <TouchableOpacity style={styles.mainBtn} onPress={handleAuthAction} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : (
                            <Text style={styles.btnText}>{isRegistering ? "REGISTER" : "LOGIN"}</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchBtn}>
                        <Text style={styles.switchText}>{isRegistering ? "Back to Login" : "Create New Account"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* 🛡️ MODAL QUE AHORA SÍ SE VERÁ */}
            <Modal visible={showDisclaimer} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>MEDICAL DISCLAIMER</Text>
                        <ScrollView style={styles.disclaimerScroll}>
                            <Text style={styles.disclaimerText}>
                                Whisper Mind is an AI tool for support and not a medical device. 
                                By clicking ACCEPT, you acknowledge this is not therapy. [cite: 5]
                            </Text>
                        </ScrollView>
                        <TouchableOpacity 
                            style={[styles.checkboxRow, agreed && {backgroundColor: 'rgba(56, 189, 248, 0.1)'}]} 
                            onPress={() => setAgreed(!agreed)}
                        >
                            <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color={agreed ? "#38BDF8" : "#64748B"} />
                            <Text style={{color: 'white'}}>I understand and accept.</Text>
                        </TouchableOpacity>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDisclaimer(false)}>
                                <Text style={{color: '#64748B'}}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.acceptBtn, !agreed && {opacity: 0.5}]} 
                                disabled={!agreed} 
                                onPress={performRegister}
                            >
                                <Text style={{fontWeight: 'bold'}}>ACCEPT & JOIN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', padding: 30 },
    header: { alignItems: 'center', marginBottom: 50 },
    logoOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#38BDF8', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 2 },
    subtitle: { color: '#64748B', fontSize: 10, marginTop: 5 },
    form: { gap: 15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 15, height: 55 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: 'white' },
    mainBtn: { backgroundColor: '#38BDF8', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    btnText: { color: '#0f172a', fontWeight: 'bold' },
    switchBtn: { alignItems: 'center', marginTop: 20 },
    switchText: { color: '#94A3B8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#0f172a', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#38BDF8' },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    disclaimerScroll: { maxHeight: 150, marginBottom: 20 },
    disclaimerText: { color: '#CBD5E1', lineHeight: 20 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, padding: 10, borderRadius: 10 },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
    acceptBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: '#38BDF8', borderRadius: 10 }
});
