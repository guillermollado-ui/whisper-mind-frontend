/**
 * (tabs)/network.tsx — COMPACT & ALIGNED
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
  Animated, Easing, Pressable, ActivityIndicator, StatusBar,
  Dimensions // ✅ Para asegurar proporciones
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { API_URL, apiFetch } from '../../utils/api'; 
import { useAlert } from '../../src/context/AlertContext';

const { width, height } = Dimensions.get('window');
// Ajuste dinámico: Si la pantalla es pequeña, reducimos la imagen
const IMAGE_SIZE = height < 700 ? 200 : 220; 

// 1️⃣ PULSO COLECTIVO
const PULSE_PHRASES = [
  "A wave of release is moving through the field",
  "Tonight, grief and relief coexist",
  "Many are letting go right now",
  "The silence is deepening",
  "A shared frequency of courage is rising",
  "You are woven into this moment",
  "The field is holding space for change"
];

// 4️⃣ FRASES DE CIERRE RITUAL
const CLOSING_PHRASES = [
  "Resonance received.",
  "Thank you for holding the field.",
  "What you felt mattered.",
  "The collective acknowledges you.",
  "Your presence is felt.",
  "Balance restored."
];

const MAX_SESSION_RESONANCES = 7;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop';

export default function NetworkScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [feed, setFeed] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DEL RITUAL
  const [headerPulse, setHeaderPulse] = useState(PULSE_PHRASES[0]);
  const [closingPhrase, setClosingPhrase] = useState(CLOSING_PHRASES[0]);
  const [sessionCount, setSessionCount] = useState(0); 
  const [isResting, setIsResting] = useState(false);    

  // INTERACCIÓN
  const [isHolding, setIsHolding] = useState(false);
  const [resonanceComplete, setResonanceComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // ANIMACIONES
  const holdAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const textFadeAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(0)).current; 

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
      setSessionCount(0);
      setIsResting(false);
      
      const interval = setInterval(rotateHeader, 20000); 
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 0.3, duration: 4000, useNativeDriver: true })
        ])
      ).start();

      return () => clearInterval(interval);
    }, [])
  );

  const rotateHeader = () => {
    Animated.sequence([
      Animated.timing(textFadeAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      Animated.timing(textFadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ]).start();
    
    setTimeout(() => {
      setHeaderPulse(PULSE_PHRASES[Math.floor(Math.random() * PULSE_PHRASES.length)]);
    }, 1500);
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/vibrations/network'); 
      
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            setFeed(data);
            animateCardEntry();
        } else {
            setFeed([]); 
        }
      }
    } catch (e) {
      console.log("❌ CRITICAL NETWORK ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const animateCardEntry = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp)
    }).start();
  };

  const getAtmosphereColors = (tag: string) => {
    const t = tag?.toLowerCase() || "";
    if (t.includes("joy") || t.includes("hope") || t.includes("light")) return ['rgba(245, 158, 11, 0.4)', '#000000']; 
    if (t.includes("grief") || t.includes("sad") || t.includes("rain")) return ['rgba(30, 58, 138, 0.5)', '#000000']; 
    if (t.includes("anger") || t.includes("fire")) return ['rgba(185, 28, 28, 0.4)', '#000000']; 
    if (t.includes("calm") || t.includes("peace")) return ['rgba(20, 184, 166, 0.4)', '#000000']; 
    return ['rgba(0,0,0,0.6)', '#000000']; 
  };

  const handlePressIn = () => {
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease)
    }).start(({ finished }) => {
      if (finished) {
        triggerResonance();
      }
    });
  };

  const handlePressOut = () => {
    if (!resonanceComplete) {
      setIsHolding(false);
      Animated.timing(holdAnim, { toValue: 0, duration: 500, useNativeDriver: false }).start();
    }
  };

  const triggerResonance = async () => {
    setResonanceComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setClosingPhrase(CLOSING_PHRASES[Math.floor(Math.random() * CLOSING_PHRASES.length)]);
    setShowConfirmation(true);

    const currentItem = feed[currentIndex];
    if (currentItem) {
      try {
          await apiFetch('/vibrations/react', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vibration_id: currentItem._id, reaction_type: 'resonate' })
          });
      } catch(e) {}
    }

    const newCount = sessionCount + 1;
    setSessionCount(newCount);

    setTimeout(() => {
        if (newCount >= MAX_SESSION_RESONANCES) {
            endSession();
        } else {
            nextCard();
        }
    }, 3500);
  };

  const endSession = () => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start(() => {
           setIsResting(true);
           fadeAnim.setValue(0);
           Animated.timing(fadeAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start();
      });
  };

  const nextCard = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start(() => {
      if (currentIndex < feed.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0); 
      }
      setResonanceComplete(false);
      setIsHolding(false);
      setShowConfirmation(false);
      holdAnim.setValue(0);
      animateCardEntry();
    });
  };

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: '50%'}} />
    </View>
  );

  const currentItem = feed && feed.length > 0 ? feed[currentIndex] : null;

  if (isResting) return (
      <View style={styles.container}>
          <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
          <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: fadeAnim, padding: 30 }}>
              <Ionicons name="leaf-outline" size={50} color="#38BDF8" style={{ marginBottom: 20, opacity: 0.8 }} />
              <Text style={styles.restTitle}>The field rests now.</Text>
              <Text style={styles.restSub}>You have given enough.</Text>
              <Text style={[styles.restSub, { marginTop: 10 }]}>Return when you feel called.</Text>
              
              <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.returnBtn}>
                <Text style={styles.returnText}>RETURN TO NEXUS</Text>
              </TouchableOpacity>
          </Animated.View>
      </View>
  );

  if (!currentItem) return (
    <View style={styles.container}>
      <Text style={styles.emptyTitle}>The collective is quiet.</Text>
      <Text style={[styles.emptyTitle, {fontSize: 12, marginTop: 10, opacity: 0.5}]}>Be the first to resonate.</Text>
      <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.returnBtn}><Text style={styles.returnText}>RETURN</Text></TouchableOpacity>
    </View>
  );

  const buttonScale = holdAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const buttonBorderWidth = holdAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 6] });
  const buttonBorderColor = holdAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.2)', 'rgba(56, 189, 248, 0.5)'] });
  
  let safeImageUrl = currentItem.image_url;
  if (!safeImageUrl) safeImageUrl = FALLBACK_IMAGE;
  else if (!safeImageUrl.startsWith('http') && !safeImageUrl.startsWith('data:')) safeImageUrl = FALLBACK_IMAGE;

  const displayText = currentItem.echo || currentItem.echo_text || 'Silence...';
  const displayTag = currentItem.vibration_tag || 'ESSENCE';
  const gradientColors = getAtmosphereColors(displayTag);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={{ uri: safeImageUrl }} 
        style={StyleSheet.absoluteFill}
        blurRadius={40} 
      >
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

        {/* 🚨 SIN SCROLL: USAMOS VIEW Y FLEXBOX PARA DISTRIBUIR */}
        <View style={styles.contentWrapper}>
          
          {/* 1. Header Fijo Arriba */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>COLLECTIVE FREQUENCY</Text>
            <Animated.Text style={[styles.headerSub, { opacity: textFadeAnim }]}>
              {headerPulse}
            </Animated.Text>
          </View>

          {/* 2. Contenido Central (Imagen + Texto) - Usamos Flex para centrarlo */}
          <Animated.View style={[styles.cardContent, { opacity: fadeAnim }]}>
            
            {/* Imagen contenida */}
            <View style={styles.imageFrame}>
              <ImageBackground source={{ uri: safeImageUrl }} style={styles.innerImage} imageStyle={{ borderRadius: 2 }} />
            </View>

            {/* Texto debajo, sin margins gigantes */}
            <Text style={styles.echoText} numberOfLines={3}>“{displayText}”</Text>
            
            <View style={styles.metadataBadge}>
              <Text style={styles.metadataText}>{displayTag.toUpperCase()}</Text>
            </View>
          </Animated.View>

          {/* 3. Zona Ritual (Botón) - Pegada abajo pero con espacio */}
          <View style={styles.ritualZone}>
            {showConfirmation ? (
              <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <Ionicons name="radio-button-on" size={40} color="#38BDF8" style={{ marginBottom: 15, opacity: 0.8 }} />
                <Text style={styles.confirmationText}>{closingPhrase}</Text>
                <Text style={styles.shiftingText}>The field is shifting...</Text>
              </Animated.View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                  <Animated.Text style={[styles.breathText, { opacity: breathAnim }]}>
                      Take one breath before you resonate
                  </Animated.Text>

                  <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  style={styles.touchArea}
                  >
                  <Animated.View style={[
                      styles.resonateBtn,
                      {
                      transform: [{ scale: buttonScale }],
                      borderWidth: buttonBorderWidth,
                      borderColor: buttonBorderColor,
                      }
                  ]}>
                      <Ionicons name="finger-print" size={36} color={isHolding ? "#38BDF8" : "rgba(255,255,255,0.4)"} />
                  </Animated.View>
                  </Pressable>

                  <Text style={styles.holdText}>HOLD TO OFFER</Text>
              </View>
            )}
          </View>

          {/* 4. Footer discreto */}
          <View style={styles.footer}>
             <TouchableOpacity onPress={() => router.push('/(tabs)')} hitSlop={20}>
                <Text style={styles.footerLink}>Return to Nexus</Text>
             </TouchableOpacity>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // ✅ WRAPPER PRINCIPAL QUE ORGANIZA TODO VERTICALMENTE
  contentWrapper: { 
    flex: 1, 
    justifyContent: 'space-between', // Distribuye: Header arriba, Card centro, Botón abajo
    paddingVertical: 40 
  },

  header: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 4, opacity: 0.7 },
  headerSub: { color: '#38BDF8', fontSize: 10, letterSpacing: 1, marginTop: 8, fontStyle: 'italic', opacity: 0.9, textAlign: 'center' },

  // ✅ CONTENIDO CENTRAL: Ocupa el espacio disponible y centra sus hijos
  cardContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  
  imageFrame: { 
    width: IMAGE_SIZE, height: IMAGE_SIZE, // Tamaño dinámico seguro
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
    padding: 10, 
    marginBottom: 25, // ✅ MARGEN REDUCIDO (antes era 50)
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  innerImage: { flex: 1, width: '100%', height: '100%', opacity: 0.9 },
  
  echoText: { 
    color: 'white', fontSize: 18, fontWeight: '300', // Un poco más pequeño para prevenir overflow
    fontStyle: 'italic', textAlign: 'center', lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,1)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10,
    maxWidth: '90%'
  },
  
  metadataBadge: { marginTop: 15, opacity: 0.7 }, // Margen reducido
  metadataText: { color: '#94A3B8', fontSize: 10, letterSpacing: 3, fontWeight: 'bold' },

  // ✅ ZONA RITUAL: Altura automática, no fija
  ritualZone: { alignItems: 'center', marginBottom: 10 },
  touchArea: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80, marginTop: 5 },
  
  breathText: { color: '#64748B', fontSize: 9, letterSpacing: 1, marginBottom: 10, fontStyle: 'italic' },
  
  resonateBtn: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  holdText: { color: '#475569', fontSize: 8, letterSpacing: 3, fontWeight: 'bold', marginTop: 10 },
  
  confirmationText: { color: '#38BDF8', fontSize: 14, letterSpacing: 1, fontWeight: 'bold', fontStyle: 'italic' },
  shiftingText: { color: '#64748B', fontSize: 10, marginTop: 10 },

  restTitle: { color: 'white', fontSize: 24, fontWeight: '300', letterSpacing: 2, marginBottom: 10 },
  restSub: { color: '#94A3B8', fontSize: 14, letterSpacing: 1, fontStyle: 'italic' },
  emptyTitle: { color: 'white', fontSize: 16, textAlign: 'center', marginTop: '50%' },
  returnBtn: { marginTop: 40, padding: 15, alignSelf: 'center', borderWidth: 1, borderColor: '#334155', borderRadius: 30 },
  returnText: { color: '#94A3B8', letterSpacing: 2, fontSize: 10, fontWeight: 'bold' },

  footer: { alignItems: 'center', marginBottom: 10 }, // Pegado abajo
  footerLink: { color: 'white', fontSize: 10, letterSpacing: 1, opacity: 0.3 },
});