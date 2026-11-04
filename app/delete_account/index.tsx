import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.h2}>{title}</Text>
    {children}
  </View>
);

const P = ({ children }: { children: React.ReactNode }) => <Text style={styles.p}>{children}</Text>;
const Li = ({ children }: { children: React.ReactNode }) => <Text style={styles.li}>{'• '}{children}</Text>;
const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <Text style={styles.li}>{n}. {children}</Text>
);

export default function DeleteAccount() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Cómo eliminar tu cuenta</Text>
      <Text style={styles.meta}>WhisperMind AI ("Alice") · Última actualización: noviembre de 2026</Text>

      <Section title="Opción 1 · Desde la app (inmediata)">
        <Step n={1}>Abre WhisperMind AI y ve a Ajustes.</Step>
        <Step n={2}>En la sección de cuenta, pulsa "Borrar cuenta".</Step>
        <Step n={3}>Confirma la advertencia. La cuenta se elimina de forma inmediata y permanente.</Step>
      </Section>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Qué se elimina exactamente:</Text>
        <Li>Tu cuenta, usuario y contraseña (el nombre no podrá volver a registrarse).</Li>
        <Li>Todo tu historial de conversación con Alice.</Li>
        <Li>Tus imágenes del Vault y sueños/vibraciones, incluidas las copias en Cloudinary y Cloudflare R2.</Li>
        <Li>Tus datos de ánimo e Insights.</Li>
        <Li>Los registros de eventos de seguridad/crisis asociados a tu cuenta.</Li>
        <Li>El audio en caché de tus respuestas.</Li>
        <Text style={[styles.boxTitle, { marginTop: 10 }]}>Qué se conserva:</Text>
        <P>Un registro interno y anónimo del coste de uso de IA (sin ningún dato que te identifique), solo para control financiero.</P>
      </View>

      <Section title="Opción 2 · Si no puedes acceder a la app">
        <P>Escríbenos a privacy@whispermindai.com desde el correo asociado a tu cuenta, indicando tu nombre de usuario y solicitando la eliminación. Procesaremos la solicitud en un plazo máximo de 30 días y te confirmaremos por correo.</P>
      </Section>

      <Section title="¿Esto afecta a mi suscripción?">
        <P>Eliminar tu cuenta no cancela automáticamente una suscripción activa en Google Play o App Store. Cancela el cobro recurrente también desde la configuración de suscripciones de tu tienda de aplicaciones.</P>
      </Section>

      <View style={styles.divider} />

      <Text style={styles.h1}>How to delete your account</Text>
      <Text style={styles.meta}>WhisperMind AI ("Alice") · Last updated: November 2026</Text>

      <Section title="Option 1 · In the app (immediate)">
        <Step n={1}>Open WhisperMind AI and go to Settings.</Step>
        <Step n={2}>In the account section, tap "Delete account".</Step>
        <Step n={3}>Confirm the warning. Your account is deleted immediately and permanently.</Step>
      </Section>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>What gets deleted:</Text>
        <Li>Your account, username and password (the username cannot be re-registered).</Li>
        <Li>Your entire conversation history with Alice.</Li>
        <Li>Your Vault images and dreams/vibrations, including copies in Cloudinary and Cloudflare R2.</Li>
        <Li>Your mood and Insights data.</Li>
        <Li>Safety/crisis event logs tied to your account.</Li>
        <Li>Cached audio of your responses.</Li>
        <Text style={[styles.boxTitle, { marginTop: 10 }]}>What is retained:</Text>
        <P>An internal, anonymized record of AI usage cost (no data identifying you), for financial control only.</P>
      </View>

      <Section title="Option 2 · If you can't access the app">
        <P>Email us at privacy@whispermindai.com from the address associated with your account, stating your username and requesting deletion. We will process the request within 30 days and confirm by email.</P>
      </Section>

      <Section title="Does this affect my subscription?">
        <P>Deleting your account does not automatically cancel an active subscription on Google Play or the App Store. Also cancel it from your app store's subscription settings.</P>
      </Section>

      <TouchableOpacity onPress={() => Linking.openURL('mailto:privacy@whispermindai.com')}>
        <Text style={styles.link}>privacy@whispermindai.com</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 24, paddingBottom: 80, maxWidth: 760, alignSelf: 'center', width: '100%' },
  h1: { color: '#ffffff', fontSize: 26, fontWeight: '700', marginBottom: 4 },
  h2: { color: '#ffffff', fontSize: 17, fontWeight: '600', marginTop: 28, marginBottom: 8 },
  meta: { color: '#64748B', fontSize: 13, marginBottom: 20 },
  p: { color: '#cbd5e1', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  li: { color: '#cbd5e1', fontSize: 15, lineHeight: 22, marginBottom: 6, paddingLeft: 4 },
  section: { marginBottom: 4 },
  box: { backgroundColor: '#1a0f0f', borderWidth: 1, borderColor: '#4a1f1f', borderRadius: 10, padding: 16, marginVertical: 20 },
  boxTitle: { color: '#ffffff', fontWeight: '700', fontSize: 15, marginBottom: 8 },
  divider: { height: 2, backgroundColor: '#1e293b', marginVertical: 40 },
  link: { color: '#818cf8', fontSize: 15, marginTop: 24, textDecorationLine: 'underline' },
});
