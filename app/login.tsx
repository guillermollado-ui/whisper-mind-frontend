import { useState, useEffect } from 'react';
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
    const [agreed, setAgreed] = useState(false);

    // LOG DE CONTROL: Veremos esto en la consola F12
    useEffect(() => {
        console.log("App cargada. URL del Backend:", API_URL);
    }, []);

    const handleAuthAction = () => {
        console.log("Botón pulsado. Modo registro:", isRegistering);
        if (!email || !password) {
            Alert.alert("Error", "Missing credentials");
            return;
        }

        if (isRegistering) {
            setShowDisclaimer(true); // ESTO DEBE ACTIVAR EL MODAL
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
                    disclaimer_accepted: true 
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Reg failed");

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
            setShowDisclaimer(false);
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
            if (!res.ok) throw new Error(data.detail || "Login failed");

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#1e293b']} style={StyleSheet.absoluteFill} />
            <KeyboardAvoidingView behavior="padding" style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>WHISPER MIND</Text>
                </View>

                <View style={styles.form}>
                    <TextInput 
                        placeholder="Email" 
                        placeholderTextColor="#64748B" 
                        style={styles.input} 
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput 
                        placeholder="Password" 
                        placeholderTextColor="#64748B" 
                        style={styles.input} 
                        secureTextEntry 
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity style={styles.mainBtn} onPress={handleAuthAction}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isRegistering ? "REGISTER" : "LOGIN"}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                        <Text style={{color: '#94A3B8', textAlign: 'center', marginTop: 20}}>
                            {isRegistering ? "Go to Login" : "Create Account"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* MODAL CRÍTICO */}
            <Modal visible={showDisclaimer} transparent={false} animationType="slide">
                <View style={{flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 30}}>
                    <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20}}>SAFETY PROTOCOL</Text>
                    <Text style={{color: '#CBD5E1', marginBottom: 30}}>You must accept that this is an AI and not a doctor.</Text>
                    
                    <TouchableOpacity 
                        style={{backgroundColor: '#38BDF8', padding: 20, borderRadius: 10}}
                        onPress={performRegister}
                    >
                        <Text style={{textAlign: 'center', fontWeight: 'bold'}}>I ACCEPT & REGISTER</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setShowDisclaimer(false)} style={{marginTop: 20}}>
                        <Text style={{color: '#64748B', textAlign: 'center'}}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', padding: 30 },
    header: { alignItems: 'center', marginBottom: 50 },
    title: { fontSize: 32, fontWeight: '900', color: 'white' },
    form: { gap: 15 },
    input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 15, color: 'white' },
    mainBtn: { backgroundColor: '#38BDF8', padding: 15, borderRadius: 12, alignItems: 'center' },
    btnText: { fontWeight: 'bold', color: '#000' }
});
