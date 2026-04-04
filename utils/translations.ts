// utils/translations.ts

export const translations = {
  en: {
    nexus: {
      title: "N E X U S",
      modes: { default: "Therapist", calm: "Anxiety", sleep: "Sleep", win: "Coach", dream: "Dream" },
      descriptions: { default: "Open dialogue space.", calm: "Panic relief protocol.", sleep: "Hypnotic drift engine.", win: "Strategic alignment.", dream: "Subconscious interpreter." },
      placeholders: { mic_listening: "LISTENING...", mic_processing: "PROCESSING DATA STREAM...", mic_tap: "TAP MIC TO SPEAK • TAP DOTS TO SHIFT", text_input: "Alice is listening...", text_label: "TYPE YOUR THOUGHTS", btn_transmit: "TRANSMIT" }
    },
    settings: {
      title: "SYSTEM CONFIG",
      security: "SECURITY & PRIVACY",
      bio_access: "Biometric Access",
      notifications: "Notifications",
      language: "Interface Language",
      account_zone: "ACCOUNT ZONE",
      btn_disconnect: "DISCONNECT",
      btn_delete: "DELETE ACCOUNT"
    },
    onboarding: {
      step1_title: "How should Alice guide you?",
      step1_subtitle: "Choose the voice of your emotional architect.",
      personalities: ["Empathetic & Soft", "Direct & Constructive", "Challenge Mode"],
      step2_title: "What is your North Star?",
      step2_subtitle: "Alice will focus her insights on this area.",
      focus_areas: ["Inner Peace", "Productivity & Success", "Personal Growth"],
      step3_title: "Tell Alice what matters today",
      step3_subtitle: "Speak in any language. Alice will adapt.",
      mic_tap: "TAP TO SPEAK",
      mic_listening: "LISTENING (TAP TO STOP)...",
      mic_captured: "Captured ✓ — Tap Sync & Start",
      btn_sync: "Sync & Start",
      disclaimer: "Alice isn't a medical professional. If you're in danger, contact local emergency services.",
      step4_title: "Alice is ready.",
      btn_nexus: "Enter the Nexus",
      btn_replay: "Replay Welcome",
      playing: "Playing...",
      alert_too_short: "Too Short",
      alert_too_short_desc: "Speak a bit longer (min 1.5s).",
      alert_captured: "Captured",
      alert_captured_desc: "I'll remember this.",
      loading_link: "ESTABLISHING LINK..."
    },
    vault: {
      title: "THE VAULT",
      subtitle: "MEMORY ARCHIVE",
      archetypes: [
        { title: "Echo Wanderer", desc: "Beginning the journey inward." },
        { title: "Mind Gardner", desc: "Cultivating first insights." },
        { title: "Lucid Navigator", desc: "Mapping the subconscious terrain." },
        { title: "Void Architect", desc: "Building new mental structures." }
      ],
      level: "Level",
      memories_stored: "Memories Stored",
      read_more: "READ MORE",
      read_less: "READ LESS",
      load_more: "LOAD OLDER MEMORIES",
      empty_state: "No memories found here.",
      tabs: { journal: "JOURNAL", dream: "DREAMS", chats: "LOGS" },
      tags: { journal: "EMOTIONAL ART", dream: "DREAM ART" },
      btns: { export: "EXPORT", save_art: "SAVE ART" },
      alerts: { no_image: "No image found to share.", export_error: "Alice couldn't prepare the image. Please try again.", share_error: "Error sharing" }
    },
    insights: {
      title: "INSIGHTS",
      subtitle: "INTERNAL COMPASS",
      hero: { archetype_label: "CURRENT ARCHETYPE", awaiting: "Awaiting Data...", pattern_prefix: "PATTERN: ", analyzing: "Synchronizing...", btn_calculating: "CALCULATING...", btn_stop: "STOP AUDIO", btn_initiate: "INITIATE ANALYSIS", read_more: "READ FULL TRANSMISSION", read_less: "COLLAPSE DATA", sync_message: "Tap below to synchronize." },
      sections: { mood_rhythm: "NERVOUS SYSTEM RHYTHM", spectrum: "EMOTIONAL SPECTRUM", protocols: "ALIGNMENT PROTOCOLS" },
      empty: { data: "Insufficient data points.", spectrum: "No spectrum data.", protocols: "Protocols inactive. Awaiting Alice." },
      tasks: { default_title: "Mindful Action", default_time: "Today", backup_title: "Deep Check-in", backup_time: "5 min", execute: "EXECUTE PROTOCOL", help_text: "(If you don't know how, press the button and ask me in the Nexus.)", closing_phrase: "\n\nI've left 3 protocols below that I think can help you navigate this. Review them calmly.", backup_desc: "It seems we need to go deeper. Go to the Nexus and tell me what you feel right now." }
    },
    network: {
      title: "COLLECTIVE FREQUENCY",
      pulse_phrases: ["A wave of release is moving through the field", "Tonight, grief and relief coexist", "Many are letting go right now", "The silence is deepening", "A shared frequency of courage is rising", "You are woven into this moment", "The field is holding space for change"],
      closing_phrases: ["Resonance received.", "Thank you for holding the field.", "What you felt mattered.", "The collective acknowledges you.", "Your presence is felt.", "Balance restored."],
      resting: { title: "The field rests now.", sub1: "You have given enough.", sub2: "Return when you feel called.", btn: "RETURN TO NEXUS" },
      empty: { title: "The collective is quiet.", sub: "Be the first to resonate.", btn: "RETURN" },
      ritual: { breath: "Take one breath before you resonate", hold: "HOLD TO OFFER", shifting: "The field is shifting...", return_nexus: "Return to Nexus" },
      fallback_echo: "Silence...",
      default_tag: "ESSENCE"
    },
    // 💎 SUBSCRIPTION SECTION
    subscription: {
      title: "UNLOCK THE NEXUS",
      subtitle: "Choose your level of commitment.",
      founder: {
        name: "FOUNDER",
        badge: "LIMITED EDITION",
        access: "LIFETIME ACCESS",
        desc: "Pay once. Own it forever. No recurring fees.",
        period: "/once",
        btn: "BECOME A FOUNDER ($149.90)",
        legal: "One-time payment. Lifetime access."
      },
      yearly: {
        name: "YEARLY",
        badge: "POPULAR",
        savings: "Save 58% vs Monthly",
        period: "/year",
        btn: "START YEARLY PLAN",
        legal: "Recurring billing. Cancel anytime."
      },
      monthly: {
        name: "MONTHLY",
        period: "/month",
        btn: "START MONTHLY PLAN",
        legal: "Recurring billing. Cancel anytime."
      },
      features: {
        title: "INCLUDED IN UPGRADE",
        unlimited_visual: "Unlimited Dreams & Visualizations",
        unlimited_voice: "Unlimited Voice Conversations",
        full_vault: "Full Vault History Access",
        priority: "Priority Access to New Modes",
        founder_perk: "Founder Badge & Private Circle"
      },
      manage_btn: "Manage Subscription",
      alerts: {
        login: "Please login first.",
        gateway: "Could not connect to payment gateway.",
        nexus_error: "Could not reach the Nexus server.",
        portal: "Only for active subscriptions. Founders have no recurring billing."
      }
    }
  },
  es: {
    nexus: {
      title: "N E X U S",
      modes: { default: "Terapeuta", calm: "Ansiedad", sleep: "Sueño", win: "Coach", dream: "Sueños" },
      descriptions: { default: "Espacio de diálogo abierto.", calm: "Protocolo de alivio de pánico.", sleep: "Motor de deriva hipnótica.", win: "Alineación estratégica.", dream: "Intérprete del subconsciente." },
      placeholders: { mic_listening: "ESCUCHANDO...", mic_processing: "PROCESANDO DATOS...", mic_tap: "TOCA EL MIC PARA HABLAR • TOCA PUNTOS PARA CAMBIAR", text_input: "Alice te escucha...", text_label: "ESCRIBE TUS PENSAMIENTOS", btn_transmit: "TRANSMITIR" }
    },
    settings: {
      title: "CONFIGURACIÓN DEL SISTEMA",
      security: "SEGURIDAD Y PRIVACIDAD",
      bio_access: "Acceso Biométrico",
      notifications: "Notificaciones",
      language: "Idioma de Interfaz",
      account_zone: "ZONA DE CUENTA",
      btn_disconnect: "DESCONECTAR",
      btn_delete: "ELIMINAR CUENTA"
    },
    onboarding: {
      step1_title: "¿Cómo quieres que Alice te guíe?",
      step1_subtitle: "Elige la voz de tu arquitecta emocional.",
      personalities: ["Empática y Suave", "Directa y Constructiva", "Modo Desafío"],
      step2_title: "¿Cuál es tu Estrella Polar?",
      step2_subtitle: "Alice centrará sus análisis en esta área.",
      focus_areas: ["Paz Interior", "Productividad y Éxito", "Crecimiento Personal"],
      step3_title: "Cuéntale a Alice qué te importa hoy",
      step3_subtitle: "Habla en cualquier idioma. Alice se adaptará.",
      mic_tap: "TOCA PARA HABLAR",
      mic_listening: "ESCUCHANDO (TOCA PARA PARAR)...",
      mic_captured: "Capturado ✓ — Toca Sincronizar",
      btn_sync: "Sincronizar y Empezar",
      disclaimer: "Alice no es un profesional médico. Si estás en peligro, contacta con los servicios de emergencia.",
      step4_title: "Alice está lista.",
      btn_nexus: "Entrar en el Nexus",
      btn_replay: "Repetir Bienvenida",
      playing: "Reproduciendo...",
      alert_too_short: "Muy Corto",
      alert_too_short_desc: "Habla un poco más (mín. 1.5s).",
      alert_captured: "Capturado",
      alert_captured_desc: "Recordaré esto.",
      loading_link: "ESTABLECIENDO CONEXIÓN..."
    },
    vault: {
      title: "B Ó V E D A",
      subtitle: "ARCHIVO DE MEMORIA",
      archetypes: [{ title: "Vagabundo del Eco", desc: "Comenzando el viaje interior." }, { title: "Jardinero Mental", desc: "Cultivando las primeras revelaciones." }, { title: "Navegante Lúcido", desc: "Mapeando el terreno subconsciente." }, { title: "Arquitecto del Vacío", desc: "Construyendo nuevas estructuras mentales." }],
      level: "Nivel",
      memories_stored: "Memorias Guardadas",
      read_more: "LEER MÁS",
      read_less: "LEER MENOS",
      load_more: "CARGAR MEMORIAS ANTIGUAS",
      empty_state: "No se han encontrado memorias aquí.",
      tabs: { journal: "DIARIO", dream: "SUEÑOS", chats: "LOGS" },
      tags: { journal: "ARTE EMOCIONAL", dream: "ARTE ONÍRICO" },
      btns: { export: "EXPORTAR", save_art: "GUARDAR ARTE" },
      alerts: { no_image: "No se encontró la imagen para compartir.", export_error: "Alice no pudo preparar la imagen. Reinténtalo.", share_error: "Error al compartir" }
    },
    insights: {
      title: "ANÁLISIS",
      subtitle: "BRÚJULA INTERNA",
      hero: { archetype_label: "ARQUETIPO ACTUAL", awaiting: "Esperando datos...", pattern_prefix: "PATRÓN: ", analyzing: "Sincronizando...", btn_calculating: "CALCULANDO...", btn_stop: "DETENER AUDIO", btn_initiate: "INICIAR ANÁLISIS", read_more: "LEER TRANSMISIÓN COMPLETA", read_less: "COLAPSAR DATOS", sync_message: "Toca abajo para sincronizar." },
      sections: { mood_rhythm: "RITMO DEL SISTEMA NERVIOSO", spectrum: "ESPECTRO EMOCIONAL", protocols: "PROTOCOLOS DE ALINEACIÓN" },
      empty: { data: "Puntos de datos insuficientes.", spectrum: "Sin datos de espectro.", protocols: "Protocolos inactivos. Esperando a Alice." },
      tasks: { default_title: "Acción Consciente", default_time: "Hoy", backup_title: "Chequeo Profundo", backup_time: "5 min", execute: "EJECUTAR PROTOCOLO", help_text: "(Si no sabes cómo hacerlo, pulsa el botón y pregúntame en el Nexus.)", closing_phrase: "\n\nHe dejado 3 protocolos aquí debajo que creo que pueden ayudarte a navegar esto. Revísalos con calma.", backup_desc: "Parece que necesitamos profundizar más. Ve al Nexus y cuéntame qué sientes en este momento." }
    },
    network: {
      title: "FRECUENCIA COLECTIVA",
      pulse_phrases: ["Una ola de liberación se mueve por el campo", "Esta noche, el duelo y el alivio coexisten", "Muchos están soltando en este momento", "El silencio se está profundizando", "Una frecuencia compartida de coraje está surgiendo", "Estás entretejido en este momento", "El campo sostiene el espacio para el cambio"],
      closing_phrases: ["Resonancia recibida.", "Gracias por sostener el campo.", "Lo que sentiste importó.", "El colectivo te reconoce.", "Tu presencia se siente.", "Equilibrio restaurado."],
      resting: { title: "El campo descansa.", sub1: "Has dado suficiente por hoy.", sub2: "Regresa cuando sientas la llamada.", btn: "VOLVER AL NEXUS" },
      empty: { title: "El colectivo está en silencio.", sub: "Sé el primero en resonar.", btn: "VOLVER" },
      ritual: { breath: "Respira antes de resonar", hold: "MANTÉN PARA OFRECER", shifting: "El campo está cambiando...", return_nexus: "Volver al Nexus" },
      fallback_echo: "Silencio...",
      default_tag: "ESENCIA"
    },
    // 💎 SECCIÓN SUSCRIPCIÓN
    subscription: {
      title: "DESBLOQUEA EL NEXUS",
      subtitle: "Elige tu nivel de compromiso.",
      founder: {
        name: "FUNDADOR",
        badge: "EDICIÓN LIMITADA",
        access: "ACCESO DE POR VIDA",
        desc: "Paga una vez. Tuyo para siempre. Sin cuotas recurrentes.",
        period: "/una vez",
        btn: "SÉ FUNDADOR ($149.90)",
        legal: "Pago único. Acceso vitalicio."
      },
      yearly: {
        name: "ANUAL",
        badge: "POPULAR",
        savings: "Ahorra 58% vs Mensual",
        period: "/año",
        btn: "EMPEZAR PLAN ANUAL",
        legal: "Facturación recurrente. Cancela cuando quieras."
      },
      monthly: {
        name: "MENSUAL",
        period: "/mes",
        btn: "EMPEZAR PLAN MENSUAL",
        legal: "Facturación recurrente. Cancela cuando quieras."
      },
      features: {
        title: "INCLUIDO EN LA MEJORA",
        unlimited_visual: "Sueños y Visualizaciones Ilimitados",
        unlimited_voice: "Conversaciones de Voz Ilimitadas",
        full_vault: "Acceso Total al Historial del Vault",
        priority: "Acceso Prioritario a Nuevos Modos",
        founder_perk: "Badge de Fundador y Círculo Privado"
      },
      manage_btn: "Gestionar Suscripción",
      alerts: {
        login: "Por favor, inicia sesión primero.",
        gateway: "No se pudo conectar con la pasarela de pago.",
        nexus_error: "No se pudo conectar con el servidor Nexus.",
        portal: "Solo para suscripciones activas. Los Fundadores no tienen facturación recurrente."
      }
    }
  }
};