import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// 🔗 URL DEL BACKEND EN RENDER [cite: 21]
const API_URL = 'https://wishpermind-backend.onrender.com';

export default function LoginScreen() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Credenciales, 2: Disclaimer [cite: 36]

    const handleNextStep = () => {
        if (!email || !password) {
            Alert.alert("Error", "Missing credentials");
            return;
        }
        if (isRegistering) {
            setStep(2); // Muestra el Protocolo de Seguridad (Disclaimer) [cite: 36]
        } else {
            performLogin();
        }
    };

    const performRegister = async () => {
        setLoading(true);
        try {
            // 🛠️ FIX: Enviamos JSON puro para evitar el error 'model_attributes_type'
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    username: email.toLowerCase().trim(), 
                    email: email.toLowerCase().trim(), 
                    password: password,
                    disclaimer_accepted: true // 🔐 Requisito legal del sistema
                })
            });

            const data = await res.json();
            
            if (!res.ok) {
                const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(errorMsg || "Registration failed");
            }

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                router.replace('/(tabs)'); // 🚀 Acceso al Módulo 1: Nexus [cite: 10]
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const performLogin = async () => {
        setLoading(true);
        try {
            // 🛡️ El Login usa Form Data (estándar OAuth2)
            const formData = new URLSearchParams();
            formData.append('username', email.toLowerCase().trim());
            formData.append('password', password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error("Incorrect credentials or unauthorized access");
            }

            if (data.access_token) {
                await SecureStore.setItemAsync('user_token', data.access_token);
                router.replace('/(tabs)'); // [cite: 10]
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
            
            {step === 1 ? (
                <View style={styles.content}>
                    <Text style={styles.title}>WHISPER MIND</Text>
                    <TextInput 
                        placeholder="Neural ID (Email)" 
                        placeholderTextColor="#64748B" 
                        style={styles.input} 
                        value={email} 
                        onChangeText={setEmail} 
                        autoCapitalize="none" 
                    />
                    <TextInput 
                        placeholder="Access Code" 
                        placeholderTextColor="#64748B" 
                        style={styles.input} 
                        secureTextEntry 
                        value={password} 
                        onChangeText={setPassword} 
                    />
                    <TouchableOpacity style={styles.mainBtn} onPress={handleNextStep}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isRegistering ? "CONTINUE" : "ACCESS CORE"}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                        <Text style={styles.switchText}>{isRegistering ? "Back to Login" : "New consciousness? Join Network"}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.title}>SAFETY PROTOCOL</Text>
                    <ScrollView style={{maxHeight: 200, marginVertical: 20}}>
                        <Text style={{color: '#CBD5E1', lineHeight: 22}}>
                            Whisper Mind is an AI for emotional support. It is NOT a medical device. [cite: 5]
                            By clicking ACCEPT, you acknowledge this is not professional therapy.
                        </Text>
                    </ScrollView>
                    <TouchableOpacity style={styles.mainBtn} onPress={performRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>I ACCEPT & REGISTER</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStep(1)}>
                        <Text style={styles.switchText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', padding: 40 },
    title: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 40, letterSpacing: 2 },
    input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
    mainBtn: { backgroundColor: '#38BDF8', padding: 18, borderRadius: 12, alignItems: 'center' },
    btnText: { fontWeight: 'bold', color: '#0f172a', letterSpacing: 1 },
    switchText: { color: '#94A3B8', textAlign: 'center', marginTop: 25, fontSize: 13 }
});
