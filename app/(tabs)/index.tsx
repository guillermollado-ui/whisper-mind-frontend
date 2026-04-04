import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Platform,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
  Switch,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
// ✅ NUEVO: Importación del SDK de RevenueCat
import Purchases from 'react-native-purchases';
import { API_URL, apiFetch } from '../../utils/api';
import { useAlert } from '../../src/context/AlertContext'; 
import { useLanguage } from '../../src/context/LanguageContext';
import { useGodMode } from '../../src/context/GodModeContext'; // ✅ INYECTADO: El cerebro del Modo Dios
import InitiationOverlay from '../../components/InitiationOverlay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 📂 ASSETS
const THINKING_SOUND = require('@/assets/sounds/thinking.mp3');
const ORB_IMAGE = require('@/assets/images/nexus_orb.png');

// ✅ LA LLUVIA ORIGINAL: e_volume:-95 (Tu configuración funcional)
const SLEEP_TRACK_URL = 'https://res.cloudinary.com/dtqehosg3/video/upload/e_volume:-85/v1771435100/nature_rain_1_edbhvz.mp3';

const MODES = [
  { id: 'default', color: '#38BDF8' },
  { id: 'calm', color: '#10B981' },
  { id: 'win', color: '#F59E0B' },
  { id: 'dream', color: '#6366F1' },
];

const SLEEP_COLOR = '#8B5CF6';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- WAVEFORM COMPONENT ---
const Waveform = ({ color }: { color: string }) => {
  const animations = useRef(Array.from({ length: 5 }).map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const anims = animations.map((anim) => {
      return Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: Math.random() * 0.8 + 0.5, duration: 200 + Math.random() * 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 200 + Math.random() * 200, useNativeDriver: true }),
      ]));
    });
    Animated.parallel(anims).start();
  }, []);
  return (
    <View style={styles.waveformContainer}>
      {animations.map((anim, i) => (<Animated.View key={i} style={[styles.waveBar, { backgroundColor: color, transform: [{ scaleY: anim }] }]} />))}
    </View>
  );
};

