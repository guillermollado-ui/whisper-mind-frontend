import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- DATOS DE PRUEBA (MOCKS) ---
const TRACKS = {
  paisajes: [
    { id: 'p1', title: 'Lluvia sobre metal', desc: 'Ruido Marrón incrustado • 45 min', duration: '45:00' },
    { id: 'p2', title: 'Viento del norte', desc: 'Ruido Rosa sutil • 30 min', duration: '30:00' },
    { id: 'p3', title: 'Olas de medianoche', desc: 'Baja frecuencia • 60 min', duration: '60:00' },
  ],
  frecuencias: [
    { id: 'f1', title: 'Ruido Marrón Puro', desc: 'Enfoque profundo sin distracciones', duration: '∞' },
    { id: 'f2', title: 'Ruido Rosa', desc: 'Aislamiento acústico suave', duration: '∞' },
    { id: 'f3', title: 'Ondas Theta (4.5 Hz)', desc: 'Meditación y relajación', duration: '45:00' },
  ],
  binaurales: [
    { id: 'b1', title: 'Sueño Profundo (Delta 2Hz)', desc: 'Sincronización para insomnio', duration: '60:00', reqHeadphones: true },
    { id: 'b2', title: 'Enfoque Láser (Gamma 40Hz)', desc: 'Claridad mental y estudio', duration: '30:00', reqHeadphones: true },
    { id: 'b3', title: 'Alivio de Ansiedad (Alpha 10Hz)', desc: 'Calma el sistema nervioso', duration: '20:00', reqHeadphones: true },
  ]
};

type Category = 'paisajes' | 'frecuencias' | 'binaurales';

export default function EtherScreen() {
  const [activeTab, setActiveTab] = useState<Category>('paisajes');
  const [activeTrack, setActiveTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Animaciones
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Respiración del orbe central
  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: isPlaying ? 1.2 : 1.05,
          duration: isPlaying ? 2000 : 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: isPlaying ? 2000 : 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [isPlaying]);

  // Transición suave entre pestañas
  const handleTabChange = (tab: Category) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePlayTrack = (track: any) => {
    if (activeTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveTrack(track);
      setIsPlaying(true);
    }
  };

  // Determinar colores basados en la pestaña activa
  const getColors = () => {
    switch (activeTab) {
      case 'paisajes': return { glow: '#064e3b', accent: '#10B981' }; // Esmeralda oscuro
      case 'frecuencias': return { glow: '#451a03', accent: '#F59E0B' }; // Tierra / Ámbar
      case 'binaurales': return { glow: '#312e81', accent: '#6366F1' }; // Índigo profundo
      default: return { glow: '#0f172a', accent: '#38BDF8' };
    }
  };

  const currentColors = getColors();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo y Gradiente Atmosférico */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[currentColors.glow, '#000000', '#000000']}
          style={{ width: '100%', height: '80%' }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Navegador Superior */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ETHER</Text>
        <Text style={styles.headerSubtitle}>SANTUARIO SONORO</Text>
        
        <View style={styles.navBar}>
          {(['paisajes', 'frecuencias', 'binaurales'] as Category[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => handleTabChange(tab)}
              style={styles.navItem}
            >
              <Text style={[
                styles.navText, 
                activeTab === tab && styles.navTextActive
              ]}>
                {tab.toUpperCase()}
              </Text>
              {activeTab === tab && (
                <View style={[styles.navIndicator, { backgroundColor: currentColors.accent }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Centro Visual (Orbe de Frecuencias) */}
      <View style={styles.visualizerContainer}>
        <Animated.View style={[
          styles.orbOuter, 
          { 
            borderColor: currentColors.accent,
            transform: [{ scale: breatheAnim }] 
          }
        ]}>
          <View style={[styles.orbInner, { backgroundColor: currentColors.glow }]}>
            <Ionicons 
              name={activeTab === 'binaurales' ? "headset-outline" : "pulse-outline"} 
              size={32} 
              color={currentColors.accent} 
              style={{ opacity: 0.5 }}
            />
          </View>
        </Animated.View>
      </View>

      {/* Lista de Pistas */}
      <Animated.ScrollView 
        style={[styles.trackList, { opacity: fadeAnim }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'binaurales' && (
          <View style={styles.warningBox}>
            <Ionicons name="headset" size={16} color="#94A3B8" />
            <Text style={styles.warningText}>Requiere auriculares para la sincronización hemisférica.</Text>
          </View>
        )}

        {TRACKS[activeTab].map((track) => {
          const isActive = activeTrack?.id === track.id;
          return (
            <TouchableOpacity 
              key={track.id} 
              style={styles.trackItem}
              onPress={() => handlePlayTrack(track)}
            >
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, isActive && { color: currentColors.accent }]}>
                  {track.title}
                </Text>
                <Text style={styles.trackDesc}>{track.desc}</Text>
              </View>
              
              <View style={styles.trackAction}>
                <Text style={styles.trackDuration}>{track.duration}</Text>
                <Ionicons 
                  name={isActive && isPlaying ? "pause-circle" : "play-circle-outline"} 
                  size={28} 
                  color={isActive ? currentColors.accent : "#64748B"} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {/* Mini-Reproductor Flotante */}
      {activeTrack && (
        <View style={styles.miniPlayer}>
          <LinearGradient
            colors={['#0f172a', '#020617']}
            style={styles.miniPlayerGradient}
          >
            <View style={styles.miniPlayerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniPlayerTitle} numberOfLines={1}>{activeTrack.title}</Text>
                <Text style={styles.miniPlayerDesc}>Transmitiendo frecuencia...</Text>
              </View>
              
              <View style={styles.miniPlayerControls}>
                <TouchableOpacity style={{ padding: 10 }}>
                  <Ionicons name="moon-outline" size={20} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={{ padding: 10 }}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Barra de progreso visual (estática por ahora) */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '30%', backgroundColor: currentColors.accent }]} />
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingTop: Platform.OS === 'android' ? 60 : 20, paddingHorizontal: 25 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: 6 },
  headerSubtitle: { fontSize: 9, letterSpacing: 3, fontWeight:'700', color: '#64748B', marginTop: 4 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  navItem: { paddingVertical: 15, alignItems: 'center', position: 'relative', flex: 1 },
  navText: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  navTextActive: { color: '#fff' },
  navIndicator: { position: 'absolute', bottom: -1, width: '40%', height: 2, borderRadius: 1 },
  visualizerContainer: { height: 200, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  orbOuter: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  orbInner: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  trackList: { flex: 1, paddingHorizontal: 25 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 8, marginBottom: 20 },
  warningText: { color: '#94A3B8', fontSize: 11, fontStyle: 'italic', flex: 1 },
  trackItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(30, 41, 59, 0.5)' },
  trackInfo: { flex: 1, paddingRight: 15 },
  trackTitle: { color: '#E2E8F0', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  trackDesc: { color: '#64748B', fontSize: 11 },
  trackAction: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  trackDuration: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
  miniPlayer: { position: 'absolute', bottom: 20, left: 20, right: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  miniPlayerGradient: { width: '100%' },
  miniPlayerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  miniPlayerTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  miniPlayerDesc: { color: '#38BDF8', fontSize: 9, letterSpacing: 1 },
  miniPlayerControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progressBarBg: { height: 2, backgroundColor: '#1e293b', width: '100%' },
  progressBarFill: { height: '100%' }
});