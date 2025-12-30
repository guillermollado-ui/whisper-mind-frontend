import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Modal, Platform } from 'react-native'; // ⚠️ BORRADO 'Alert' para evitar errores
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// ⚠️ URL DE RENDER
const API_URL = 'https://wishpermind-backend.onrender.com';
const SESSION_ID = 'user-premium-1';

// 🔊 SONIDO PENSANDO
const THINKING_SOUND_B64 = `data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG1xISIYkYkXYIPT+2J0EDl+CwKD74V4E4CiCdZ94AA+e4AADtKd//+67Wteqa9//tu+pTtH/s9ufnyzvnT48Y2enxrGlxXVwcjqVuyVKi4JDOepFir//uQRAAAAVWMFUBiAAArYYKQDIAAAydVoYGIACtDqvDIwAAAiE4z/6oVE2urcTE7lzqkcOAUBsQSg5xdxIx4YAoMZRJ5wQIEMITaTkqhuOqgsoPZfwFQPqQSjlhSx8/znYrcv/z4PH99989////533//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG1xISIYkYkXYIPT+2J0EDl+CwKD74V4E4CiCdZ94AA+e4AADtKd//+67Wteqa9//tu+pTtH/s9ufnyzvnT48Y2enxrGlxXVwcjqVuyVKi4JDOepFir//uQRAAAAVWMFUBiAAArYYKQDIAAAydVoYGIACtDqvDIwAAAiE4z/6oVE2urcTE7lzqkcOAUBsQSg5xdxIx4YAoMZRJ5wQIEMITaTkqhuOqgsoPZfwFQPqQSjlhSx8/znYrcv/z4PH99989////533`;

