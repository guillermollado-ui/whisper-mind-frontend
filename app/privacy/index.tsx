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

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Política de Privacidad</Text>
      <Text style={styles.meta}>WhisperMind AI ("Alice") · Última actualización: noviembre de 2026</Text>

      <P>Esta Política de Privacidad explica qué datos recoge WhisperMind AI (en adelante, "la App", "nosotros"), con qué finalidad, con quién se comparten y qué derechos tiene la persona usuaria sobre ellos.</P>

      <Section title="1. Responsable del tratamiento">
        <P>WhisperMind AI es una aplicación de compañía y bienestar emocional operada por el equipo de desarrollo de WhisperMind. Para cualquier consulta sobre privacidad, escribe a privacy@whispermindai.com.</P>
      </Section>

      <Section title="2. Qué datos recogemos">
        <Li>Datos de cuenta: usuario, correo, contraseña cifrada, o identidad de Google.</Li>
        <Li>Conversación: mensajes de texto y notas de voz enviados a Alice, y las respuestas generadas.</Li>
        <Li>Datos de bienestar emocional: emociones detectadas, puntuación de riesgo de crisis y resúmenes de ánimo, usados para funciones de seguridad e Insights. Pueden considerarse datos de categoría especial (salud) bajo el art. 9 del RGPD, tratados con tu consentimiento explícito.</Li>
        <Li>Contenido generado: imágenes de IA (Vault, sueños, vibraciones).</Li>
        <Li>Datos de suscripción: estado del plan, gestionado por RevenueCat y las tiendas de apps. No guardamos datos de tu tarjeta.</Li>
        <Li>Datos técnicos: idioma, identificador de dispositivo y registros de uso/errores.</Li>
      </Section>

      <Section title="3. Para qué usamos tus datos">
        <Li>Generar las respuestas de Alice (texto, voz, imágenes).</Li>
        <Li>Detectar crisis y activar protocolos de seguridad.</Li>
        <Li>Generar tus informes semanales de ánimo (Insights).</Li>
        <Li>Gestionar tu cuenta, autenticación y suscripción.</Li>
        <Li>Controlar el coste de uso de los modelos de IA.</Li>
      </Section>

      <Section title="4. Con quién compartimos datos (subencargados)">
        <Li>OpenRouter y los proveedores que enruta (incluye Groq, Mistral) — generación de respuestas.</Li>
        <Li>OpenAI — solo moderación de contenido, no genera respuestas.</Li>
        <Li>Cloudflare (R2) — almacenamiento de audio y biblioteca de sonidos.</Li>
        <Li>Cloudinary — almacenamiento de imágenes generadas (Vault).</Li>
        <Li>MongoDB Atlas — base de datos de cuenta, historial y configuración.</Li>
        <Li>Resend — correos transaccionales (verificación, recuperación de contraseña).</Li>
        <Li>RevenueCat — gestión de suscripciones y compras.</Li>
        <Li>Google (Sign-In / Play Billing) — inicio de sesión y pagos en Google Play.</Li>
        <P>No vendemos tus datos personales a terceros con fines publicitarios.</P>
      </Section>

      <Section title="5. Conservación de datos">
        <P>Conservamos tu historial y datos de cuenta mientras la cuenta esté activa. Puedes borrarla en cualquier momento (ver la página de eliminación de cuenta).</P>
      </Section>

      <Section title="6. Tus derechos">
        <P>Puedes ejercer tus derechos de acceso, rectificación, eliminación, portabilidad y oposición escribiendo a privacy@whispermindai.com, o borrando tu cuenta desde Ajustes → Borrar cuenta.</P>
      </Section>

      <Section title="7. Menores de edad">
        <P>WhisperMind AI no está dirigida a menores de 16 años. Si un menor facilitó datos personales, contáctanos para eliminarlos.</P>
      </Section>

      <Section title="8. Aviso importante">
        <P>WhisperMind AI (Alice) es una compañía de IA y una herramienta de bienestar emocional. No sustituye la terapia profesional, el diagnóstico médico ni la atención de emergencia. Si tú o alguien de tu entorno está en peligro inmediato, contacta con los servicios de emergencia de tu país.</P>
      </Section>

      <Section title="9. Cambios en esta política">
        <P>Podemos actualizar esta política para reflejar cambios en la app o en la normativa aplicable. Notificaremos los cambios relevantes dentro de la propia aplicación.</P>
      </Section>

      <View style={styles.divider} />

      <Text style={styles.h1}>Privacy Policy (English)</Text>
      <Text style={styles.meta}>WhisperMind AI ("Alice") · Last updated: November 2026</Text>

      <P>This Privacy Policy explains what data WhisperMind AI (the "App", "we") collects, why, who we share it with, and what rights you have over it.</P>

      <Section title="1. Data controller">
        <P>WhisperMind AI is an emotional-wellness companion app operated by the WhisperMind development team. For any privacy question, contact privacy@whispermindai.com.</P>
      </Section>

      <Section title="2. What we collect">
        <Li>Account data: username, email, hashed password, or your Google identity.</Li>
        <Li>Conversation data: text and voice notes sent to Alice, and generated replies.</Li>
        <Li>Emotional wellness data: detected emotions, crisis-risk scores and mood summaries, powering safety features and Insights. May qualify as special-category (health) data under GDPR Art. 9, processed with your explicit consent.</Li>
        <Li>Generated content: AI-generated images (Vault, dreams, vibrations).</Li>
        <Li>Subscription data: plan status via RevenueCat and the app stores. We do not store your card details.</Li>
        <Li>Technical data: language, device identifier and usage/error logs.</Li>
      </Section>

      <Section title="3. Why we use your data">
        <Li>Generate Alice's responses (text, voice, images).</Li>
        <Li>Detect crisis situations and trigger safety protocols.</Li>
        <Li>Generate your weekly mood reports (Insights).</Li>
        <Li>Manage your account, authentication and subscription.</Li>
        <Li>Control AI usage cost.</Li>
      </Section>

      <Section title="4. Who we share data with (subprocessors)">
        <Li>OpenRouter and the providers it routes to (including Groq, Mistral) — generating responses.</Li>
        <Li>OpenAI — content moderation only.</Li>
        <Li>Cloudflare (R2) — audio storage and the sound library.</Li>
        <Li>Cloudinary — AI-generated image storage (Vault).</Li>
        <Li>MongoDB Atlas — account, history and settings database.</Li>
        <Li>Resend — transactional emails (verification, password reset).</Li>
        <Li>RevenueCat — subscription and purchase management.</Li>
        <Li>Google (Sign-In / Play Billing) — sign-in and Google Play payments.</Li>
        <P>We do not sell your personal data to third parties for advertising purposes.</P>
      </Section>

      <Section title="5. Data retention">
        <P>We retain your history and account data while your account is active. You may delete it at any time (see our account deletion page).</P>
      </Section>

      <Section title="6. Your rights">
        <P>You may exercise your rights of access, rectification, erasure, portability and objection by writing to privacy@whispermindai.com, or by deleting your account in Settings → Delete Account.</P>
      </Section>

      <Section title="7. Children">
        <P>WhisperMind AI is not directed to children under 16. If a minor provided personal data, contact us to have it removed.</P>
      </Section>

      <Section title="8. Important notice">
        <P>WhisperMind AI (Alice) is an AI companion and emotional-wellness tool. It is not a substitute for professional therapy, medical diagnosis, or emergency care. If you or someone you know is in immediate danger, contact your local emergency services.</P>
      </Section>

      <Section title="9. Changes to this policy">
        <P>We may update this policy to reflect changes to the app or applicable law. We will notify material changes within the app itself.</P>
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
  divider: { height: 2, backgroundColor: '#1e293b', marginVertical: 40 },
  link: { color: '#818cf8', fontSize: 15, marginTop: 24, textDecorationLine: 'underline' },
});
