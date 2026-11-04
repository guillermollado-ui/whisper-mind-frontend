import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Purchases from 'react-native-purchases';
import { useAlert } from '../src/context/AlertContext';
import { useLanguage } from '../src/context/LanguageContext';
import { getAuthToken } from '../utils/api';

// Día 14/16: un único plan de pago (Plus). Founder se retiró de la venta y Essential/Premium
// se fusionaron en Plus (roadmap, sección 4, decidido por el fundador el 2026-10-12).
// Los paquetes de RevenueCat son los identificadores por defecto de Play: $rc_monthly y
// $rc_annual. La prueba de 7 días y la oferta del primer mes (intro-1m) se resuelven solas al
// comprar el paquete: RevenueCat aplica la oferta elegible más alta sin que la app tenga que
// pedirla explícitamente.
const PRECIO_MENSUAL = '6,99 €';
const PRECIO_ANUAL = '49,99 €';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { t, language } = useLanguage();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      // Usamos el helper compartido: en web el token vive en localStorage, no en SecureStore.
      const token = await getAuthToken();

      if (!token) {
        showAlert("ACCESS DENIED", t('subscription.alerts.login') || "Log in first.", "error");
        return;
      }

      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        showAlert("GATEWAY ERROR", "No packages available in RevenueCat right now.", "error");
        return;
      }

      const packageIdentifier = billingCycle === 'monthly' ? '$rc_monthly' : '$rc_annual';
      const packageToBuy = offerings.current.availablePackages.find(p => p.identifier === packageIdentifier);

      if (!packageToBuy) {
        showAlert("CONFIGURATION ERROR", `Package '${packageIdentifier}' not found in RevenueCat.`, "error");
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      if (typeof customerInfo.entitlements.active['plus'] !== "undefined") {
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

  const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={12} color="#000" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  const PLUS_FEATURES = language === 'es' ? [
    "40 mensajes al día con Alice",
    "Voz neural de Alice (hasta 60.000 caracteres/mes)",
    "5 interpretaciones de sueños al día",
    "1 imagen generada al día",
    "Biblioteca completa de Sleep e Historia personalizada semanal",
    "Memoria larga, arquetipos, Vault y exportación",
    "Publicación y resonancia en la Red (Network)",
  ] : [
    "40 messages a day with Alice",
    "Alice's neural voice (up to 60,000 characters/month)",
    "5 dream interpretations a day",
    "1 generated image a day",
    "Full Sleep library and a weekly personalized story",
    "Long-term memory, archetypes, Vault and export",
    "Publishing and resonance on the Network",
  ];

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
                    {language === 'es' ? "Anual (-40%)" : "Yearly (-40%)"}
                </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.plansContainer}>
          <View style={[styles.planCard, styles.selectedCard, { borderColor: '#38BDF8' }]}>
            <View style={[styles.bestValueBadge, {backgroundColor: '#10B981'}]}>
                <Text style={styles.bestValueText}>{language === 'es' ? "7 DÍAS GRATIS" : "7-DAY FREE TRIAL"}</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, {color: '#38BDF8'}]}>PLUS</Text>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                 <Text style={styles.price}>{billingCycle === 'monthly' ? PRECIO_MENSUAL : PRECIO_ANUAL}</Text>
                 <Text style={styles.period}>{billingCycle === 'monthly' ? '/mes' : '/año'}</Text>
              </View>
            </View>
            <Text style={[styles.savings, {color: '#94A3B8'}]}>
              {language === 'es' ? "Prueba 7 días gratis. Cancela cuando quieras." : "Try 7 days free. Cancel anytime."}
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>{language === 'es' ? "LO QUE INCLUYE PLUS:" : "WHAT PLUS INCLUDES:"}</Text>
          {PLUS_FEATURES.map((texto) => <FeatureItem key={texto} text={texto} />)}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleSubscribe} disabled={loading}>
          <LinearGradient
            colors={['#38BDF8', '#0284C7']}
            style={styles.ctaGradient} start={{x:0, y:0}} end={{x:1, y:0}}
          >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.ctaText}>
                  {language === 'es' ? "EMPEZAR 7 DÍAS GRATIS" : "START 7-DAY FREE TRIAL"}
                </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipText}>{language === 'es' ? "Seguir con la versión gratuita" : "Continue with the free version"}</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
            {language === 'es'
              ? "Tras la prueba se cobra el precio mostrado salvo que cancela antes. Puedes cancelar en cualquier momento desde los ajustes de tu teléfono."
              : "After the trial, the price shown is charged unless you cancel first. You can cancel anytime from your phone settings."}
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

  ctaButton: { borderRadius: 30, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  skipButton: { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  skipText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  legalText: { color: '#475569', fontSize: 10, textAlign: 'center' },
  manageButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  manageText: { color: '#64748B', fontSize: 12, textDecorationLine: 'underline' }
});
