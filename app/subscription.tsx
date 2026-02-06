import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAlert } from '../src/context/AlertContext';
// ---------------------------------------------------------
// 🚨 CONFIGURACIÓN DE PAGOS (PRODUCCIÓN)
// ---------------------------------------------------------
const API_URL = "https://wishpermind-backend.onrender.com"; 
// ¡OJO! Pon aquí tus IDs reales de Stripe
const STRIPE_PRICE_MONTHLY = "price_1SxCp3BiM1hjz78rxvwdY1eo";   
const STRIPE_PRICE_YEARLY = "price_1SxCp3BiM1hjz78rdX71Sz6m";    
const STRIPE_PRICE_FOUNDER = "price_1SxUJsBiM1hjz78rugniHoyH";   // <--- ¡TU NUEVO PRECIO DE FOUNDER!
// ---------------------------------------------------------

export default function SubscriptionScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [selectedPlan, setSelectedPlan] = useState('yearly'); // 'monthly', 'yearly', 'founder'
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    return await SecureStore.getItemAsync('user_token'); 
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        showAlert("ACCESS DENIED", "Please login first.", "error");
        return;
      }

      // Elegir el precio correcto
      let priceId = STRIPE_PRICE_MONTHLY;
      if (selectedPlan === 'yearly') priceId = STRIPE_PRICE_YEARLY;
      if (selectedPlan === 'founder') priceId = STRIPE_PRICE_FOUNDER;

      // Llamada al Backend
      const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price_id: priceId })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Payment failed");

      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url);
      } else {
        showAlert("GATEWAY ERROR", "Could not connect to payment gateway.", "error");
      }

    } catch (error: any) {
      showAlert("CONNECTION ERROR", "Could not reach the Nexus server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not access portal");

      if (data.portal_url) {
        await Linking.openURL(data.portal_url);
      }

    } catch (error) {
        showAlert("PORTAL ACCESS", "Only for active subscriptions. Founders have no recurring billing.", "warning");
    } finally {
      setLoading(false);
    }
  };

  const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={12} color="#000" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.title}>UNLOCK THE NEXUS</Text>
          <Text style={styles.subtitle}>Choose your level of commitment.</Text>
        </View>

        <View style={styles.plansContainer}>
          
          {/* 🏆 FOUNDER CARD (NUEVA) */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('founder')}
            style={[styles.planCard, selectedPlan === 'founder' && styles.selectedCard, { borderColor: selectedPlan === 'founder' ? '#F59E0B' : '#334155', marginBottom: 25, borderWidth: selectedPlan === 'founder' ? 2 : 1 }]}
          >
            <LinearGradient 
                colors={['rgba(245, 158, 11, 0.15)', 'transparent']} 
                style={StyleSheet.absoluteFill} 
                start={{x:0, y:0}} end={{x:1, y:1}} 
            />
            <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>LIMITED EDITION</Text></View>
            
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, {color: '#F59E0B', fontSize: 18}]}>FOUNDER</Text>
                <Text style={{color: '#F59E0B', fontSize: 10, fontWeight:'bold', letterSpacing:1}}>LIFETIME ACCESS</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>$149.90</Text>
                 <Text style={[styles.period, {color: '#F59E0B'}]}>/once</Text>
              </View>
            </View>
            <Text style={[styles.savings, {color: '#94A3B8', marginTop: 10}]}>Pay once. Own it forever. No recurring fees.</Text>
          </TouchableOpacity>

          {/* YEARLY */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('yearly')}
            style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedCard, { borderColor: selectedPlan === 'yearly' ? '#38BDF8' : '#334155' }]}
          >
            {selectedPlan === 'yearly' && (
              <View style={[styles.bestValueBadge, {backgroundColor: '#38BDF8'}]}><Text style={styles.bestValueText}>POPULAR</Text></View>
            )}
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selectedPlan === 'yearly' && {color: '#38BDF8'}]}>YEARLY</Text>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>$99.00</Text>
                 <Text style={styles.period}>/year</Text>
              </View>
            </View>
            <Text style={styles.savings}>Save 58% vs Monthly</Text>
          </TouchableOpacity>

          {/* MONTHLY */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('monthly')}
            style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedCard, { marginTop: 15, borderColor: selectedPlan === 'monthly' ? '#94A3B8' : '#334155' }]}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selectedPlan === 'monthly' && {color: '#94A3B8'}]}>MONTHLY</Text>
               <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>$19.90</Text>
                 <Text style={styles.period}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>INCLUDED IN UPGRADE</Text>
          <FeatureItem text="Unlimited Dreams & Visualizations" />
          <FeatureItem text="Unlimited Voice Conversations" />
          <FeatureItem text="Full Vault History Access" />
          <FeatureItem text="Priority Access to New Modes" />
          {selectedPlan === 'founder' && (
             <View style={[styles.featureRow, {marginTop: 5}]}>
                <View style={[styles.checkCircle, {backgroundColor: '#F59E0B'}]}>
                    <Ionicons name="star" size={10} color="#000" />
                </View>
                <Text style={[styles.featureText, {color: '#F59E0B', fontWeight: 'bold'}]}>Founder Badge & Private Circle</Text>
             </View>
          )}
        </View>

        {/* BOTÓN DE SUSCRIPCIÓN */}
        <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={handleSubscribe}
            disabled={loading}
        >
          <LinearGradient
            colors={selectedPlan === 'founder' ? ['#F59E0B', '#B45309'] : (selectedPlan === 'yearly' ? ['#38BDF8', '#0284C7'] : ['#475569', '#1e293b'])}
            style={styles.ctaGradient}
            start={{x:0, y:0}} end={{x:1, y:0}}
          >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.ctaText}>
                {selectedPlan === 'founder' ? 'BECOME A FOUNDER ($149.90)' : (selectedPlan === 'yearly' ? 'START YEARLY PLAN' : 'START MONTHLY PLAN')}
                </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.legalText}>
            {selectedPlan === 'founder' ? 'One-time payment. Lifetime access.' : 'Recurring billing. Cancel anytime.'}
        </Text>

        <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
            <Text style={styles.manageText}>Manage Subscription</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  closeBtn: { position: 'absolute', left: 0, top: 0, padding: 10 },
  title: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
  subtitle: { color: '#94A3B8', fontSize: 14, marginTop: 5, letterSpacing: 0.5 },
  plansContainer: { marginBottom: 30 },
  planCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  selectedCard: { backgroundColor: '#1e293b' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, color: '#CBD5E1' },
  price: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  period: { color: '#64748B', fontSize: 14, marginLeft: 2 },
  savings: { color: '#10B981', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  bestValueBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 10 },
  bestValueText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  featuresContainer: { marginBottom: 30, paddingHorizontal: 10 },
  featuresTitle: { color: '#64748B', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureText: { color: '#E2E8F0', fontSize: 14 },
  ctaButton: { borderRadius: 30, overflow: 'hidden', marginBottom: 20 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  legalText: { color: '#475569', fontSize: 10, textAlign: 'center' },
  manageButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  manageText: { color: '#64748B', fontSize: 12, textDecorationLine: 'underline' }
});