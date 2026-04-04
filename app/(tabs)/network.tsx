/**
 * (tabs)/network.tsx — TRANSLATED & ALIGNED & UPGRADED (V2 RESONANCE)
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
 View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
 Animated, Easing, Pressable, ActivityIndicator, StatusBar,
 Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { API_URL, apiFetch } from '../../utils/api'; 
import { useAlert } from '../../src/context/AlertContext';
// 🌍 IMPORTACIÓN DEL MOTOR DE IDIOMAS
import { useLanguage } from '../../src/context/LanguageContext';
// ✅ [NUEVO] Importamos la Guía de Iniciación
import InitiationOverlay from '../../components/InitiationOverlay';

const { width, height } = Dimensions.get('window');
const IMAGE_SIZE = height < 700 ? 200 : 220; 

const MAX_SESSION_RESONANCES = 7;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop';

// ✅ [NUEVO] NIVELES DE RESONANCIA
const LEVELS = {
 SEE: { id: 'see', time: 500, label: 'Te veo', color: '#ffffff' },
 RESONATE: { id: 'resonate', time: 1500, label: 'Resueno', color: '#10B981' },
 HOLD: { id: 'hold', time: 3000, label: 'Te sostengo', color: '#F59E0B' },
};

export default function NetworkScreen() {
 const router = useRouter();
 const { showAlert } = useAlert();
 const { t, language } = useLanguage(); // 🌍 Usamos el hook de idioma

 const [feed, setFeed] = useState<any[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [loading, setLoading] = useState(true);
   
 // ESTADOS DEL RITUAL
 const [headerPulse, setHeaderPulse] = useState(t('network.pulse_phrases')[0]);
 const [closingPhrase, setClosingPhrase] = useState(t('network.closing_phrases')[0]);
 const [sessionCount, setSessionCount] = useState(0); 
 const [isResting, setIsResting] = useState(false);      

 // INTERACCIÓN
 const [isHolding, setIsHolding] = useState(false);
 const [resonanceComplete, setResonanceComplete] = useState(false);
 const [showConfirmation, setShowConfirmation] = useState(false);
 const [feedbackText, setFeedbackText] = useState(''); // ✅ [NUEVO] Feedback en tiempo real

 // ANIMACIONES
 const holdAnim = useRef(new Animated.Value(0)).current;
 const fadeAnim = useRef(new Animated.Value(0)).current; 
 const textFadeAnim = useRef(new Animated.Value(1)).current;
 const breathAnim = useRef(new Animated.Value(0)).current; 
  
 // ✅ [NUEVO] Referencias para el cronómetro
 const pressStartTime = useRef(0);
 const timerRef = useRef<NodeJS.Timeout | null>(null);

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

     return () => {
       clearInterval(interval);
       if (timerRef.current) clearInterval(timerRef.current);
     };
   }, [t])
 );

 const rotateHeader = () => {
   Animated.sequence([
     Animated.timing(textFadeAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
     Animated.timing(textFadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
   ]).start();
   
   setTimeout(() => {
     const phrases = t('network.pulse_phrases') as unknown as string[];
     setHeaderPulse(phrases[Math.floor(Math.random() * phrases.length)]);
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
   const tagLower = tag?.toLowerCase() || "";
   if (tagLower.includes("joy") || tagLower.includes("hope") || tagLower.includes("light") || tagLower.includes("alegría") || tagLower.includes("esperanza")) return ['rgba(245, 158, 11, 0.4)', '#000000']; 
   if (tagLower.includes("grief") || tagLower.includes("sad") || tagLower.includes("rain") || tagLower.includes("duelo") || tagLower.includes("triste")) return ['rgba(30, 58, 138, 0.5)', '#000000']; 
   if (tagLower.includes("anger") || tagLower.includes("fire") || tagLower.includes("ira") || tagLower.includes("fuego")) return ['rgba(185, 28, 28, 0.4)', '#000000']; 
   if (tagLower.includes("calm") || tagLower.includes("peace") || tagLower.includes("calma") || tagLower.includes("paz")) return ['rgba(20, 184, 166, 0.4)', '#000000']; 
   return ['rgba(0,0,0,0.6)', '#000000']; 
 };

 // ✅ [MODIFICADO] Lógica de Presión Inteligente
 const handlePressIn = () => {
   setIsHolding(true);
   setFeedbackText('...'); 
   pressStartTime.current = Date.now();
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

   // Animación visual (Círculo creciendo)
   Animated.timing(holdAnim, {
     toValue: 1,
     duration: 3500, // Un poco más que el nivel HOLD
     useNativeDriver: false,
     easing: Easing.inOut(Easing.ease)
   }).start();

   // Cronómetro para feedback en tiempo real
   timerRef.current = setInterval(() => {
       const duration = Date.now() - pressStartTime.current;
       
       // Feedback táctil y visual al cruzar umbrales
       if (duration > LEVELS.HOLD.time && feedbackText !== LEVELS.HOLD.label) {
           setFeedbackText(LEVELS.HOLD.label);
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
           clearInterval(timerRef.current!); // Ya llegamos al máximo
       } else if (duration > LEVELS.RESONATE.time && duration < LEVELS.HOLD.time && feedbackText !== LEVELS.RESONATE.label) {
           setFeedbackText(LEVELS.RESONATE.label);
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
       } else if (duration > LEVELS.SEE.time && duration < LEVELS.RESONATE.time && feedbackText !== LEVELS.SEE.label) {
           setFeedbackText(LEVELS.SEE.label);
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       }
   }, 100);
 };

 // ✅ [MODIFICADO] Lógica al soltar
 const handlePressOut = () => {
   if (timerRef.current) clearInterval(timerRef.current);
   
   const duration = Date.now() - pressStartTime.current;
   setIsHolding(false);
   
   // Decidir qué nivel se alcanzó
   let selectedLevel = null;
   if (duration >= LEVELS.HOLD.time) selectedLevel = LEVELS.HOLD;
   else if (duration >= LEVELS.RESONATE.time) selectedLevel = LEVELS.RESONATE;
   else if (duration >= LEVELS.SEE.time) selectedLevel = LEVELS.SEE;

   if (selectedLevel && !resonanceComplete) {
       // Si superó el mínimo (0.5s), disparamos la resonancia
       triggerResonance(selectedLevel);
   } else {
       // Si fue un toque demasiado rápido, cancelamos animación
       Animated.timing(holdAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
       setFeedbackText('');
   }
 };

 // ✅ [MODIFICADO] Envío al Backend Nuevo
 const triggerResonance = async (levelObj: any) => {
   setResonanceComplete(true);
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   
   const phrases = t('network.closing_phrases') as unknown as string[];
   // Personalizamos el mensaje final según el nivel
   let finalMsg = phrases[Math.floor(Math.random() * phrases.length)];
   if (levelObj.id === 'hold') finalMsg = language === 'es' ? "Has sostenido su alma." : "You held their soul.";
   
   setClosingPhrase(finalMsg);
   setShowConfirmation(true);

   const currentItem = feed[currentIndex];
   if (currentItem) {
     try {
         // 1. Llamada al sistema ANTIGUO (para compatibilidad)
         apiFetch('/vibrations/react', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ vibration_id: currentItem._id, reaction_type: 'resonate' })
         });

         // 2. ✅ Llamada al sistema NUEVO (Latidos V2)
         apiFetch('/api/resonance', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ vibration_id: currentItem._id, level: levelObj.id })
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
     setFeedbackText('');
     holdAnim.setValue(0);
     animateCardEntry();
   });
 };

 if (loading) return (
   <View style={styles.container}>
     <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: '50%'}} />
   </View>
 );

 if (isResting) return (
     <View style={styles.container}>
         <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
         <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: fadeAnim, padding: 30 }}>
             <Ionicons name="leaf-outline" size={50} color="#38BDF8" style={{ marginBottom: 20, opacity: 0.8 }} />
             <Text style={styles.restTitle}>{t('network.resting.title')}</Text>
             <Text style={styles.restSub}>{t('network.resting.sub1')}</Text>
             <Text style={[styles.restSub, { marginTop: 10 }]}>{t('network.resting.sub2')}</Text>
             
             <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.returnBtn}>
               <Text style={styles.returnText}>{t('network.resting.btn')}</Text>
             </TouchableOpacity>
         </Animated.View>
     </View>
 );

 const currentItem = feed && feed.length > 0 ? feed[currentIndex] : null;

 if (!currentItem) return (
   <View style={styles.container}>
     <Text style={styles.emptyTitle}>{t('network.empty.title')}</Text>
     <Text style={[styles.emptyTitle, {fontSize: 12, marginTop: 10, opacity: 0.5}]}>{t('network.empty.sub')}</Text>
     <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.returnBtn}>
       <Text style={styles.returnText}>{t('network.empty.btn')}</Text>
     </TouchableOpacity>
   </View>
 );

 const buttonScale = holdAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
 const buttonBorderWidth = holdAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 6] });
 const buttonBorderColor = holdAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.2)', 'rgba(56, 189, 248, 0.5)'] });
 
 let safeImageUrl = currentItem.image_url;
 if (!safeImageUrl) safeImageUrl = FALLBACK_IMAGE;
 else if (!safeImageUrl.startsWith('http') && !safeImageUrl.startsWith('data:')) safeImageUrl = FALLBACK_IMAGE;

 const displayText = currentItem.echo || currentItem.echo_text || t('network.fallback_echo');
 const displayTag = currentItem.vibration_tag || t('network.default_tag');
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

       <View style={styles.contentWrapper}>
         
         {/* 1. Header */}
         <View style={styles.header}>
           <Text style={styles.headerTitle}>{t('network.title')}</Text>
           <Animated.Text style={[styles.headerSub, { opacity: textFadeAnim }]}>
             {headerPulse}
           </Animated.Text>
         </View>

         {/* 2. Contenido Central */}
         <Animated.View style={[styles.cardContent, { opacity: fadeAnim }]}>
           <View style={styles.imageFrame}>
             <ImageBackground source={{ uri: safeImageUrl }} style={styles.innerImage} imageStyle={{ borderRadius: 2 }} />
           </View>

           <Text style={styles.echoText} numberOfLines={3}>“{displayText}”</Text>
           
           <View style={styles.metadataBadge}>
             <Text style={styles.metadataText}>{displayTag.toUpperCase()}</Text>
           </View>
         </Animated.View>

         {/* 3. Zona Ritual */}
         <View style={styles.ritualZone}>
           {showConfirmation ? (
             <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
               <Ionicons name="radio-button-on" size={40} color="#38BDF8" style={{ marginBottom: 15, opacity: 0.8 }} />
               <Text style={styles.confirmationText}>{closingPhrase}</Text>
               <Text style={styles.shiftingText}>{t('network.ritual.shifting')}</Text>
             </Animated.View>
           ) : (
             <View style={{ alignItems: 'center' }}>
                 {/* Feedback Text: Muestra "Te veo" / "Resueno" / "Te sostengo" */}
                 <Animated.Text style={[styles.breathText, { opacity: isHolding ? 1 : breathAnim, color: isHolding ? '#38BDF8' : '#64748B', fontWeight: isHolding ? 'bold' : 'normal' }]}>
                     {isHolding ? (feedbackText || "...") : t('network.ritual.breath')}
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

                 <Text style={styles.holdText}>{t('network.ritual.hold')}</Text>
             </View>
           )}
         </View>

         {/* 4. Footer */}
         <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} hitSlop={20}>
               <Text style={styles.footerLink}>{t('network.ritual.return_nexus')}</Text>
            </TouchableOpacity>
         </View>

       </View>
     </ImageBackground>

     {/* ✅ [NUEVO] Guía de Iniciación para el NETWORK */}
     <InitiationOverlay 
       screenName="network" 
       steps={language === 'es' ? [
         { icon: "infinite", title: "Conexión Anónima", desc: "Un río de pensamientos humanos filtrados por Alice. Sin nombres, solo esencia." },
         { icon: "finger-print", title: "Resonar", desc: "Mantén pulsado para sentir: Toque corto (Te veo), Medio (Resueno), Largo (Te sostengo)." }
       ] : [
         { icon: "infinite", title: "Anonymous Connection", desc: "A river of human thoughts filtered by Alice. No names, just essence." },
         { icon: "finger-print", title: "Resonate", desc: "Hold to feel: Short tap (I see you), Medium (I resonate), Long (I hold you)." }
       ]} 
     />
   </View>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#000' },
 contentWrapper: { 
   flex: 1, 
   justifyContent: 'space-between', 
   paddingVertical: 40 
 },
 header: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
 headerTitle: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 4, opacity: 0.7 },
 headerSub: { color: '#38BDF8', fontSize: 10, letterSpacing: 1, marginTop: 8, fontStyle: 'italic', opacity: 0.9, textAlign: 'center' },
 cardContent: { 
   flex: 1, 
   justifyContent: 'center', 
   alignItems: 'center', 
   paddingHorizontal: 20 
 },
 imageFrame: { 
   width: IMAGE_SIZE, height: IMAGE_SIZE, 
   borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
   padding: 10, 
   marginBottom: 25, 
   backgroundColor: 'rgba(0,0,0,0.2)'
 },
 innerImage: { flex: 1, width: '100%', height: '100%', opacity: 0.9 },
 echoText: { 
   color: 'white', fontSize: 18, fontWeight: '300', 
   fontStyle: 'italic', textAlign: 'center', lineHeight: 26,
   textShadowColor: 'rgba(0,0,0,1)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10,
   maxWidth: '90%'
 },
 metadataBadge: { marginTop: 15, opacity: 0.7 },
 metadataText: { color: '#94A3B8', fontSize: 10, letterSpacing: 3, fontWeight: 'bold' },
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
 footer: { alignItems: 'center', marginBottom: 10 },
 footerLink: { color: 'white', fontSize: 10, letterSpacing: 1, opacity: 0.3 },
});