import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
// ✅ Importamos el contexto de idioma
import { useLanguage } from '../src/context/LanguageContext';

const { width, height } = Dimensions.get('window');

interface Step {
  icon: string;
  title: string;
  desc: string;
}

interface InitiationOverlayProps {
  screenName: string; // 'nexus', 'vault', 'network', 'insights'
  steps: Step[];
}

export default function InitiationOverlay({ screenName, steps }: InitiationOverlayProps) {
  const { language } = useLanguage(); // ✅ Detectamos el idioma
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const storageKey = `has_seen_guide_${screenName}_v1`;

  useEffect(() => {
    checkVisibility();
  }, []);

  const checkVisibility = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(storageKey);
      if (!hasSeen) {
        setTimeout(() => {
            setVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }).start();
        }, 800);
      }
    } catch (e) { 
        console.error("Error checking guide visibility", e); 
    }
  };

  const handleDismiss = async () => {
    Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
    }).start(async () => {
        setVisible(false);
        await AsyncStorage.setItem(storageKey, 'true');
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
          <View style={styles.headerRow}>
            <Ionicons name="sparkles" size={16} color="#38BDF8" />
            {/* ✅ Título Dinámico */}
            <Text style={styles.header}>
              {language === 'es' ? 'GUÍA DE INICIACIÓN' : 'INITIATION GUIDE'}
            </Text>
          </View>
          
          <View style={styles.divider} />

          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.iconBox}>
                <Ionicons name={step.icon as any} size={22} color="#E0F2FE" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleDismiss}>
            {/* ✅ Botón Dinámico */}
            <Text style={styles.buttonText}>
              {language === 'es' ? 'ENTENDIDO' : 'UNDERSTOOD'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.85)' 
  },
  card: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15
  },
  header: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  stepTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19
  },
  button: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  buttonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2
  }
});