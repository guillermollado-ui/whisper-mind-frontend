/**
 * onboarding.tsx — TRANSLATED & SECURE (With Language Pre-wiring)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Modal, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import { API_URL, apiFetch } from '../utils/api'; 
// 🌍 IMPORTACIÓN DEL MOTOR DE IDIOMAS
import { useLanguage } from '../src/context/LanguageContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, language } = useLanguage(); // 🌍 Usamos el hook de idioma
  
  const [step, setStep] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(false);

  const [selections, setSelections] = useState({ personality: '', focus: '' });
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // 🕒 Reference to track recording duration for the safety filter
  const recordingStartTimeRef = useRef<number>(0);

  // Welcome step state
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeSound, setWelcomeSound] = useState<Audio.Sound | null>(null);
  const [isPlayingWelcome, setIsPlayingWelcome] = useState(false);

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (welcomeSound) welcomeSound.unloadAsync();
    };
  }, [welcomeSound]);

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      // Mantenemos los valores técnicos en inglés para el backend
      formData.append('personality', selections.personality || 'Empathetic & Soft');
      formData.append('focus', selections.focus || 'General Growth');
      formData.append('initial_notes', 'Onboarding completed via app.');
      
      // 🔌 PRE-INSTALACIÓN: Enviamos el idioma de preferencia al crear el perfil
      formData.append('language', language);

      if (recordingUri) {
        const fileType = recordingUri.split('.').pop();
        const fileToUpload = {
            uri: Platform.OS === 'android' ? recordingUri : recordingUri.replace('file://', ''),
            name: `onboarding_audio.${fileType}`,
            type: `audio/${fileType}`,
        };
        formData.append('file', fileToUpload as any);
      }

      const token = await SecureStore.getItemAsync('user_token');

      const response = await fetch(`${API_URL}/auth/setup-onboarding`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.audio_base64) {
          try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false
            });

            const audioUri = `data:audio/mp3;base64,${data.audio_base64}`;
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: true }
            );
            setWelcomeSound(sound);
            setIsPlayingWelcome(true);
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlayingWelcome(false);
              }
            });
          } catch (audioErr) {
            console.log('Welcome audio playback error:', audioErr);
          }
        }

        setWelcomeMessage(data.message || (language === 'es' ? 'Bienvenido a Whisper Mind.' : 'Welcome to Whisper Mind.'));
        setLoading(false);

        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setStep(4); 
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        });
      } else {
        const text = await response.text();
        let errorMsg = language === 'es' ? 'Por favor verifica tus datos.' : 'Please verify your input data.';
        try {
            const errData = JSON.parse(text);
            if (errData.detail) errorMsg = errData.detail;
        } catch(e) {}
        
        showCustomAlert('Neural Link Error', errorMsg);
        setLoading(false);
      }
    } catch (error: any) {
      showCustomAlert('Connection Error', 'Alice is having trouble reaching the server.');
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

  const enterNexus = () => {
    if (welcomeSound) welcomeSound.unloadAsync();
    router.replace('/(tabs)');
  };

  async function startRecording() {
    try {
      recordingStartTimeRef.current = Date.now();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) { console.error(err); }
  }

  async function stopRecording() {
    if (!recording) return;

    const duration = Date.now() - recordingStartTimeRef.current;
    if (duration < 1500) { 
        setIsRecording(false);
        try { await recording.stopAndUnloadAsync(); } catch (e) {}
        setRecording(null);
        showCustomAlert(t('onboarding.alert_too_short'), t('onboarding.alert_too_short_desc'));
        return; 
    }

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      showCustomAlert(t('onboarding.alert_captured'), t('onboarding.alert_captured_desc'));
    } catch (err) { console.error(err); }
  }

  const handleMicToggle = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const progressPercent = step >= 4 ? 100 : (step / 3) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050B18', '#000000']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>{t('onboarding.loading_link')}</Text>
          </View>
        ) : (
          <Animated.View style={[styles.stepBox, { opacity: fadeAnim }]}>
            {/* STEP 1: Personality */}
            {step === 1 && (
              <>
                <Text style={styles.title}>{t('onboarding.step1_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step1_subtitle')}</Text>
                {(t('onboarding.personalities') as unknown as string[]).map((opt, idx) => {
                  const values = ['Empathetic & Soft', 'Direct & Constructive', 'Challenge Mode'];
                  return (
                    <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => nextStep('personality', values[idx])}>
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* STEP 2: Focus */}
            {step === 2 && (
              <>
                <Text style={styles.title}>{t('onboarding.step2_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step2_subtitle')}</Text>
                {(t('onboarding.focus_areas') as unknown as string[]).map((opt, idx) => {
                  const values = ['Inner Peace', 'Productivity & Success', 'Personal Growth'];
                  return (
                    <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => nextStep('focus', values[idx])}>
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* STEP 3: Voice recording */}
            {step === 3 && (
              <>
                <Text style={styles.title}>{t('onboarding.step3_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step3_subtitle')}</Text>

                <View style={styles.micContainer}>
                  <TouchableOpacity onPress={handleMicToggle} activeOpacity={0.7}>
                    <View style={[styles.orbePlaceholder, isRecording && styles.orbeActive]}>
                      <LinearGradient colors={isRecording ? ['#ef4444', '#7f1d1d'] : ['#38BDF8', '#1e293b']} style={styles.orbeCircle}>
                        <Ionicons name={isRecording ? "square" : "mic"} size={40} color="white" />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.instructionText}>
                    {isRecording ? t('onboarding.mic_listening') : (recordingUri ? t('onboarding.mic_captured') : t('onboarding.mic_tap'))}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.optionBtn, { backgroundColor: '#38BDF8', borderColor: '#38BDF8', marginTop: 10 }]}
                  onPress={() => nextStep()}
                >
                  <Text style={[styles.optionText, { color: '#050B18' }]}>{t('onboarding.btn_sync')}</Text>
                </TouchableOpacity>

                <Text style={styles.medicalDisclaimer}>{t('onboarding.disclaimer')}</Text>
              </>
            )}

            {/* STEP 4: Welcome */}
            {step === 4 && (
              <>
                <Ionicons name="sparkles" size={48} color="#38BDF8" style={{ alignSelf: 'center', marginBottom: 25 }} />
                <Text style={styles.welcomeTitle}>{t('onboarding.step4_title')}</Text>
                <Text style={styles.welcomeMessage}>{welcomeMessage}</Text>

                {welcomeSound && (
                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={async () => {
                      try {
                        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
                        await welcomeSound.replayAsync();
                        setIsPlayingWelcome(true);
                      } catch (e) {}
                    }}
                  >
                    <Ionicons name={isPlayingWelcome ? "pause" : "play"} size={18} color="#38BDF8" />
                    <Text style={styles.replayBtnText}>
                      {isPlayingWelcome ? t('onboarding.playing') : t('onboarding.btn_replay')}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.optionBtn, { backgroundColor: '#38BDF8', borderColor: '#38BDF8', marginTop: 30 }]}
                  onPress={enterNexus}
                >
                  <Text style={[styles.optionText, { color: '#050B18' }]}>{t('onboarding.btn_nexus')}</Text>
                </TouchableOpacity>
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
  medicalDisclaimer: { color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 25, lineHeight: 16, paddingHorizontal: 10 },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: 'white', textAlign: 'center', marginBottom: 20 },
  welcomeMessage: { color: '#CBD5E1', fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 10, fontStyle: 'italic' },
  replayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: '#38BDF8', alignSelf: 'center', marginTop: 15 },
  replayBtnText: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '85%', borderRadius: 30, padding: 35, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  alertGradient: { ...StyleSheet.absoluteFillObject },
  alertTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  alertMessage: { color: '#D1D5DB', fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  alertBtn: { backgroundColor: '#F59E0B', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 15 },
  alertBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1.5, fontSize: 14 },
});