const MODES = [
  { id: 'default', label: 'Therapist', color: '#38BDF8', desc: 'Open dialogue. Vent freely & safely.' }, 
  { id: 'calm', label: 'Anxiety', color: '#10B981', desc: 'Panic relief & grounding exercises.' }, 
  { id: 'sleep', label: 'Sleep', color: '#8B5CF6', desc: 'Hypnotic stories to help you drift off.' }, 
  { id: 'win', label: 'Coach', color: '#F59E0B', desc: 'Motivation, goal setting & strategy.' }, 
  { id: 'dream', label: 'Dream', color: '#6366F1', desc: 'Interpretation + Generates Art in Vault.' }, 
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState(MODES[0]); 
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmTime, setAlarmTime] = useState(new Date());

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', body: '', type: 'success' });
  
  // 🔴 ESTADO DEL MODAL DE LOGOUT
  const [logoutVisible, setLogoutVisible] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const thinkingSoundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current; 

  // --- AUDIO SETUP ---
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true });
        const { sound } = await Audio.Sound.createAsync({ uri: THINKING_SOUND_B64 }, { shouldPlay: false, volume: 1.0 });
        thinkingSoundRef.current = sound;
      } catch (error) { console.log(error); }
    }
    setupAudio();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => triggerMorningProtocol());
    return () => sub.remove();
  }, []);

  useFocusEffect(useCallback(() => { return () => stopSpeaking(); }, []));

  const stopSpeaking = async () => {
    if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); soundRef.current = null; }
    setAiSpeaking(false);
  };

  // 🔴 1. FUNCIÓN QUE ABRE EL MODAL (NO USA ALERT)
  const handleLogoutPress = () => {
      setLogoutVisible(true); 
  };

  // 🔴 2. FUNCIÓN QUE EJECUTA LA DESCONEXIÓN
  const confirmLogout = async () => {
      setLogoutVisible(false); // Cierra el modal
      if (aiSpeaking) await stopSpeaking();
      await SecureStore.deleteItemAsync('user_token');
      router.replace('/login');
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

  const triggerMorningProtocol = async () => {
    setAiThinking(true);
    try {
      const res = await fetch(`${API_URL}/chat/morning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: "WAKE UP", mode: "morning", session_id: SESSION_ID }) });
      const data = await res.json();
      if (data.audio) await playResponse(data.audio);
    } catch (e) { showCyberAlert("Error", "Offline", "error"); } finally { setAiThinking(false); }
  };

  // 😶 FEATURE: SILENT CHECK-IN
  const triggerSilentCheckIn = async () => {
      if (aiSpeaking) await stopSpeaking();
      setAiThinking(true);
      showCyberAlert("Just Be Mode", "Generating comfort field...", "success");

      try {
          const res = await fetch(`${API_URL}/chat/morning`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ 
                  text: "I don't want to talk right now. I just need support.", 
                  mode: "silent_comfort", 
                  session_id: SESSION_ID 
              }) 
          });
          const data = await res.json();
          if (data.audio) await playResponse(data.audio);
      } catch (e) { 
          showCyberAlert("Connection Error", "Check internet.", "error"); 
      } finally { 
          setAiThinking(false); 
      }
  };

  const scheduleNotification = async (date: Date) => {
      try {
        if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') await Notifications.requestPermissionsAsync();
        }
        await Notifications.cancelAllScheduledNotificationsAsync();
        const trigger = new Date(date);
        const now = new Date();
        if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

        await Notifications.scheduleNotificationAsync({
            content: { title: "☀️ Wake Up", body: "Your mind briefing is ready. Tap here.", sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        });
        showCyberAlert("Protocol Activated", `Briefing ready for ${trigger.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, "success");
    } catch (error) { showCyberAlert("System Error", "Could not set alarm protocol.", "error"); } finally { setShowTimePicker(false); }
  };

  async function startRecording() {
    if (aiSpeaking) await stopSpeaking();
    try {
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) { console.error(err); }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    setAiThinking(true); 
    try { if (thinkingSoundRef.current) { await thinkingSoundRef.current.stopAsync(); await thinkingSoundRef.current.setPositionAsync(0); await thinkingSoundRef.current.playAsync(); } } catch (e) {}

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecording(null);
    if (uri) sendAudioToBackend(uri);
  }

  async function sendAudioToBackend(uri: string) {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'voice.m4a', type: 'audio/m4a' } as any);
      formData.append('session_id', SESSION_ID);
      formData.append('mode', currentMode.id); 
      const res = await fetch(`${API_URL}/chat/voice`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.audio) playResponse(data.audio);
    } catch (e) { showCyberAlert("Network Error", "Retry.", "error"); } finally { setAiThinking(false); }
  }

  async function playResponse(base64Audio: string) {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: `data:audio/mp3;base64,${base64Audio}` });
      soundRef.current = sound;
      setAiSpeaking(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => { if (status.isLoaded && status.didJustFinish) setAiSpeaking(false); });
    } catch (e) { console.log(e); }
  }

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') { setShowTimePicker(false); return; }
    if (Platform.OS === 'android') { setShowTimePicker(false); if (event.type === 'set' && selectedDate) { setAlarmTime(selectedDate); scheduleNotification(selectedDate); } } 
    else { if (selectedDate) setAlarmTime(selectedDate); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#000000']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={{flex: 1}}>
            <Text style={styles.title}>NEXUS</Text>
            <Text style={[styles.subtitle, { color: currentMode.color }]}>{currentMode.label.toUpperCase()} MODE</Text>
            <Text style={styles.modeDesc}>{currentMode.desc}</Text>
        </View>

        {/* 🔴 CONTROLES SUPERIORES */}
        <View style={{flexDirection: 'row', gap: 15}}>
             <TouchableOpacity style={styles.alarmBtn} onPress={handleLogoutPress}>
                <Ionicons name="power-outline" size={20} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.alarmBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="alarm-outline" size={24} color="white" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerContainer}>
        <Animated.View style={[styles.orbContainer, { transform: [{ scale: pulseAnim }] }, aiSpeaking && { transform: [{ scale: 1.1 }] }]}>
          <LinearGradient colors={[currentMode.color, 'transparent']} style={styles.orbGradient} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }}>
             <View style={styles.orbCore}>
                {aiSpeaking ? <Waveform color={currentMode.color} /> : 
                 isRecording ? <Ionicons name="mic" size={40} color="#EF4444" /> :
                 aiThinking ? <Ionicons name="hardware-chip-outline" size={40} color={currentMode.color} /> : 
                 <Ionicons name="aperture-outline" size={40} color={currentMode.color} style={{opacity: 0.3}} />
                }
             </View>
          </LinearGradient>
        </Animated.View>
        
        <Text style={styles.statusText}>
          {aiThinking ? "Analysing Consciousness..." : aiSpeaking ? "Listening to Alice..." : isRecording ? "Recording..." : "Touch mic to speak"}
        </Text>
        
        <View style={styles.modeSelector}>
          {MODES.map((m) => (
            <TouchableOpacity key={m.id} onPress={() => setCurrentMode(m)}
              style={[styles.modeDot, { backgroundColor: m.color, opacity: currentMode.id === m.id ? 1 : 0.3, transform: [{ scale: currentMode.id === m.id ? 1.3 : 1 }] }]} />
          ))}
        </View>
      </View>

      {/* --- ZONA DE CONTROLES INFERIOR --- */}
      <View style={styles.bottomControls}>
          {/* 👇 BOTÓN JUST BE */}
          {!aiSpeaking && !isRecording && (
              <TouchableOpacity style={styles.silentBtn} onPress={triggerSilentCheckIn}>
                  <Ionicons name="hand-left-outline" size={20} color="#94A3B8" />
                  <Text style={styles.silentText}>JUST BE</Text>
              </TouchableOpacity>
          )}

          {/* BOTÓN MICRÓFONO */}
          {!aiSpeaking && (
            <TouchableOpacity style={[styles.micButton, isRecording && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]} onPressIn={startRecording} onPressOut={stopRecording}>
                <Ionicons name={isRecording ? "mic" : "mic-outline"} size={32} color="white" />
            </TouchableOpacity>
          )}

           {/* BOTÓN STOP */}
           {aiSpeaking && (
              <TouchableOpacity style={styles.fabStop} onPress={stopSpeaking}>
                <Ionicons name="stop-circle" size={30} color="white" />
                <Text style={styles.fabText}>STOP</Text>
              </TouchableOpacity>
          )}
      </View>

      {/* --- MODALES --- */}

      {/* 1. PICKER DE ALARMA (IGUAL) */}
      {showTimePicker && Platform.OS === 'android' && (<DateTimePicker value={alarmTime} mode="time" display="default" onChange={onTimeChange} />)}
      {showTimePicker && Platform.OS === 'ios' && (
        <View style={styles.pickerOverlay}>
            <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Set Morning Briefing</Text>
                <DateTimePicker value={alarmTime} mode="time" display="spinner" onChange={onTimeChange} textColor="white" themeVariant="dark" />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => { scheduleNotification(alarmTime); setShowTimePicker(false); }}><Text style={styles.confirmText}>ACTIVATE</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTimePicker(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            </View>
        </View>
      )}

      {/* 2. ALERTA CYBER (IGUAL) */}
      <Modal visible={alertVisible} transparent={true} animationType="fade" onRequestClose={() => setAlertVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.cyberAlertBox, { borderColor: alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B' }]}>
                  <Ionicons name={alertConfig.type === 'success' ? 'checkmark-circle' : alertConfig.type === 'error' ? 'alert-circle' : 'warning'} size={50} color={alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B'} />
                  <Text style={[styles.alertTitle, { color: alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B' }]}>{alertConfig.title.toUpperCase()}</Text>
                  <Text style={styles.alertBody}>{alertConfig.body}</Text>
                  <TouchableOpacity style={[styles.alertBtn, { borderColor: alertConfig.type === 'success' ? '#38BDF8' : alertConfig.type === 'error' ? '#EF4444' : '#F59E0B' }]} onPress={() => setAlertVisible(false)}><Text style={styles.alertBtnText}>ACKNOWLEDGE</Text></TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* 🔴 3. MODAL DE LOGOUT (CYBERPUNK - NUEVO) */}
      <Modal visible={logoutVisible} transparent={true} animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.cyberAlertBox, { borderColor: '#EF4444' }]}>
                  <Ionicons name="log-out-outline" size={50} color="#EF4444" />
                  <Text style={[styles.alertTitle, { color: '#EF4444' }]}>SEVER LINK?</Text>
                  <Text style={styles.alertBody}>Are you sure you want to disconnect from the Nexus interface?</Text>
                  
                  <View style={{flexDirection: 'row', gap: 15, marginTop: 10}}>
                      <TouchableOpacity 
                          style={[styles.alertBtn, { borderColor: '#64748B', backgroundColor: 'transparent' }]} 
                          onPress={() => setLogoutVisible(false)}
                      >
                          <Text style={[styles.alertBtnText, { color: '#64748B' }]}>STAY</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                          style={[styles.alertBtn, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} 
                          onPress={confirmLogout}
                      >
                          <Text style={[styles.alertBtnText, { color: '#EF4444' }]}>DISCONNECT</Text>
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
  header: { marginTop: 60, paddingHorizontal: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: 2 },
  subtitle: { fontSize: 12, letterSpacing: 4, fontWeight:'bold' },
  modeDesc: { color: '#64748B', fontSize: 11, marginTop: 5, fontStyle: 'italic', maxWidth: '90%' },
  alarmBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 60 }, 
  orbContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
  orbGradient: { width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  orbCore: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1e293b' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', height: 50, gap: 5 },
  waveBar: { width: 6, height: 30, borderRadius: 3 },
  statusText: { color: '#64748B', marginTop: 30, letterSpacing: 2, fontSize: 10, textTransform: 'uppercase' },
  modeSelector: { flexDirection: 'row', marginTop: 40, gap: 15 },
  modeDot: { width: 12, height: 12, borderRadius: 6 },
  
  // 👇 NUEVA BARRA DE CONTROLES
  bottomControls: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  
  micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  
  // ESTILO BOTÓN SILENT
  silentBtn: { position: 'absolute', left: 40, alignItems: 'center', justifyContent: 'center', padding: 10 },
  silentText: { color: '#64748B', fontSize: 10, marginTop: 5, fontWeight: 'bold' },

  fabStop: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16, letterSpacing: 1 },

  pickerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  pickerBox: { width: 300, backgroundColor: '#1e293b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#38BDF8' },
  pickerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  confirmBtn: { marginTop: 20, backgroundColor: '#38BDF8', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  confirmText: { color: '#0f172a', fontWeight: 'bold' },
  cancelBtn: { marginTop: 15, padding: 10 },
  cancelText: { color: '#64748B' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  cyberAlertBox: { width: 300, backgroundColor: '#0f172a', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  alertTitle: { fontSize: 18, fontWeight: '900', marginTop: 15, letterSpacing: 1 },
  alertBody: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  alertBtn: { backgroundColor: '#1e293b', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, borderWidth: 1 },
  alertBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }
});