export default function NexusScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { language, setLanguage, t } = useLanguage();
  
  // ✅ VARIABLES MODO DIOS RESTAURADAS
  const { isGodMode, unlockGodMode } = useGodMode();
  const tapCount = useRef(0);
  const tapTimeout = useRef<any>(null);
    
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState(MODES[0]);

  const [currentFlashState, setCurrentFlashState] = useState('none');

  const [proposedVibration, setProposedVibration] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showVibrationModal, setShowVibrationModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const recordingModeRef = useRef('default');
  const recordingStartTimeRef = useRef<number>(0);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userStatus, setUserStatus] = useState({ username: '', role: 'free', is_founder: false });

  const [aliceSpeed, setAliceSpeed] = useState<number>(1.0);

  const [isTextMode, setIsTextMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [silentResponse, setSilentResponse] = useState<{text: string, audioUrl: string | null} | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const thinkingSoundRef = useRef<Audio.Sound | null>(null);
  const bgSoundRef = useRef<Audio.Sound | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashFadeAnim = useRef(new Animated.Value(0)).current;
  const responseListener = useRef<any>();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const verifySession = async () => {
        const token = await SecureStore.getItemAsync('user_token');
        if (!token && isActive) router.replace('/login');
      };
      verifySession();
      return () => { isActive = false; };
    }, [])
  );

  useEffect(() => {
    const loadPreferences = async () => {
      const bio = await SecureStore.getItemAsync('use_biometrics');
      setBiometricsEnabled(bio === 'true');
      const savedSpeed = await SecureStore.getItemAsync('alice_speed');
      if (savedSpeed) setAliceSpeed(parseFloat(savedSpeed));
    };
    loadPreferences();
  }, []);

  const handleSpeedChange = async (newSpeed: number) => {
    setAliceSpeed(newSpeed);
    await SecureStore.setItemAsync('alice_speed', newSpeed.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (showSettingsModal) {
      const fetchStatus = async () => {
        try {
          const res = await apiFetch('/user/status');
          if (res.ok) {
            const data = await res.json();
            setUserStatus(data);
          }
        } catch (e) { console.log("Status fetch error", e); }
      };
      fetchStatus();
    }
  }, [showSettingsModal]);

  // ✅ NUEVO: Inicialización de RevenueCat y vinculación de usuario
  useEffect(() => {
    const setupRevenueCat = async () => {
        try {
            if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: "goog_xevpdkJGflmavhXinaOoBBLMGWq" });
            } else if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: "appl_TU_API_KEY_DE_REVENUECAT_AQUI" });
            }
            
            // Le decimos a RevenueCat quién es este usuario basándonos en tu Base de Datos
            if (userStatus.username) {
                await Purchases.logIn(userStatus.username);
            }
        } catch (e) {
            console.log("RevenueCat Setup Error:", e);
        }
    };

    if (userStatus.username) {
        setupRevenueCat();
    }
  }, [userStatus.username]);

  // ✅ NUEVO: Función para Restaurar Compras (Obligatorio en App Stores)
  const handleRestorePurchases = async () => {
      try {
          const purchaserInfo = await Purchases.restorePurchases();
          // Comprobamos si RevenueCat detecta que tienen la suscripción activa
          if (purchaserInfo.entitlements.active['premium'] || purchaserInfo.entitlements.active['founder']) {
              showAlert("COMPRAS RESTAURADAS", "Tu acceso premium ha sido validado.", "success");
          } else {
              showAlert("SIN COMPRAS", "No se han encontrado suscripciones activas.", "warning");
          }
      } catch (e) {
          showAlert("ERROR", "No se pudieron restaurar las compras.", "error");
      }
  };

  useEffect(() => {
    async function checkNotificationPermissions() {
        if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') await Notifications.requestPermissionsAsync();
        }
    }
    checkNotificationPermissions();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.mode) {
         handleRoutineTrigger(data.mode);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleRoutineTrigger = async (mode: string) => {
      setTimeout(async () => {
          if (mode === 'morning') {
              triggerArtificialDialogue(language === 'es' ? "Buenos días, Alice." : "Good morning, Alice.", "morning");
          } else if (mode === 'night') {
              triggerArtificialDialogue(language === 'es' ? "Estoy listo para cerrar el día." : "I am ready to close the day.", "night");
          }
      }, 1000);
  };

  const triggerArtificialDialogue = async (hiddenPrompt: string, mode: string) => {
      setAiThinking(true);
      try {
        const res = await apiFetch('/chat/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: hiddenPrompt, mode: mode, language: language, speed: aliceSpeed })
        });
        const data = await res.json();
        handleBackendResponse(data, res, mode, true);
      } catch (e) {
        setAiThinking(false);
      }
  };

  useEffect(() => {
    if (currentFlashState === 'choice') {
        Animated.timing(flashFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    } else {
        flashFadeAnim.setValue(0);
    }
  }, [currentFlashState]);

  // ✅ LÓGICA DE LA CERRADURA SECRETA REINTEGRADA
  const handleGodModeTap = () => {
    if (isGodMode) return; 
    
    tapCount.current += 1;
    if (tapTimeout.current) clearTimeout(tapTimeout.current);

    if (tapCount.current >= 5) {
      unlockGodMode();
      tapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      tapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1000);
    }
  };

  const setPlaybackAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, 
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
    } catch (e) {}
  };

  useEffect(() => {
    async function setupAudio() {
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') return;
        
        await setPlaybackAudioMode();

        try {
            const { sound } = await Audio.Sound.createAsync(
            THINKING_SOUND,
            { shouldPlay: false, isLooping: true, volume: 0.5 }
            );
            thinkingSoundRef.current = sound;
        } catch (e) {}
      } catch (error) { console.log("Error loading audio setup:", error); }
    }
    setupAudio();
    return () => { if (thinkingSoundRef.current) thinkingSoundRef.current.unloadAsync(); };
  }, []);

  useFocusEffect(useCallback(() => { return () => { stopSpeaking(); }; }, []));

  const stopSpeaking = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
    
    if (bgSoundRef.current) {
      try { await bgSoundRef.current.stopAsync(); await bgSoundRef.current.unloadAsync(); } catch (e) {}
      bgSoundRef.current = null;
    }
    
    setAiSpeaking(false);
  };

  useEffect(() => {
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    breathe.start();
  }, []);

  const activateSleepRitual = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (aiSpeaking) await stopSpeaking();
    if (isRecording) stopRecordingAction();

    setCurrentMode({ id: 'sleep', color: SLEEP_COLOR });

    try {
      if (bgSoundRef.current) {
        await bgSoundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: SLEEP_TRACK_URL },
        { shouldPlay: false, isLooping: true, volume: 0.05 } // RESTAURADO AL 1%
      );
      bgSoundRef.current = sound;
      await sound.setVolumeAsync(0.05); // REFORZADO AL 1%
      await sound.playAsync(); 
    } catch (e) {
      console.log("Background Audio Error:", e);
    }

    const sleepPrompt = language === 'es' 
      ? "Alice, es hora de dormir. Llévame al santuario." 
      : "Alice, it's time to sleep. Take me to the sanctuary.";
    
    triggerArtificialDialogue(sleepPrompt, 'sleep');
  };

  const triggerFlashReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (aiSpeaking) await stopSpeaking();
    setAiThinking(true);
    setSilentResponse(null);
    setIsTextMode(false);
    setCurrentFlashState('playing'); 
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.playAsync(); } catch (e) {}
    try {
      const res = await apiFetch('/chat/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "PROTOCOL_INITIATE_PANIC_RESET", mode: "flash", language: language, speed: aliceSpeed })
      });
      const data = await res.json();
      handleBackendResponse(data, res, "flash", true, () => {
          enterFlashSilence(); 
      });
    } catch (e: any) {
      setCurrentFlashState('none');
      if (e.message === 'SESSION_EXPIRED') return;
      showAlert("SYSTEM ERROR", "System Offline. Breathe manually.", "error");
      try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
    } finally { setAiThinking(false); }
  };

  const enterFlashSilence = () => {
      setCurrentFlashState('silence');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
          setCurrentFlashState('choice');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 15000); 
  };

  const handlePostFlashChoice = (choice: 'calm' | 'exit') => {
      if (choice === 'calm') {
          const calmMode = MODES.find(m => m.id === 'calm');
          if (calmMode) setCurrentMode(calmMode);
          setCurrentFlashState('none');
      } else {
          setCurrentFlashState('none');
      }
  };

  const publishToNetwork = async () => {
    if (!proposedVibration) return;
    setIsPublishing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const payload = {
        message: proposedVibration.echo_text || proposedVibration.echo || "Essence",
        image_url: proposedVibration.existing_image_url || previewImage,
        vault_id: proposedVibration.vault_id 
      };
      const res = await apiFetch('/vibrations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showAlert("OFFERING ACCEPTED", "Your essence is now resonating.", "success");
        setProposedVibration(null);
        setPreviewImage(null);
        setShowVibrationModal(false);
      } else { throw new Error("Failed"); }
    } catch (e: any) {
      if (e.message === 'SESSION_EXPIRED') return;
      showAlert("CONNECTION LOST", "The Network is unreachable.", "error");
    } finally { setIsPublishing(false); }
  };

  async function startRecording(modeOverride: string | null = null) {
    if (aiSpeaking) await stopSpeaking();
    setSilentResponse(null);
    recordingModeRef.current = modeOverride || currentMode.id;
    recordingStartTimeRef.current = Date.now();
    try {
      await Audio.setAudioModeAsync({ 
          allowsRecordingIOS: true, 
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) { showAlert("Mic Error", "Check permissions", "error"); }
  }

  async function stopRecordingAction() {
    if (!recording) return;
    const duration = Date.now() - recordingStartTimeRef.current;
    
    await setPlaybackAudioMode();

    if (duration < 1500) { 
        setIsRecording(false);
        try { await recording.stopAndUnloadAsync(); } catch (e) {}
        setRecording(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showAlert(language === 'es' ? "MUY CORTO" : "TOO SHORT", language === 'es' ? "Sigue hablando..." : "Keep talking...", "warning");
        return; 
    }
    setIsRecording(false);
    setAiThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.playAsync(); } catch (e) {}
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) sendAudioToBackend(uri, recordingModeRef.current);
  }

  const handleMicToggle = () => {
      if (isRecording && recordingModeRef.current !== 'journal') {
          stopRecordingAction();
      } else if (!isRecording) {
          startRecording(null);
      }
  };

  const toggleJournalRecording = () => {
    if (isRecording) {
        stopRecordingAction();
    } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
        startRecording('journal');
    }
  };

  async function sendAudioToBackend(uri: string, mode: string) {
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('language', language);
      formData.append('speed', aliceSpeed.toString()); 

      const fileType = uri.split('.').pop();
      const fileToUpload = {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };
      formData.append('file', fileToUpload as any);
      const token = await SecureStore.getItemAsync('user_token');
      const res = await fetch(`${API_URL}/chat/voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server Error: ${res.status} - ${text.substring(0, 100)}`);
      }
      const data = await res.json();
      handleBackendResponse(data, res, mode, true);
    } catch (e: any) {
      console.error("Audio Upload Error:", e);
      setAiThinking(false);
      try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
      if (e.message.includes('Network request failed')) {
         showAlert("NETWORK ERROR", "Check internet or server URL.", "error");
      } else if (e.message === 'SESSION_EXPIRED') {
         handleNetworkError();
      } else {
         showAlert("ALICE IS DEAF", "Audio upload failed. Try text.", "error");
      }
    }
  }

  const sendTextToBackend = async () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    setIsTextMode(false);
    setAiThinking(true);
    setSilentResponse(null);
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.playAsync(); } catch (e) {}
    const textToSend = inputText;
    setInputText('');
    try {
      const res = await apiFetch('/chat/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, mode: currentMode.id, language: language, speed: aliceSpeed })
      });
      const data = await res.json();
      handleBackendResponse(data, res, currentMode.id, false);
    } catch (e: any) {
      setAiThinking(false);
      if (e.message === 'SESSION_EXPIRED') handleNetworkError();
    }
  };

  const handleBackendResponse = async (data: any, res: any, mode: string, autoPlay: boolean, onAudioComplete: (() => void) | null = null) => {
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (e) {}
    setAiThinking(false);
    if (!res.ok) throw new Error(data.detail || "Server error");
    
    if (data.limit_reached) {
        if (data.audio_url) await playStream(`${API_URL}${data.audio_url}`, null);
        setTimeout(() => router.push('/subscription'), 2500); 
        return; 
    }

    if (data.proposed_vibration) {
      let imgSource = data.image || data.proposed_vibration.existing_image_url;
      if (imgSource) {
        if (imgSource.length > 500 && !imgSource.startsWith('data:image')) {
          imgSource = `data:image/png;base64,${imgSource}`;
        }
        setPreviewImage(imgSource);
        data.proposed_vibration.existing_image_url = imgSource;
      }
      
      if (data.vault_id) {
        data.proposed_vibration.vault_id = data.vault_id;
      }
      
      setProposedVibration(data.proposed_vibration);
      // ✅ NUEVO: Eliminamos la restricción del modo. Si Alice envía una propuesta de vibración, mostramos el modal.
      if (data.proposed_vibration) {
        setTimeout(() => setShowVibrationModal(true), 1500);
      }
    }

    if (data.audio_url) {
      if (autoPlay) {
          await playStream(`${API_URL}${data.audio_url}`, onAudioComplete);
      } else {
          setSilentResponse({ text: data.text || (language === 'es' ? "Te escucho." : "I hear you."), audioUrl: `${API_URL}${data.audio_url}` });
      }
    }
  };

  const playStream = async (url: string, onComplete: (() => void) | null) => {
    try {
      if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync();
      if (soundRef.current) await soundRef.current.unloadAsync();
      
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true, volume: 1.0 });
      soundRef.current = sound;
      setAiSpeaking(true);
      
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          stopSpeaking(); 
          if (onComplete) onComplete();
        }
      });
    } catch (e) { 
        setAiSpeaking(false);
        if (onComplete) onComplete();
    }
  };

  const handleNetworkError = async () => {
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
    setAiThinking(false);
    showAlert("Network Error", "Could not reach Nexus.", "error");
  };

  const handleLogout = async () => {
    setShowSettingsModal(false);
    if (aiSpeaking) await stopSpeaking();
    await SecureStore.deleteItemAsync('user_token');
    if (Platform.OS === 'web') localStorage.removeItem('user_token');
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(language === 'es' ? "ADVERTENCIA CRÍTICA" : "CRITICAL WARNING", language === 'es' ? "¿Borrar cuenta permanentemente?" : "Permanently delete account?", [
      { text: language === 'es' ? "Cancelar" : "Cancel", style: "cancel" },
      { text: language === 'es' ? "BORRAR" : "DELETE", style: "destructive", onPress: async () => {
          try {
            const res = await apiFetch('/user/account', { method: 'DELETE' });
            if (res.ok) handleLogout();
            else showAlert("Error", "Could not delete.", "error");
          } catch (e) { showAlert("Error", "System failure.", "error"); }
        }
      }
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return showAlert("HARDWARE ERROR", "Biometrics unavailable.", "error");
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authorize' });
      if (result.success) {
        setBiometricsEnabled(true);
        await SecureStore.setItemAsync('use_biometrics', 'true');
        showAlert("SECURITY UPGRADED", "Biometric access enabled.", "success");
      }
    } else {
      setBiometricsEnabled(false);
      await SecureStore.deleteItemAsync('use_biometrics');
    }
  };

  const handleDownloadImage = async () => {
    if (!previewImage) return;
    try {
      const filename = FileSystem.cacheDirectory + `whisper_essence_${Date.now()}.png`;
      if (previewImage.startsWith('data:image')) {
        const base64Data = previewImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
      } else {
        const download = await FileSystem.downloadAsync(previewImage, filename);
        if (download.status === 200) await Sharing.shareAsync(download.uri);
      }
    } catch (error) { showAlert("Error", "Could not process image.", "error"); }
  };

  const activateDailyRoutine = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Device.isDevice) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          showAlert("Permission Denied", "Enable notifications in settings.", "error");
          return;
        }
      }
    }
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      const morningTrigger: any = Platform.OS === 'ios'
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 9, minute: 0, repeats: true }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 };
      const nightTrigger: any = Platform.OS === 'ios'
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 21, minute: 0, repeats: true }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 21, minute: 0 };

      await Notifications.scheduleNotificationAsync({
        content: { 
            title: language === 'es' ? "☀️ Buenos Días" : "☀️ Good Morning", 
            body: language === 'es' ? "Alice está lista para orientar tu día." : "Alice is ready to help you orient your day.", 
            sound: true, 
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { mode: 'morning' }
        },
        trigger: morningTrigger,
      });
      await Notifications.scheduleNotificationAsync({
        content: { 
            title: language === 'es' ? "🌙 Hora del Diario" : "🌙 Journal Time", 
            body: language === 'es' ? "Cierra el día para despejar tu mente." : "Close the day to clear your mind.", 
            sound: true, 
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { mode: 'night' }
        },
        trigger: nightTrigger,
      });

      await SecureStore.setItemAsync('whisper_alarm_enabled', 'true');

      showAlert("ROUTINE SYNCED", language === 'es' ? "Alice te despertará (9:00) y te conectará (21:00)." : "Alice will wake you (9:00) and ground you (21:00).", "success");
    } catch (error: any) {
      showAlert("Error", `Could not sync: ${error.message}`, "error");
    }
  };

  const renderUserBadge = () => {
    let text = language === 'es' ? "NIVEL GRATUITO" : "FREE TIER";
    let color = "#64748B";
    if (userStatus.is_founder) {
      text = "LIFETIME FOUNDER";
      color = "#F59E0B"; 
    } else if (userStatus.role === 'premium') {
      text = "PREMIUM MEMBER";
      color = "#38BDF8"; 
    }
    return (
      <View style={{alignItems:'center', marginBottom: 20}}>
        <Text style={{color: '#fff', fontSize: 18, fontWeight:'bold', letterSpacing:1}}>@{userStatus.username || 'User'}</Text>
        <View style={{marginTop: 5, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: color, borderRadius: 12}}>
          <Text style={{color: color, fontSize: 10, fontWeight:'bold', letterSpacing: 1}}>{text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[currentMode.color + '20', '#000000', '#000000']}
          style={{ width: '100%', height: '70%' }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
      
      <View style={styles.headerContainer}>
        <View>
          {/* ✅ CERRADURA SECRETA: 5 toques en el título para abrir el Modo Dios */}
          <TouchableOpacity activeOpacity={1} onPress={handleGodModeTap}>
            <Text style={styles.title}>{t('nexus.title')}</Text>
          </TouchableOpacity>
          <View style={{flexDirection:'row', alignItems:'center', gap: 8, marginTop: 8}}>
            <View style={[styles.modeIndicator, {backgroundColor: currentMode.color}]} />
            <Text style={[styles.subtitle, { color: currentMode.color }]}>
              {t(`nexus.modes.${currentMode.id}`).toUpperCase()} // PROTOCOL
            </Text>
          </View>
          <Text style={styles.modeDesc}>{t(`nexus.descriptions.${currentMode.id}`)}</Text>
        </View>

        <View style={styles.iconsRow}>
          <TouchableOpacity onPress={() => setIsTextMode(!isTextMode)} style={{padding: 5}}>
            <Ionicons name="keypad-outline" size={24} color={isTextMode ? currentMode.color : "rgba(255,255,255,0.7)"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={activateDailyRoutine} style={{padding: 5}}>
            <Ionicons name="alarm-outline" size={24} color={currentMode.color} style={{opacity: 0.8}} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={{padding: 5}}>
            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerContainer}>
        {!isTextMode ? (
          <>
            <Animated.View style={[
              styles.singularityContainer,
              { transform: [{ scale: pulseAnim }] },
              aiSpeaking && { transform: [{ scale: 1.1 }] }
            ]}>
              <Image source={ORB_IMAGE} style={styles.orbImageBg} resizeMode="contain" />
              <LinearGradient
                colors={[currentMode.color, 'transparent']}
                style={styles.orbGradientOverlay}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.orbCore}>
                  {aiSpeaking ? <Waveform color={currentMode.color} /> :
                   isRecording ? <Ionicons name="mic" size={36} color="#EF4444" /> :
                   aiThinking ? <ActivityIndicator color={currentMode.color} /> :
                   <Ionicons name="aperture-outline" size={36} color={currentMode.color} style={{opacity: 0.6}} />
                  }
                </View>
              </LinearGradient>
            </Animated.View>

            {silentResponse && !aiThinking ? (
              <View style={styles.silentResponseContainer}>
                <TouchableOpacity onPress={() => setSilentResponse(null)} style={{alignSelf:'flex-end', marginBottom: 5}}>
                    <Ionicons name="close-circle" size={26} color="#475569" />
                </TouchableOpacity>
                <ScrollView 
                  style={{ maxHeight: SCREEN_HEIGHT * 0.35, width: '100%' }}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle="white"
                >
                  <Text style={styles.silentText}>"{silentResponse.text}"</Text>
                </ScrollView>
                {silentResponse.audioUrl && (
                  <TouchableOpacity
                    style={[styles.playButtonMini, {borderColor: currentMode.color, marginTop: 15}]}
                    onPress={() => playStream(silentResponse.audioUrl!, null)}
                  >
                    <Ionicons name={aiSpeaking ? "pause" : "play"} size={14} color={currentMode.color} />
                    <Text style={[styles.playButtonText, {color: currentMode.color}]}>
                        {aiSpeaking ? (language === 'es' ? "ESCUCHANDO..." : "LISTENING...") : (language === 'es' ? "ESCUCHAR" : "LISTEN")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.statusText}>
                {aiThinking ? t('nexus.placeholders.mic_processing') :
                 aiSpeaking ? (language === 'es' ? "TRANSMITIENDO..." : "TRANSMITTING...") :
                 isRecording ? (recordingModeRef.current === 'journal' ? (language === 'es' ? "ARCHIVANDO MEMORIA..." : "ARCHIVING MEMORY...") : t('nexus.placeholders.mic_listening')) :
                 t('nexus.placeholders.mic_tap')}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.textInputContainer}>
            <Text style={[styles.textInputLabel, {color: currentMode.color}]}>{t('nexus.placeholders.text_label')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('nexus.placeholders.text_input')}
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              keyboardAppearance="dark"
            />
            <TouchableOpacity
              style={[styles.sendButton, {backgroundColor: inputText.trim() ? currentMode.color : '#1e293b'}]}
              disabled={!inputText.trim()}
              onPress={sendTextToBackend}
            >
              <Text style={{color: '#000', fontWeight:'bold', fontSize:12, letterSpacing:1}}>{t('nexus.placeholders.btn_transmit')}</Text>
              <Ionicons name="arrow-up" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.modeSelector}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setCurrentMode(m)}
              hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
              style={[
                styles.modeDot,
                {
                  backgroundColor: currentMode.id === m.id ? m.color : '#334155',
                  opacity: currentMode.id === m.id ? 1 : 0.5,
                  transform: [{ scale: currentMode.id === m.id ? 1.2 : 1 }]
                }
              ]}
            />
          ))}
        </View>
      </View>

      {!isTextMode && !silentResponse && (
      <View style={styles.bottomControls}>
        {!aiSpeaking && (
          <TouchableOpacity
            style={[styles.controlCircleSmall, { borderColor: SLEEP_COLOR, opacity: isRecording ? 0.3 : 1 }]}
            onPress={activateSleepRitual}
            disabled={isRecording}
          >
            <Ionicons name="moon-outline" size={20} color={SLEEP_COLOR} />
            <Text style={[styles.controlText, {color: SLEEP_COLOR}]}>SLEEP</Text>
          </TouchableOpacity>
        )}

        {!aiSpeaking && (
          <TouchableOpacity
            style={[
              styles.controlCircleLarge,
              { borderColor: isRecording && recordingModeRef.current !== 'journal' ? '#EF4444' : "#38BDF8" },
              isRecording && recordingModeRef.current === 'journal' && { opacity: 0.2 },
              isRecording && recordingModeRef.current !== 'journal' && { backgroundColor: 'rgba(239, 68, 68, 0.1)' } 
            ]}
            onPress={handleMicToggle}
            disabled={isRecording && recordingModeRef.current === 'journal'}
          >
            <Ionicons 
                name={isRecording && recordingModeRef.current !== 'journal' ? "square" : "mic-outline"} 
                size={isRecording && recordingModeRef.current !== 'journal' ? 28 : 36} 
                color={isRecording && recordingModeRef.current !== 'journal' ? "#EF4444" : "#38BDF8"} 
            />
          </TouchableOpacity>
        )}
        {!aiSpeaking && (
          <TouchableOpacity
            style={[styles.controlCircleSmall, { borderColor: isRecording && recordingModeRef.current === 'journal' ? "#EF4444" : "#38BDF8" }]}
            onPress={toggleJournalRecording}
          >
            <Ionicons
              name={isRecording && recordingModeRef.current === 'journal' ? "square" : "book-outline"}
              size={20}
              color={isRecording && recordingModeRef.current === 'journal' ? "#EF4444" : "#38BDF8"}
            />
            <Text style={[styles.controlText, {color: isRecording && recordingModeRef.current === 'journal' ? "#EF4444" : "#38BDF8"}]}>
              {isRecording && recordingModeRef.current === 'journal' ? "STOP" : "JOURNAL"}
            </Text>
          </TouchableOpacity>
        )}
        {aiSpeaking && (
          <TouchableOpacity style={[styles.controlCircleLarge, { borderColor: '#EF4444' }]} onPress={stopSpeaking}>
            <Ionicons name="stop-circle-outline" size={36} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      )}
      </KeyboardAvoidingView>

      {currentFlashState !== 'none' && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={[styles.modalOverlay, { backgroundColor: '#000' }]}>
                {currentFlashState !== 'choice' && (
                    <Animated.View style={{ opacity: 1, alignItems: 'center' }}>
                        {currentFlashState === 'playing' && (
                            <View style={[styles.orbCore, { borderColor: '#EF4444', backgroundColor: '#450a0a', width: 100, height: 100, borderRadius: 50 }]}>
                                <Waveform color="#EF4444" />
                            </View>
                        )}
                    </Animated.View>
                )}
                {currentFlashState === 'choice' && (
                    <Animated.View style={{ opacity: flashFadeAnim, alignItems: 'center', width: '80%' }}>
                        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 40, textAlign: 'center', fontWeight: '300' }}>
                            {language === 'es' ? "¿Quieres seguir calmando el cuerpo?" : "Do you want to continue calming the body?"}
                        </Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#10B981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, marginBottom: 20, width: '100%', alignItems: 'center' }}
                            onPress={() => handlePostFlashChoice('calm')}
                        >
                            <Text style={{ color: '#000', fontWeight: 'bold', letterSpacing: 1 }}>{language === 'es' ? "CONTINUAR (CALMA)" : "CONTINUE (CALM)"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={{ paddingVertical: 15, width: '100%', alignItems: 'center' }}
                            onPress={() => handlePostFlashChoice('exit')}
                        >
                            <Text style={{ color: '#64748B', fontWeight: 'bold', letterSpacing: 1 }}>{language === 'es' ? "NO, ESTOY BIEN" : "NO, I'M OK"}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
          </Modal>
      )}

      <Modal visible={showVibrationModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.cyberAlertBox, { borderColor: '#38BDF8', width: 340, padding: 0, overflow: 'hidden', backgroundColor: '#09090b' }]}>
            <View style={{ width: '100%', height: 220, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
              ) : (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Ionicons name="aperture-outline" size={40} color="#334155" />
                </View>
              )}
              <LinearGradient colors={['transparent', '#09090b']} style={{position:'absolute', bottom:0, width:'100%', height: 80}} />
              {previewImage && (
                <TouchableOpacity
                  style={{position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20}}
                  onPress={handleDownloadImage}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ padding: 25, alignItems: 'center' }}>
              <Text style={{ color: '#38BDF8', fontSize: 9, letterSpacing: 2, marginBottom: 10, fontWeight: 'bold' }}>ESSENCE DISTILLED</Text>
              <Text style={{ color: 'white', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, lineHeight: 24, fontWeight: '300' }}>"{proposedVibration?.echo_text}"</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity style={styles.alertBtnGhost} onPress={() => { setShowVibrationModal(false); setPreviewImage(null); }}>
                  <Text style={styles.alertBtnTextGhost}>DISCARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.alertBtn, {backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#38BDF8'}]} onPress={publishToNetwork} disabled={isPublishing}>
                  <Text style={[styles.alertBtnText, {color: '#38BDF8'}]}>{isPublishing ? "SENDING..." : "RESONATE"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettingsModal} animationType="slide" transparent={true} onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContainer}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t('settings.title')}</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close-circle" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsBody}>
              {renderUserBadge()}

              <Text style={styles.settingSectionTitle}>{t('settings.security')}</Text>
              <View style={styles.settingRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                  <Ionicons name="finger-print-outline" size={20} color="#38BDF8" />
                  <Text style={styles.settingLabel}>{t('settings.bio_access')}</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#334155', true: '#38BDF8' }}
                  thumbColor={'#fff'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                  <Ionicons name="notifications-outline" size={20} color="#38BDF8" />
                  <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#334155', true: '#38BDF8' }}
                  thumbColor={'#fff'}
                />
              </View>

              <Text style={styles.settingSectionTitle}>{language === 'es' ? "RITMO DE ALICE" : "ALICE'S RHYTHM"}</Text>
              <View style={styles.langSelectorRow}>
                <TouchableOpacity 
                  style={[styles.langBtn, aliceSpeed === 0.8 && styles.langBtnActive]} 
                  onPress={() => handleSpeedChange(0.8)}
                >
                  <Text style={[styles.langBtnText, aliceSpeed === 0.8 && styles.langBtnTextActive]}>
                    {language === 'es' ? "LENTO" : "SLOW"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.langBtn, aliceSpeed === 1.0 && styles.langBtnActive]} 
                  onPress={() => handleSpeedChange(1.0)}
                >
                  <Text style={[styles.langBtnText, aliceSpeed === 1.0 && styles.langBtnTextActive]}>
                    {language === 'es' ? "NORMAL" : "NORMAL"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.langBtn, aliceSpeed === 1.2 && styles.langBtnActive]} 
                  onPress={() => handleSpeedChange(1.2)}
                >
                  <Text style={[styles.langBtnText, aliceSpeed === 1.2 && styles.langBtnTextActive]}>
                    {language === 'es' ? "RÁPIDO" : "FAST"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingSectionTitle}>{t('settings.language')}</Text>
              <View style={styles.langSelectorRow}>
                <TouchableOpacity 
                  style={[styles.langBtn, language === 'en' && styles.langBtnActive]} 
                  onPress={() => { setLanguage('en'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>ENGLISH</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.langBtn, language === 'es' && styles.langBtnActive]} 
                  onPress={() => { setLanguage('es'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.langBtnText, language === 'es' && styles.langBtnTextActive]}>ESPAÑOL</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.linkRow} onPress={() => showAlert("PRIVACY PROTOCOL", "Data is end-to-end encrypted.", "success")}>
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/subscription')}>
                <Text style={styles.linkText}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
              {/* ✅ NUEVO: Botón para Restaurar Compras */}
              <TouchableOpacity style={styles.linkRow} onPress={handleRestorePurchases}>
                <Text style={styles.linkText}>{language === 'es' ? "Restaurar Compras" : "Restore Purchases"}</Text>
                <Ionicons name="refresh-outline" size={16} color="#64748B" />
              </TouchableOpacity>

              <Text style={styles.settingSectionTitle}>{t('settings.account_zone')}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t('settings.btn_disconnect')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t('settings.btn_delete')}</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Whisper Mind v1.2.0 (Stable)</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <InitiationOverlay 
        screenName="nexus" 
        steps={language === 'es' ? [
          { icon: "mic-outline", title: "Habla con Alice", desc: "Elige un modo y pulsa el micrófono central para hablar. Si no quieres hablar, pulsa el teclado arriba a la derecha para escribir." },
          { icon: "book-outline", title: "Modo Journal", desc: "Pulsa Journal para dejar tu impresión del día. Alice destilará tu esencia del dia en una imagen que podrás compartir en la Red." },
          { icon: "moon-outline", title: "Modo Sleep", desc: "Pulsa la Luna cuando necesites descansar. Alice activará un ritual sonoro para ayudarte a dormir sin que tengas que hablar." }
        ] : [
          { icon: "mic-outline", title: "Talk to Alice", desc: "Choose a mode and tap the central mic to speak. If you prefer typing, tap the keyboard icon top right." },
          { icon: "book-outline", title: "Journal Mode", desc: "Tap Journal button , (down right), to leave your daily impression. Alice will distill your day essence into an image to share on the Network." },
          { icon: "moon-outline", title: "Sleep Mode", desc: "Tap the Moon button, (down left), when you need to rest. Alice will activate a sound ritual to help you sleep without speaking." }
        ]}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerContainer: { marginTop: Platform.OS === 'android' ? 60 : 20, paddingHorizontal: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
  iconsRow: { flexDirection: 'row', gap: 15, paddingTop: 5 },
  title: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 6 },
  subtitle: { fontSize: 11, letterSpacing: 2, fontWeight:'700', marginTop: 0 },
  modeIndicator: { width: 6, height: 6, borderRadius: 3 },
  modeDesc: { color: '#64748B', fontSize: 10, marginTop: 8, fontStyle: 'italic', maxWidth: '80%' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  singularityContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
  orbImageBg: { position: 'absolute', width: '100%', height: '100%', opacity: 0.7 },
  orbGradientOverlay: { width: 210, height: 210, borderRadius: 105, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  orbCore: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1e293b' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', height: 40, gap: 4 },
  waveBar: { width: 4, height: 20, borderRadius: 2 },
  statusText: { color: '#64748B', marginTop: 30, letterSpacing: 2, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  modeSelector: { flexDirection: 'row', marginTop: 30, gap: 20 },
  modeDot: { width: 12, height: 12, borderRadius: 6 },
  bottomControls: { marginBottom: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 40 },
  controlCircleLarge: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  controlCircleSmall: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  controlText: { fontSize: 9, marginTop: 4, fontWeight: 'bold', letterSpacing: 1 },
  textInputContainer: { width: '85%', alignItems: 'center', backgroundColor: '#0f172a', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  textInputLabel: { fontSize: 10, fontWeight:'bold', letterSpacing:2, marginBottom:15, alignSelf:'flex-start' },
  textInput: { width: '100%', backgroundColor: '#1e293b', color: 'white', borderRadius: 8, padding: 15, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', gap: 5, marginTop: 15, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%' },
  silentResponseContainer: { marginTop: 20, alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#09090b', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', width: '90%', maxHeight: '75%', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  silentText: { color: '#fff', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginBottom: 15, lineHeight: 24, fontWeight: '300' },
  playButtonMini: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'center' },
  playButtonText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
  cyberAlertBox: { width: 320, backgroundColor: '#09090b', padding: 30, borderRadius: 0, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.8, shadowRadius: 30 },
  alertBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 0, borderWidth: 1, borderColor: '#334155' },
  alertBtnText: { color: 'white', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  alertBtnGhost: { paddingVertical: 12, paddingHorizontal: 30 },
  alertBtnTextGhost: { color: '#64748B', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  settingsContainer: { height: '85%', backgroundColor: '#020617', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#1e293b' },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  settingsTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  settingsBody: { padding: 25 },
  settingSectionTitle: { color: '#64748B', fontSize: 11, fontWeight: 'bold', marginTop: 10, marginBottom: 15, letterSpacing: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: '#0f172a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  settingLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  linkText: { color: '#E2E8F0', fontSize: 14 },
  actionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginTop: 20 },
  deleteBtn: { backgroundColor: '#7f1d1d', marginTop: 10, marginBottom: 40 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
  versionText: { textAlign: 'center', color: '#334155', fontSize: 10, marginBottom: 50 },
  langSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderColor: '#1e293b', backgroundColor: '#0f172a', alignItems: 'center' },
  langBtnActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  langBtnText: { color: '#64748B', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  langBtnTextActive: { color: '#38BDF8' }
});