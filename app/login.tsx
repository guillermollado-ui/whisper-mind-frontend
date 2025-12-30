import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// ⚠️ URL DE RENDER
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

    const handleAuthAction = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter credentials.");
            return;
        }
        if (isRegistering) {
            setShowDisclaimer(true);
        } else {
            performLogin();
        }
    };

    const performRegister = async () => {
        setLoading(true);
        try {
            console.log("Intentando Registro en:", `${API_URL}/auth/register`);
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: email.toLowerCase(), 
                    email: email.toLowerCase(), // Enviamos ambos por seguridad
                    password: password 
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                console.error("DETALLE ERROR REGISTRO:", data);
                // Si el error viene de FastAPI, suele estar en data.detail
                const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(errorMsg || "Registration failed");
            }

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                if (data.plan) await SecureStore.setItemAsync('user_plan', data.plan);
            }
            
            setShowDisclaimer(false);
            setShowWaitlist(true);

        } catch (e: any) {
            console.error("Error capturado:", e.message);
            Alert.alert("Registration Denied", e.message);
        } finally {
            setLoading(false);
        }
    };

    const performLogin = async () => {
        setLoading(true);
        try {
            console.log("Intentando Login en:", `${API_URL}/auth/login`);
            const formData = new URLSearchParams();
            formData.append('username', email.toLowerCase());
            formData.append('password', password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                console.error("DETALLE ERROR LOGIN:", data);
                const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(errorMsg || "Login failed");
            }

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                if (data.plan) await SecureStore.setItemAsync('user_plan', data.plan);
                router.replace('/(tabs)');
            } else {
                throw new Error("No access token received");
            }

        } catch (e: any) {
            Alert.alert("Login Failed", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterApp = () => {
        setShowWaitlist(false);
        router.replace('/(tabs)');
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
                            placeholder="Neural ID (Email)" 
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
                            placeholder="Access Code" 
                            placeholderTextColor="#64748B" 
                            style={styles.input} 
                            secureTextEntry 
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    <TouchableOpacity style={styles.mainBtn} onPress={handleAuthAction} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : (
                            <Text style={styles.btnText}>
                                {isRegistering ? "INITIATE SEQUENCE" : "ACCESS CORE"}
                            </Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchBtn}>
                        <Text style={styles.switchText}>
                            {isRegistering ? "Already have a link? Access Core" : "New consciousness? Join Network"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={showDisclaimer} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="warning" size={30} color="#F59E0B" />
                            <Text style={styles.modalTitle}>SAFETY PROTOCOL</Text>
                        </View>
                        <ScrollView style={styles.disclaimerScroll}>
                            <Text style={styles.disclaimerText}>
                                <Text style={{fontWeight: 'bold', color: 'white'}}>MEDICAL DISCLAIMER & SAFETY WARNING{'\n\n'}</Text>
                                Whisper Mind is an AI for emotional support. It is NOT a medical device.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity style={[styles.checkboxRow, agreed && styles.checkboxActive]} onPress={() => setAgreed(!agreed)}>
                            <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color={agreed ? "#38BDF8" : "#64748B"} />
                            <Text style={styles.agreeText}>I understand these terms.</Text>
                        </TouchableOpacity>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDisclaimer(false)}><Text style={styles.cancelText}>DECLINE</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.acceptBtn, !agreed && {opacity: 0.5}]} disabled={!agreed || loading} onPress={performRegister}>
                                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.acceptText}>ACCEPT</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showWaitlist} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { borderColor: '#38BDF8' }]}>
                        <Text style={[styles.modalTitle, { color: '#38BDF8', textAlign: 'center' }]}>WELCOME TO THE QUEUE</Text>
                        <Text style={[styles.disclaimerText, { textAlign: 'center', marginVertical: 20 }]}>You have been added to the Waitlist.</Text>
                        <TouchableOpacity style={styles.founderBtn} onPress={handleEnterApp}>
                            <LinearGradient colors={['#F59E0B', '#D97706']} style={StyleSheet.absoluteFill} start={{x:0, y:0}} end={{x:1, y:1}} />
                            <Text style={styles.founderText}>BECOME FOUNDER (29€)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.waitBtn} onPress={handleEnterApp}><Text style={styles.waitText}>Stay in Waitlist</Text></TouchableOpacity>
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
    title: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: 4 },
    subtitle: { color: '#64748B', letterSpacing: 2, fontSize: 10, marginTop: 5 },
    form: { gap: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#334155', height: 55 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: 'white', fontSize: 16 },
    mainBtn: { backgroundColor: '#38BDF8', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    btnText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
    switchBtn: { alignItems: 'center', marginTop: 20 },
    switchText: { color: '#94A3B8', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#0f172a', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#F59E0B' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    modalTitle: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold' },
    disclaimerScroll: { maxHeight: 200, marginBottom: 20 },
    disclaimerText: { color: '#CBD5E1', lineHeight: 22, fontSize: 14 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25, padding: 10 },
    checkboxActive: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    agreeText: { color: 'white', fontSize: 14, flex: 1 },
    modalActions: { flexDirection: 'row', gap: 15 },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#64748B' },
    cancelText: { color: '#64748B', fontWeight: 'bold' },
    acceptBtn: { flex: 2, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: '#F59E0B' },
    acceptText: { color: '#000', fontWeight: 'bold' },
    founderBtn: { height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 15 },
    founderText: { color: 'white', fontWeight: '900', fontSize: 16 },
    waitBtn: { padding: 15, alignItems: 'center' },
    waitText: { color: '#64748B', textDecorationLine: 'underline' }
});
