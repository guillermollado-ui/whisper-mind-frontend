import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import { useAlert } from '../src/context/AlertContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { t, language } = useLanguage();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'premium' | 'founder'>('premium'); 
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    return await SecureStore.getItemAsync('user_token'); 
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        showAlert("ACCESS DENIED", t('subscription.alerts.login') || "Log in first.", "error");
        return;
      }

      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        showAlert("GATEWAY ERROR", "No packages available in RevenueCat right now.", "error");
        return;
      }

      // Mapeo quirúrgico a los paquetes de RevenueCat según el plan y el ciclo
      let packageIdentifier = '';
      if (selectedPlan === 'essential') {
          packageIdentifier = billingCycle === 'monthly' ? 'essential_monthly' : 'essential_yearly';
      } else if (selectedPlan === 'premium') {
          packageIdentifier = billingCycle === 'monthly' ? 'premium_monthly' : 'premium_yearly';
      } else if (selectedPlan === 'founder') {
          packageIdentifier = 'lifetime_founder';
      }

      // Buscamos el paquete en el offering actual
      const packageToBuy = offerings.current.availablePackages.find(p => p.identifier === packageIdentifier);

      if (!packageToBuy) {
        showAlert("CONFIGURATION ERROR", `Package '${packageIdentifier}' not found in RevenueCat.`, "error");
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      
      if (typeof customerInfo.entitlements.active['premium'] !== "undefined" || 
          typeof customerInfo.entitlements.active['plus'] !== "undefined" ||
          typeof customerInfo.entitlements.active['founder'] !== "undefined") {
        showAlert("PROTOCOL ESTABLISHED", "Welcome to the Nexus. Your profile is upgraded.", "success");
        router.replace('/');
      }

    } catch (error: any) {
      if (!error.userCancelled) {
        showAlert("PAYMENT ERROR", error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (customerInfo.managementURL) {
        await Linking.openURL(customerInfo.managementURL);
      } else {
        const storeUrl = Platform.OS === 'ios' 
          ? 'https://apps.apple.com/account/subscriptions' 
          : 'https://play.google.com/store/account/subscriptions';
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
        showAlert("PORTAL ACCESS", t('subscription.alerts.portal') || "Cannot access portal.", "warning");
    } finally {
      setLoading(false);
    }
  };

  const FeatureItem = ({ text, available }: { text: string, available: boolean }) => (
    <View style={[styles.featureRow, !available && { opacity: 0.4 }]}>
      <View style={[styles.checkCircle, !available && { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#64748B' }]}>
        {available ? (
            <Ionicons name="checkmark" size={12} color="#000" />
        ) : (
            <Ionicons name="close" size={12} color="#64748B" />
        )}
      </View>
      <Text style={[styles.featureText, !available && { textDecorationLine: 'line-through', color: '#64748B' }]}>{text}</Text>
    </View>
  );

  const renderFeatures = () => {
      if (selectedPlan === 'essential') {
          return (
              <>
                  <FeatureItem text={language === 'es' ? "Acceso al Vault y Network" : "Vault and Network Access"} available={true} />
                  <FeatureItem text={language === 'es' ? "Todos los Modos Cognitivos" : "All Cognitive Modes"} available={true} />
                  <FeatureItem text={language === 'es' ? "1 Arte DALL-E 3 al Día (Journal/Sleep)" : "1 DALL-E 3 Art/Day (Journal/Sleep)"} available={true} />
                  <FeatureItem text={language === 'es' ? "Límite de 10 mensajes diarios" : "10 Messages Daily Limit"} available={true} />
                  <FeatureItem text={language === 'es' ? "Voz hiperrealista MiniMax ilimitada" : "Unlimited MiniMax Hyper-realistic Voice"} available={false} />
                  <FeatureItem text={language === 'es' ? "Mensajes ilimitados sin barreras" : "Unlimited messages without barriers"} available={false} />
              </>
          );
      } else {
          // Premium & Founder
          return (
              <>
                  <FeatureItem text={language === 'es' ? "Mensajes Ilimitados sin barreras" : "Unlimited Messages without barriers"} available={true} />
                  <FeatureItem text={language === 'es' ? "Voz hiperrealista MiniMax ilimitada" : "Unlimited MiniMax Hyper-realistic Voice"} available={true} />
                  <FeatureItem text={language === 'es' ? "Arte Generativo DALL-E 3 ilimitado" : "Unlimited DALL-E 3 Generative Art"} available={true} />
                  <FeatureItem text={language === 'es' ? "Acceso total a todos los modos" : "Full access to all modes"} available={true} />
                  <FeatureItem text={language === 'es' ? "Publicación y resonancia en Network" : "Publishing and resonance in Network"} available={true} />
                  {selectedPlan === 'founder' && (
                      <>
                         <View style={[styles.featureRow, {marginTop: 10}]}>
                            <View style={[styles.checkCircle, {backgroundColor: '#F59E0B'}]}>
                                <Ionicons name="star" size={10} color="#000" />
                            </View>
                            <Text style={[styles.featureText, {color: '#F59E0B', fontWeight: 'bold'}]}>
                                {language === 'es' ? "Sello Exclusivo de Fundador de por vida" : "Exclusive Lifetime Founder Badge"}
                            </Text>
                         </View>
                         <FeatureItem text={language === 'es' ? "Modo Dios de Arquitecto (Acceso Secreto)" : "Architect 'God Mode' (Secret Access)"} available={true} />
                         <FeatureItem text={language === 'es' ? "Círculo Privado de Fundadores en Discord" : "Private Discord Founder Circle"} available={true} />
                         <FeatureItem text={language === 'es' ? "Acceso Anticipado a Versiones Alpha" : "Early Access to Alpha Versions"} available={true} />
                      </>
                  )}
              </>
          );
      }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.title}>{language === 'es' ? "TU NEURAL LINK" : "YOUR NEURAL LINK"}</Text>
          <Text style={styles.subtitle}>{language === 'es' ? "Desbloquea el verdadero potencial de Alice." : "Unlock Alice's true potential."}</Text>
        </View>

        {/* TOGGLE MENSUAL / ANUAL */}
        <View style={styles.toggleContainer}>
            <TouchableOpacity 
                style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]} 
                onPress={() => setBillingCycle('monthly')}
            >
                <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
                    {language === 'es' ? "Mensual" : "Monthly"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]} 
                onPress={() => setBillingCycle('yearly')}
            >
                <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
                    {language === 'es' ? "Anual (-16%)" : "Yearly (-16%)"}
                </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.plansContainer}>
          
          {/* PLAN PREMIUM */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('premium')}
            style={[styles.planCard, selectedPlan === 'premium' && styles.selectedCard, { borderColor: selectedPlan === 'premium' ? '#38BDF8' : '#334155' }]}
          >
            <View style={[styles.bestValueBadge, {backgroundColor: '#38BDF8'}]}>
                <Text style={styles.bestValueText}>{language === 'es' ? "RECOMENDADO" : "RECOMMENDED"}</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selectedPlan === 'premium' && {color: '#38BDF8'}]}>PREMIUM</Text>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>{billingCycle === 'monthly' ? '€19.90' : '€149.90'}</Text>
                 <Text style={styles.period}>{billingCycle === 'monthly' ? '/mes' : '/año'}</Text>
              </View>
            </View>
            <Text style={[styles.savings, {color: '#94A3B8'}]}>{language === 'es' ? "Inmersión total sin límites." : "Total immersion without limits."}</Text>
          </TouchableOpacity>

          {/* PLAN ESSENTIAL */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('essential')}
            style={[styles.planCard, selectedPlan === 'essential' && styles.selectedCard, { marginTop: 15, borderColor: selectedPlan === 'essential' ? '#10B981' : '#334155' }]}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selectedPlan === 'essential' && {color: '#10B981'}]}>ESSENTIAL</Text>
               <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>{billingCycle === 'monthly' ? '€9.90' : '€99.00'}</Text>
                 <Text style={styles.period}>{billingCycle === 'monthly' ? '/mes' : '/año'}</Text>
              </View>
            </View>
            <Text style={[styles.savings, {color: '#94A3B8'}]}>{language === 'es' ? "Equilibrio perfecto." : "Perfect balance."}</Text>
          </TouchableOpacity>

          {/* PLAN FOUNDER */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('founder')}
            style={[styles.planCard, selectedPlan === 'founder' && styles.selectedCard, { borderColor: selectedPlan === 'founder' ? '#F59E0B' : '#334155', marginTop: 15, borderWidth: selectedPlan === 'founder' ? 2 : 1 }]}
          >
            <LinearGradient colors={['rgba(245, 158, 11, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} start={{x:0, y:0}} end={{x:1, y:1}} />
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, {color: '#F59E0B', fontSize: 18}]}>LIFETIME FOUNDER</Text>
                <Text style={{color: '#F59E0B', fontSize: 10, fontWeight:'bold', letterSpacing:1}}>{language === 'es' ? "ACCESO DE POR VIDA" : "LIFETIME ACCESS"}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>€179.90</Text> 
                 <Text style={[styles.period, {color: '#F59E0B'}]}>{language === 'es' ? "Pago único" : "One-time"}</Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>{language === 'es' ? "LO QUE INCLUYE ESTE PLAN:" : "WHAT THIS PLAN INCLUDES:"}</Text>
          {renderFeatures()}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleSubscribe} disabled={loading}>
          <LinearGradient
            colors={selectedPlan === 'founder' ? ['#F59E0B', '#B45309'] : (selectedPlan === 'premium' ? ['#38BDF8', '#0284C7'] : ['#10B981', '#047857'])}
            style={styles.ctaGradient} start={{x:0, y:0}} end={{x:1, y:0}}
          >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.ctaText}>
                  {language === 'es' ? "ESTABLECER CONEXIÓN" : "ESTABLISH CONNECTION"}
                </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.legalText}>
            {language === 'es' 
              ? "Puedes cancelar en cualquier momento desde los ajustes de tu teléfono." 
              : "You can cancel anytime from your phone settings."}
        </Text>

        <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
            <Text style={styles.manageText}>{language === 'es' ? "Gestionar suscripción activa" : "Manage active subscription"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  closeBtn: { position: 'absolute', left: 0, top: 0, padding: 10 },
  title: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
  subtitle: { color: '#94A3B8', fontSize: 14, marginTop: 5, letterSpacing: 0.5 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 30, padding: 4, marginBottom: 25, borderWidth: 1, borderColor: '#1e293b' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 26 },
  toggleBtnActive: { backgroundColor: '#1e293b' },
  toggleText: { color: '#64748B', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  toggleTextActive: { color: 'white' },

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