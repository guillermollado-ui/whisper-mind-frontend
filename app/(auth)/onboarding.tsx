import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://wishpermind-backend.onrender.com';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(false);
  
  // Datos del usuario
  const [selections, setSelections] = useState({ personality: '', focus: '' });
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Alerta personalizada
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showCustomAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  useEffect(() => {
    async function getPermission() {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    }
    getPermission();
  }, []);

  // --- LÓGICA DE ENVÍO AL BACKEND ---
  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('user_token');
      
      const formData = new FormData();
      formData.append('personality', selections.personality || 'Empathetic & Soft');
      formData.append('focus', selections.focus || 'General Growth');
      
      if (recordingUri) {
        formData.append('file', {
          uri: recordingUri,
          name: 'onboarding_audio.m4a',
          type: 'audio/m4a',
        } as any);
      }

      const response = await fetch(`${API_URL}/auth/setup-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        router.replace('/(tabs)');
      } else {
        const errData = await response.json();
        showCustomAlert("Neural Link Error", errData.detail || "Could not sync preferences.");
      }
    } catch (error) {
      showCustomAlert("Connection Error", "Alice is having trouble reaching the server.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (field?: string, value?: string) => {
    if (field && value) setSelections(prev => ({ ...prev, [field]: value }));
    
    if (step === 3) {
      finishOnboarding();
      return;
    }

    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setStep(step + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  async function startRecording() {
    try {
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) { console.error(err); }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      // Copy humano y directo
      showCustomAlert("Captured", "I’ll remember this.");
    } catch (err) { console.error(err); }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050B18', '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>ESTABLISHING LINK...</Text>
          </View>
        ) : (
          <Animated.View style={[styles.stepBox, { opacity: fadeAnim }]}>
            {step === 1 && (
              <>
                <Text style={styles.title}>How should Alice guide you?</Text>
                <Text style={styles.subtitle}>Choose the voice of your emotional architect.</Text>
                {['Empathetic & Soft', 'Direct & Constructive', 'Challenge Mode'].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.optionBtn} onPress={() => nextStep('personality', opt)}>
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.title}>What is your North Star?</Text>
                <Text style={styles.subtitle}>Alice will focus her insights on this area.</Text>
                {['Inner Peace', 'Productivity & Success', 'Personal Growth'].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.optionBtn} onPress={() => nextStep('focus', opt)}>
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {step === 3 && (
              <>
                {/* Copys mínimos y más directos */}
                <Text style={styles.title}>Tell Alice what matters today</Text>
                <Text style={styles.subtitle}>Speak in any language. Alice will adapt.</Text>
                
                <View style={styles.micContainer}>
                  <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} activeOpacity={0.7}>
                    <View style={[styles.orbePlaceholder, isRecording && styles.orbeActive]}>
                      <LinearGradient colors={isRecording ? ['#ef4444', '#7f1d1d'] : ['#38BDF8', '#1e293b']} style={styles.orbeCircle}>
                        <Ionicons name={isRecording ? "radio-button-on" : "mic"} size={40} color="white" />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Micro-señal de estado para aumentar confianza */}
                  <Text style={styles.instructionText}>
                    {isRecording ? "Alice is listening..." : (recordingUri ? "Captured ✓ Tap Sync & Start" : "Hold and tell Alice how she can help you")}
                  </Text>
                </View>

                {/* Botón con Copy de acción técnica/premium */}
                <TouchableOpacity 
                  style={[styles.optionBtn, { backgroundColor: '#38BDF8', borderColor: '#38BDF8', marginTop: 10 }]} 
                  onPress={() => nextStep()}
                >
                  <Text style={[styles.optionText, { color: '#050B18' }]}>Sync & Start</Text>
                </TouchableOpacity>

                {/* Disclaimer legal para Apple y seguridad del usuario */}
                <Text style={styles.medicalDisclaimer}>
                  Alice isn’t a medical professional. If you’re in danger, contact local emergency services.
                </Text>
              </>
            )}
          </Animated.View>
        )}
      </SafeAreaView>

      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <LinearGradient colors={['#1a1a1a', '#050505']} style={styles.alertGradient} />
            <Ionicons name="flash" size={50} color="#F59E0B" style={{marginBottom: 15}} />
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={() => setAlertVisible(false)}>
              <Text style={styles.alertBtnText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  progressContainer: { position: 'absolute', top: 60, left: 30, right: 30, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressBar: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 2 },
  stepBox: { width: '100%' },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 40, textAlign: 'center' },
  optionBtn: { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', padding: 22, borderRadius: 15, marginBottom: 15 },
  optionText: { color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  micContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  orbePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  orbeActive: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', transform: [{scale: 1.1}] },
  orbeCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  instructionText: { color: 'white', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 25, opacity: 0.8, textAlign: 'center' },
  loadingBox: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#F59E0B', marginTop: 20, fontWeight: 'bold', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '85%', borderRadius: 30, padding: 35, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  alertGradient: { ...StyleSheet.absoluteFillObject },
  alertTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  alertMessage: { color: '#D1D5DB', fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  alertBtn: { backgroundColor: '#F59E0B', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 15 },
  alertBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1.5, fontSize: 14 },
  medicalDisclaimer: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 25,
    lineHeight: 16,
    paddingHorizontal: 10
  }
});