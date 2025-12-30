import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const API_URL = 'https://wishpermind-backend.onrender.com';

export default function LoginScreen() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        console.log("SISTEMA WHISPER MIND v2.2 - WEB COMPATIBLE");
    }, []);

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
                localStorage.setItem('user_token', data.access_token);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally { setLoading(false); }
    };

    const performLogin = async () => {
        setLoading(true);
        try {
            // 🛠️ FIX 422: Usamos URLSearchParams estricto para OAuth2
            const params = new URLSearchParams();
            params.append('username', email.toLowerCase().trim());
            params.append('password', password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Login failed");

            if (data.access_token) {
                localStorage.setItem('user_token', data.access_token);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#1e293b']} style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                <Text style={styles.title}>{step === 1 ? "WHISPER MIND v2.2" : "SAFETY PROTOCOL"}</Text>
                {step === 1 ? (
                    <View>
                        <TextInput placeholder="Email" placeholderTextColor="#64748B" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
                        <TextInput placeholder="Password" placeholderTextColor="#64748B" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
                        <TouchableOpacity style={styles.mainBtn} onPress={() => isRegistering ? setStep(2) : performLogin()}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isRegistering ? "CONTINUE" : "ACCESS CORE"}</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setIsRegistering(!isRegistering); setStep(1); }}>
                            <Text style={styles.switchText}>{isRegistering ? "Back to Login" : "Join Network"}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <ScrollView style={{maxHeight: 150, marginBottom: 20}}>
                            <Text style={{color: '#CBD5E1'}}>Protocolo de seguridad: Esta IA no es un médico.</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.mainBtn} onPress={performRegister}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>I ACCEPT & REGISTER</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.switchText}>Go Back</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', padding: 40 },
    title: { fontSize: 24, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 40 },
    input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15 },
    mainBtn: { backgroundColor: '#38BDF8', padding: 18, borderRadius: 12, alignItems: 'center' },
    btnText: { fontWeight: 'bold', color: '#000' },
    switchText: { color: '#94A3B8', textAlign: 'center', marginTop: 20 }
});
