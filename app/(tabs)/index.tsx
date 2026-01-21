import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Modal, Platform, Image, StatusBar, SafeAreaView, Share, Alert } from 'react-native'; 
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ TU SOLUCIÓN LEGACY
import * as Sharing from 'expo-sharing';

// ⚠️ URL DE RENDER
const API_URL = 'https://wishpermind-backend.onrender.com';

// 📂 ASSETS LOCALES (INFALIBLE)
const THINKING_SOUND = require('@/assets/sounds/thinking.mp3');
const ORB_IMAGE = require('@/assets/images/nexus_orb.png'); 

const MODES = [
  { id: 'default', label: 'Therapist', color: '#38BDF8', desc: 'Open dialogue space.' }, 
  { id: 'calm', label: 'Anxiety', color: '#10B981', desc: 'Panic relief protocol.' }, 
  { id: 'sleep', label: 'Sleep', color: '#8B5CF6', desc: 'Hypnotic drift engine.' }, 
  { id: 'win', label: 'Coach', color: '#F59E0B', desc: 'Strategic alignment.' }, 
  { id: 'dream', label: 'Dream', color: '#6366F1', desc: 'Subconscious interpreter.' }, 
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// --- COMPONENTE ONDAS SONORAS (VIVO) ---
const Waveform = ({ color }: { color: string }) => {
  const animations = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;
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
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState(MODES[0]); 
  
  // NETWORK STATES
  const [proposedVibration, setProposedVibration] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); 
  const [showVibrationModal, setShowVibrationModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const recordingModeRef = useRef('default'); 
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmTime, setAlarmTime] = useState(new Date());

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', body: '', type: 'success' });
  
  const soundRef = useRef(null);
  const thinkingSoundRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current; 

  const getAuthToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('user_token');
    return await SecureStore.getItemAsync('user_token');
  };

  // 🔊 CARGA DEL SONIDO DE PENSAMIENTO (LOCAL)
  useEffect(() => {
    async function setupAudio() {
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') return;
        
        await Audio.setAudioModeAsync({ 
            allowsRecordingIOS: true, 
            playsInSilentModeIOS: true, 
            staysActiveInBackground: true, 
            shouldDuckAndroid: true 
        });
        
        const { sound } = await Audio.Sound.createAsync(
            THINKING_SOUND, 
            { shouldPlay: false, isLooping: true, volume: 0.5 }
        );
        thinkingSoundRef.current = sound;
      } catch (error) { console.log("Error cargando sonido thinking:", error); }
    }
    setupAudio();
    
    return () => {
        if (thinkingSoundRef.current) {
            thinkingSoundRef.current.unloadAsync();
        }
    }
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => triggerMorningProtocol());
    return () => sub.remove();
  }, []);

  useFocusEffect(useCallback(() => { return () => stopSpeaking(); }, []));

  const stopSpeaking = async () => {
    if (soundRef.current) { try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (e) {} soundRef.current = null; }
    setAiSpeaking(false);
  };

  useEffect(() => {
    const breathe = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    breathe.start();
  }, []);

  const showCyberAlert = (title: string, body: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setAlertConfig({ title, body, type });
      setAlertVisible(true);
  };

  // 📥 FUNCIÓN PARA COMPARTIR/DESCARGAR IMAGEN (MONGODB BASE64)
  const handleDownloadImage = async () => {
    if (!previewImage) return;
    try {
      const filename = FileSystem.cacheDirectory + `whisper_essence_${Date.now()}.png`;
      
      if (previewImage.startsWith('data:image')) {
        // Decodificar Base64 de MongoDB
        const base64Data = previewImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
      } else {
        // Descarga normal si fuera URL
        const download = await FileSystem.downloadAsync(previewImage, filename);
        if (download.status === 200) {
          await Sharing.shareAsync(download.uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not process image for sharing.");
    }
  };

  // ✅ AUTO-ARCHIVO AUTOMÁTICO EN VAULT (MONGO)
  const archiveToVault = async (vibrationData: any, imageSource: string | null) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/vault/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...vibrationData,
          existing_image_url: imageSource
        })
      });
      console.log("Memory archived automatically in Vault.");
    } catch (e) {
      console.log("Auto-archive failed.");
    }
  };

  const publishToNetwork = async () => {
    if (!proposedVibration) return;
    setIsPublishing(true);
    try {
      const token = await getAuthToken();
      const payload = {
          vibration_tag: proposedVibration.vibration_tag,
          echo_text: proposedVibration.echo_text,
          image_prompt: proposedVibration.image_prompt,
          existing_image_url: proposedVibration.existing_image_url 
      };
      const res = await fetch(`${API_URL}/network/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showCyberAlert("OFFERING ACCEPTED", "Your essence is now resonating in the Network.", "success");
        setProposedVibration(null);
        setPreviewImage(null);
        setShowVibrationModal(false);
      } else {
         throw new Error("Failed to publish");
      }
    } catch (e) {
      showCyberAlert("CONNECTION LOST", "The Network could not be reached.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const playStream = async (url, onComplete) => {
    try {
      if (thinkingSoundRef.current) {
          await thinkingSoundRef.current.stopAsync();
      }

      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      setAiSpeaking(true);
      sound.setOnPlaybackStatusUpdate(status => { 
        if (status.isLoaded && status.didJustFinish) {
            setAiSpeaking(false);
            if (onComplete) onComplete(); 
        }
      });
    } catch (e) { console.log("Error streaming:", e); showCyberAlert("Audio Error", "Stream failed.", "error"); }
  };

  const triggerFlashReset = async () => {
    if (aiSpeaking) await stopSpeaking();
    setAiThinking(true);
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.playAsync(); } catch (e) {}

    showCyberAlert("RESET ACTIVATED", "Initiating calming protocol...", "warning");
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/chat/text`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ text: "EMERGENCY: I feel overwhelmed. I need a quick reset immediately.", mode: "flash" }) 
      });
      const data = await res.json();
      try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (e) {}
      if (data.audio_url) await playStream(`${API_URL}${data.audio_url}`, null);
    } catch (e) { 
        showCyberAlert("Error", "Offline", "error"); 
        try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
    } finally { setAiThinking(false); }
  };

  const triggerMorningProtocol = async () => {
    setAiThinking(true);
    try { if (thinkingSoundRef.current) await thinkingSoundRef.current.playAsync(); } catch (e) {}

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/chat/morning`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ text: "WAKE UP", mode: "morning" }) 
      });
      const data = await res.json();
      try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (e) {}
      if (data.audio_url) await playStream(`${API_URL}${data.audio_url}`, null);
    } catch (e) { 
        showCyberAlert("Error", "Offline", "error");
        try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
    } finally { setAiThinking(false); }
  };

  const scheduleNotification = async (date) => {
      try {
        if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') await Notifications.requestPermissionsAsync();
        }
        await Notifications.cancelAllScheduledNotificationsAsync();
        const trigger = new Date(date);
        if (trigger <= new Date()) trigger.setDate(trigger.getDate() + 1);
        await Notifications.scheduleNotificationAsync({
            content: { title: "☀️ Wake Up", body: "Your mind briefing is ready. Tap here.", sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        });
        showCyberAlert("Protocol Activated", `Briefing set for ${trigger.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, "success");
    } catch (error) { showCyberAlert("System Error", "Could not set alarm.", "error"); } finally { setShowTimePicker(false); }
  };

  async function startRecording(modeOverride = null) {
    if (aiSpeaking) await stopSpeaking();
    recordingModeRef.current = modeOverride || currentMode.id;
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) { console.error("Error grabando:", err); showCyberAlert("Mic Error", "Check permissions", "error"); }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    setAiThinking(true); 
    try { if (thinkingSoundRef.current) { await thinkingSoundRef.current.playAsync(); } } catch (e) { console.log("Sound play error", e); }
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecording(null);
    if (uri) sendAudioToBackend(uri, recordingModeRef.current);
  }

  const toggleJournalRecording = () => {
      if (isRecording) { stopRecording(); } 
      else { startRecording('journal'); }
  };

  async function sendAudioToBackend(uri, mode) {
    try {
      const token = await getAuthToken();
      if (!token) { 
          try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (e) {}
          showCyberAlert("Auth Error", "Please login again", "error"); return; 
      }
      
      const formData = new FormData();
      formData.append('mode', mode); 
      formData.append('file', { uri, name: 'voice.m4a', type: 'audio/m4a' } as any);

      const res = await fetch(`${API_URL}/chat/voice`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      
      const data = await res.json();
      
      if (!data.audio_url || !res.ok) {
          try { if (thinkingSoundRef.current) { await thinkingSoundRef.current.stopAsync(); } } catch (e) {}
      }

      if (!res.ok) throw new Error(data.detail || "Server error");

      if (data.proposed_vibration) {
        // ✅ REPARACIÓN MONGODB: Tratar imagen como Base64 URI
        let imgSource = data.image || data.proposed_vibration.existing_image_url;
        
        if (imgSource) {
           // Asegurar prefijo Base64 para que React Native Image lo pinte
           if (imgSource.length > 500 && !imgSource.startsWith('data:image')) {
              imgSource = `data:image/png;base64,${imgSource}`;
           }
           setPreviewImage(imgSource);
           data.proposed_vibration.existing_image_url = imgSource;
        }
        
        setProposedVibration(data.proposed_vibration);

        // ✅ AUTO-ARCHIVO: Guardar en Vault automáticamente ahora
        archiveToVault(data.proposed_vibration, imgSource);
      }

      if (data.audio_url) {
        await playStream(`${API_URL}${data.audio_url}`, () => {
            if (data.proposed_vibration && (mode === 'journal' || mode === 'dream')) {
                setShowVibrationModal(true);
            }
        });
      }
      
    } catch (e) { 
        console.log(e); 
        try { if (thinkingSoundRef.current) await thinkingSoundRef.current.stopAsync(); } catch (ex) {}
        showCyberAlert("Network Error", "Could not reach Nexus.", "error"); 
    } finally { setAiThinking(false); }
  }

  const onTimeChange = (event, selectedDate) => {
    if (event.type === 'dismissed') { setShowTimePicker(false); return; }
    if (Platform.OS === 'android') { setShowTimePicker(false); if (event.type === 'set' && selectedDate) { setAlarmTime(selectedDate); scheduleNotification(selectedDate); } } 
    else { if (selectedDate) setAlarmTime(selectedDate); }
  };

  // --- RENDER ---
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
        
      <View style={styles.headerContainer}>
        <View>
            <Text style={styles.title}>N E X U S</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap: 8, marginTop: 8}}>
                <View style={[styles.modeIndicator, {backgroundColor: currentMode.color}]} />
                <Text style={[styles.subtitle, { color: currentMode.color }]}>{currentMode.label.toUpperCase()} // PROTOCOL</Text>
            </View>
            <Text style={styles.modeDesc}>{currentMode.desc}</Text>
        </View>
        
        <View style={styles.iconsRow}>
             <TouchableOpacity onPress={() => router.push('/settings')} style={{padding: 5}}>
                <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{padding: 5}}>
                <Ionicons name="alarm-outline" size={24} color={currentMode.color} style={{opacity: 0.8}} />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerContainer}>
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
                     aiThinking ? <Ionicons name="hardware-chip-outline" size={36} color={currentMode.color} /> : 
                     <Ionicons name="aperture-outline" size={36} color={currentMode.color} style={{opacity: 0.6}} />
                    }
                </View>
            </LinearGradient>
        </Animated.View>
        
        <Text style={styles.statusText}>
          {aiThinking ? "PROCESSING DATA STREAM..." : 
           aiSpeaking ? "TRANSMITTING..." : 
           isRecording ? (recordingModeRef.current === 'journal' ? "ARCHIVING MEMORY..." : "LISTENING...") : 
           "HOLD MIC TO SPEAK • TAP DOTS TO SHIFT"}
        </Text>
        
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

      <View style={styles.bottomControls}>
          {!aiSpeaking && (
              <TouchableOpacity 
                style={[styles.controlCircleSmall, { borderColor: '#F59E0B', opacity: isRecording ? 0.3 : 1 }]} 
                onPress={triggerFlashReset} 
                disabled={isRecording}
              >
                  <Ionicons name="flash-outline" size={20} color="#F59E0B" />
                  <Text style={[styles.controlText, {color: '#F59E0B'}]}>RESET</Text>
              </TouchableOpacity>
          )}

          {!aiSpeaking && (
            <TouchableOpacity 
                style={[
                    styles.controlCircleLarge, 
                    { borderColor: isRecording && recordingModeRef.current !== 'journal' ? '#EF4444' : "#38BDF8" },
                    isRecording && recordingModeRef.current === 'journal' && { opacity: 0.2 } 
                ]} 
                onPressIn={() => !isRecording && startRecording(null)} 
                onPressOut={() => recordingModeRef.current !== 'journal' && stopRecording()}
                disabled={isRecording && recordingModeRef.current === 'journal'}
            >
                <Ionicons name={isRecording && recordingModeRef.current !== 'journal' ? "mic" : "mic-outline"} size={36} color={isRecording && recordingModeRef.current !== 'journal' ? "#EF4444" : "#38BDF8"} />
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

      {/* MODALES */}
      {showTimePicker && Platform.OS === 'android' && (<DateTimePicker value={alarmTime} mode="time" display="default" onChange={onTimeChange} />)}
      {showTimePicker && Platform.OS === 'ios' && (
        <View style={styles.pickerOverlay}>
            <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>MORNING BRIEFING</Text>
                <DateTimePicker value={alarmTime} mode="time" display="spinner" onChange={onTimeChange} textColor="white" themeVariant="dark" />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => { scheduleNotification(alarmTime); setShowTimePicker(false); }}><Text style={styles.confirmText}>INITIALIZE</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTimePicker(false)}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
            </View>
        </View>
      )}

      <Modal visible={alertVisible} transparent={true} animationType="fade" onRequestClose={() => setAlertVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.cyberAlertBox, { borderColor: alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B' }]}>
                  <Ionicons name={alertConfig.type === 'success' ? 'checkmark-done' : alertConfig.type === 'error' ? 'warning' : 'alert-circle'} size={32} color={alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B'} />
                  <Text style={[styles.alertTitle, { color: alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B' }]}>{alertConfig.title.toUpperCase()}</Text>
                  <Text style={styles.alertBody}>{alertConfig.body}</Text>
                  <TouchableOpacity style={styles.alertBtn} onPress={() => setAlertVisible(false)}><Text style={styles.alertBtnText}>ACKNOWLEDGE</Text></TouchableOpacity>
              </View>
          </View>
      </Modal>

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
                
                {/* BOTÓN DESCARGAR/COMPARTIR (RESTAURADO CON LEGACY) */}
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
                    <Text style={[styles.alertBtnText, {color: '#38BDF8'}]}>{isPublishing ? "TRANSMITTING..." : "OFFER TO NETWORK"}</Text>
                  </TouchableOpacity>
                </View>
            </View>
          </View>
        </View>
      </Modal>

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
  pickerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  pickerBox: { width: 300, backgroundColor: '#09090b', borderRadius: 0, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pickerTitle: { color: 'white', fontSize: 12, fontWeight: 'bold', marginBottom: 20, letterSpacing: 2 },
  confirmBtn: { marginTop: 20, backgroundColor: '#38BDF8', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 0 },
  confirmText: { color: '#000', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  cancelBtn: { marginTop: 15, padding: 10 },
  cancelText: { color: '#64748B', fontSize: 10, letterSpacing: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
  cyberAlertBox: { width: 320, backgroundColor: '#09090b', padding: 30, borderRadius: 0, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.8, shadowRadius: 30 },
  alertTitle: { fontSize: 14, fontWeight: '900', marginTop: 15, letterSpacing: 2, color: 'white' },
  alertBody: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 25, lineHeight: 18 },
  alertBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 0, borderWidth: 1, borderColor: '#334155' },
  alertBtnText: { color: 'white', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  alertBtnGhost: { paddingVertical: 12, paddingHorizontal: 30 },
  alertBtnTextGhost: { color: '#64748B', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }
});
