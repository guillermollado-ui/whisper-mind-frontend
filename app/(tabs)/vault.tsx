import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Alert,
  FlatList,
  Share,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';

// 🌍 IMPORTACIÓN DEL MOTOR DE IDIOMAS
import { useLanguage } from '../../src/context/LanguageContext';
// ✅ [NUEVO] Importamos la Guía de Iniciación
import InitiationOverlay from '../../components/InitiationOverlay';

const API_URL = 'https://wishpermind-backend.onrender.com';

// --- COLORES DE MODOS ---
const MODE_COLORS = {
  default: '#38BDF8', calm: '#10B981', win: '#F59E0B', sleep: '#8B5CF6', 
  dream: '#6366F1', morning: '#F472B6', flash: '#EF4444', journal: '#0EA5E9'
};

// --- LÍMITES DE ARQUETIPOS ---
const ARCHETYPE_LIMITS = [0, 3, 10, 25];

// ✅ [NUEVO] Componente para mostrar los "Ecos" (Resonancias)
const ResonanceBadge = ({ counts }) => {
  if (!counts) return null;
  
  // Total de interacciones
  const total = (counts.see || 0) + (counts.resonate || 0) + (counts.hold || 0);
  if (total === 0) return null;

  return (
    <View style={styles.badgeContainer}>
      <Ionicons name="finger-print" size={12} color="rgba(255,255,255,0.6)" />
      <Text style={styles.badgeText}>
        {total} {total === 1 ? 'Eco' : 'Ecos'}
      </Text>
      {/* Desglose sutil: Puntos de color según intensidad */}
      <View style={{flexDirection: 'row', marginLeft: 6, gap: 2}}>
        {counts.hold > 0 && <View style={[styles.dotIndicator, {backgroundColor: '#F59E0B'}]} />}
        {counts.resonate > 0 && <View style={[styles.dotIndicator, {backgroundColor: '#10B981'}]} />}
        {counts.see > 0 && <View style={[styles.dotIndicator, {backgroundColor: '#FFFFFF'}]} />}
      </View>
    </View>
  );
};

// --- COMPONENTE TEXTO EXPANDIBLE ---
const ExpandableText = ({ text, color, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  const cleanText = text.replace(/^"|"$/g, ''); 
  if (cleanText.length < 80) return <Text style={styles.summaryText}>{cleanText}</Text>;
  return (
    <View>
      <Text style={styles.summaryText} numberOfLines={isExpanded ? undefined : 3}>
        {cleanText}
      </Text>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginTop: 5, marginBottom: 10 }}>
        <Text style={{ color: color, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
          {isExpanded ? t('vault.read_less') : t('vault.read_more')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function VaultScreen() {
  const { t, language } = useLanguage(); // 🌍 Usamos el hook de idioma
  const [activeTab, setActiveTab] = useState('journal'); 
  const [vaultItems, setVaultItems] = useState([]); 
  const [chatItems, setChatItems] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  
  // 🔔 [NUEVO] Estado de la Alarma/Ritual
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  useEffect(() => {
    setDisplayLimit(10);
    loadAlarmStatus();
  }, [activeTab]);

  const loadAlarmStatus = async () => {
    try {
      const saved = await SecureStore.getItemAsync('whisper_alarm_enabled');
      setIsAlarmActive(saved === 'true');
    } catch (e) { console.log("Error loading alarm"); }
  };

  const toggleAlarm = async () => {
    const newState = !isAlarmActive;
    setIsAlarmActive(newState);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await SecureStore.setItemAsync('whisper_alarm_enabled', newState.toString());
    } catch (e) { console.error(e); }
  };
  
  const totalMemories = vaultItems.length + chatItems.length;

  // 🧠 Determinación de Arquetipo Dinámica por Idioma
  const getArchetypeData = () => {
    const archetypes = t('vault.archetypes');
    const icons = ["footsteps-outline", "leaf-outline", "compass-outline", "construct-outline"];
    const colors = ["#94A3B8", "#10B981", "#38BDF8", "#F59E0B"];
    
    let index = 0;
    ARCHETYPE_LIMITS.forEach((limit, i) => {
      if (totalMemories >= limit) index = i;
    });

    return {
      ...archetypes[index],
      icon: icons[index],
      color: colors[index]
    };
  };

  const currentArchetype = getArchetypeData();

  const getAuthToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('user_token');
    return await SecureStore.getItemAsync('user_token');
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    if (url.startsWith('/images/')) return `${API_URL}${url}`;
    return url;
  };

  const fetchAllData = async () => {
    try {
      const token = await getAuthToken();
      if (!token) { setLoading(false); return; }

      // 1. Cargar VAULT
      const resVault = await fetch(`${API_URL}/vault`, { headers: { 'Authorization': `Bearer ${token}` } });
      const dataVault = await resVault.json();
      
      // 🔍 [DEBUG] INSPECCIÓN DE DATOS RECIBIDOS (Para consola de PC)
      console.log("DATOS DEL VAULT (DEBUG):", JSON.stringify(dataVault, null, 2));
      
      if (resVault.ok) {
        // ✅ [NUEVO] Enriquecer con datos de resonancia (Ecos)
        const enrichedVault = await Promise.all(dataVault.map(async (item) => {
            if (item.vibration_id) {
                try {
                    const resCount = await fetch(`${API_URL}/api/resonance/${item.vibration_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resCount.ok) {
                        const countData = await resCount.json();
                        return { ...item, resonanceCounts: countData.counts };
                    }
                } catch (e) { return item; }
            }
            return item;
        }));
        setVaultItems(enrichedVault);
      }

      // 2. Cargar CHATS
      const resChat = await fetch(`${API_URL}/chat/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const dataChat = await resChat.json();
      if (resChat.ok) {
          const aiEntries = dataChat.filter(msg => msg.role === 'assistant');
          setChatItems(aiEntries);
      }
    } catch (e) { console.error("Error fetching data:", e); } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAllData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAllData(); };

  const getAllDataForTab = () => {
      if (activeTab === 'chats') return chatItems;
      return vaultItems.filter(item => {
          const itemMode = item.mode || (item.summary ? 'journal' : 'dream');
          return itemMode === activeTab;
      });
  };

  const fullList = getAllDataForTab();
  const visibleList = fullList.slice(0, displayLimit); 
  const showLoadMore = fullList.length > displayLimit; 

  const handleLoadMore = () => {
      setDisplayLimit(prev => prev + 10);
  };

  // ✅ [CIRUGÍA AVANZADA WEB] Menú compartir nativo y descargas automatizadas
  const handleShareImage = async (url) => {
    try {
      const finalUrl = getImageUrl(url);
      if (!finalUrl) {
          Alert.alert("Error", t('vault.alerts.no_image'));
          return;
      }

      // 🛡️ TRIPLE RED DE SEGURIDAD PARA LA WEB
      if (Platform.OS === 'web') {
        try {
          // 1. Convertimos la imagen a un archivo (Blob) en la memoria temporal
          const response = await fetch(finalUrl);
          const blob = await response.blob();
          const file = new File([blob], `whisper_memory_${Date.now()}.png`, { type: blob.type || 'image/png' });

          // 2. Intentamos invocar el menú nativo "Compartir" de la Web (Safari, Edge, Chrome Móvil)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Whisper Mind Memory',
              text: language === 'es' ? 'Mi recuerdo en Whisper Mind' : 'My Whisper Mind memory'
            });
          } else {
            // 3. Si no tiene menú nativo, forzamos descarga automática a la carpeta Descargas
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(objectUrl);
            Alert.alert(
              language === 'es' ? "DESCARGADO" : "DOWNLOADED",
              language === 'es' ? "Imagen guardada en tus descargas." : "Image saved to your downloads."
            );
          }
        } catch (err) {
          // 4. Si el servidor bloquea la lectura por seguridad, la pestaña nueva es la única salida.
          window.open(finalUrl, '_blank');
          Alert.alert(
            language === 'es' ? "IMAGEN ABIERTA" : "IMAGE OPENED",
            language === 'es' ? "Haz clic derecho (o mantén pulsado) para guardarla." : "Right-click (or long-press) to save the image."
          );
        }
        return; // Terminamos la ejecución de web
      }

      // 📱 LÓGICA ORIGINAL PARA MÓVIL
      const filename = FileSystem.cacheDirectory + "whisper_memory.png";
      if (finalUrl.startsWith('data:image')) {
        const base64Data = finalUrl.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
      } else {
        const download = await FileSystem.downloadAsync(finalUrl, filename);
        if (download.status === 200) {
          await Sharing.shareAsync(download.uri, {
            mimeType: 'image/png',
            dialogTitle: language === 'es' ? 'Comparte tu memoria de Whisper Mind' : 'Share your Whisper Mind memory',
          });
        }
      }
    } catch (error) {
      Alert.alert("Export Error", t('vault.alerts.export_error'));
    }
  };

  const handleShareText = async (text, title) => { 
    try { await Share.share({ message: `${title}\n\n${text}` }); } 
    catch (error) { Alert.alert(t('vault.alerts.share_error')); } 
  };

  const renderVisualCard = ({ item }) => {
    const isJournal = activeTab === 'journal';
    const accentColor = isJournal ? '#38BDF8' : '#6366F1'; 
    const dateObj = new Date(item.date);
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    const dayNum = dateObj.getDate();
    const monthStr = dateObj.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
    const weekday = dateObj.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    return (
        <View style={[styles.cardContainer, { borderLeftColor: accentColor }]}>
            <View style={styles.cardHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <View style={[styles.dot, { backgroundColor: accentColor }]} />
                    <Text style={[styles.cardTag, { color: accentColor }]}>{t(`vault.tabs.${activeTab}`)}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{dayNum}</Text>
                    <View style={{alignItems: 'flex-start'}}>
                        <Text style={styles.dateMonth}>{monthStr}</Text>
                        <Text style={styles.dateTime}>{weekday} • {timeStr}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.textContainer}>
                <ExpandableText text={item.summary || item.prompt} color={accentColor} t={t} />
                
                {/* 🔍 [CHIVATO VISUAL] Si estás en modo sueño y falta el ID, aparecerá este aviso */}
                {activeTab === 'dream' && !item.vibration_id && (
                  <Text style={styles.debugText}>⚠️ NO LINKED TO NETWORK</Text>
                )}

                {isJournal && item.action && (
                    <View style={styles.actionBox}>
                        <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
                        <Text style={styles.actionText}>{item.action}</Text>
                    </View>
                )}
                
                {/* Insignia de Ecos (Resonancia) */}
                <View style={{marginTop: 10}}>
                   <ResonanceBadge counts={item.resonanceCounts} />
                </View>
            </View>

            <View style={styles.imageWrapper}>
                <Image source={{ uri: getImageUrl(item.image_url || item.url) }} style={styles.cardImage} />
                <View style={styles.imageOverlay}>
                    <Ionicons name="color-palette" size={12} color="white" />
                    <Text style={styles.imageTag}>{isJournal ? t('vault.tags.journal') : t('vault.tags.dream')}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.footerBtn} onPress={() => handleShareText(item.summary || item.prompt, "WhisperMind Log")}>
                    <Ionicons name="share-social-outline" size={16} color="#94A3B8" />
                    <Text style={styles.footerBtnText}>{t('vault.btns.export')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerBtn} onPress={() => handleShareImage(item.image_url || item.url)}>
                    <Ionicons name="download-outline" size={16} color="#94A3B8" />
                    <Text style={styles.footerBtnText}>{t('vault.btns.save_art')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  const renderChatCard = ({ item }) => {
    const mode = item.mode || 'default';
    const color = MODE_COLORS[mode] || MODE_COLORS.default;
    const dateObj = new Date(item.timestamp);
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    const dateStr = dateObj.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    return (
        <View style={[styles.chatCard, { borderLeftColor: color }]}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeContainerChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={color} />
                    <Text style={[styles.modeLabel, { color: color }]}>{mode.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateTextSimple}>{dateStr} • {timeStr}</Text>
            </View>
            <ExpandableText text={item.content} color={color} t={t} />
            <View style={styles.actionsBarChat}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShareText(item.content, `Log: ${dateStr}`)}>
                    <Ionicons name="share-outline" size={16} color="#64748B" />
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View>
            <Text style={styles.headerTitle}>{t('vault.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('vault.subtitle')}</Text>
          </View>
          
          {/* 🔔 [NUEVO] Switch de Alarma/Rituales en el Header */}
          <View style={styles.alarmBox}>
            <Ionicons 
              name={isAlarmActive ? "notifications" : "notifications-off-outline"} 
              size={14} 
              color={isAlarmActive ? "#F59E0B" : "#475569"} 
            />
            <Switch
              value={isAlarmActive}
              onValueChange={toggleAlarm}
              trackColor={{ false: "#1E293B", true: "rgba(245, 158, 11, 0.3)" }}
              thumbColor={isAlarmActive ? "#F59E0B" : "#94A3B8"}
              style={{ transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={visibleList}
        renderItem={activeTab === 'chats' ? renderChatCard : renderVisualCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListHeaderComponent={
            <>
                <LinearGradient colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.8)']} style={styles.archetypeCard}>
                    <View style={styles.archHeader}>
                        <Ionicons name={currentArchetype.icon} size={32} color={currentArchetype.color} />
                        <View style={{marginLeft: 15}}>
                            <Text style={[styles.archTitle, { color: currentArchetype.color }]}>{currentArchetype.title.toUpperCase()}</Text>
                            <Text style={styles.archLevel}>{t('vault.level')} {Math.floor(totalMemories / 5) + 1}</Text>
                        </View>
                    </View>
                    <Text style={styles.archDesc}>{currentArchetype.desc}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min((totalMemories % 10) * 10, 100)}%`, backgroundColor: currentArchetype.color }]} />
                    </View>
                    <Text style={styles.statsText}>{totalMemories} {t('vault.memories_stored')}</Text>
                </LinearGradient>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'journal' && styles.activeTab]} onPress={() => setActiveTab('journal')}>
                        <Ionicons name="book-outline" size={16} color={activeTab === 'journal' ? '#38BDF8' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'journal' && styles.activeTabText]}>{t('vault.tabs.journal')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'dream' && styles.activeTabDream]} onPress={() => setActiveTab('dream')}>
                        <Ionicons name="moon-outline" size={16} color={activeTab === 'dream' ? '#6366F1' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'dream' && styles.activeTabTextDream]}>{t('vault.tabs.dream')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'chats' && styles.activeTabChat]} onPress={() => setActiveTab('chats')}>
                        <Ionicons name="chatbubbles-outline" size={16} color={activeTab === 'chats' ? '#94A3B8' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabTextChat]}>{t('vault.tabs.chats')}</Text>
                    </TouchableOpacity>
                </View>
            </>
        }
        ListEmptyComponent={
            !loading && (
                <View style={styles.emptyState}>
                    <Ionicons name="file-tray-outline" size={48} color="#334155" />
                    <Text style={styles.emptyText}>{t('vault.empty_state')}</Text>
                </View>
            )
        }
        ListFooterComponent={
             showLoadMore && (
                 <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                     <Text style={styles.loadMoreText}>{t('vault.load_more')}</Text>
                     <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                 </TouchableOpacity>
             )
        }
      />

      {/* ✅ Guía de Iniciación VAULT (Definitiva) */}
      <InitiationOverlay 
        screenName="vault" 
        steps={language === 'es' ? [
          { 
            icon: "file-tray-full", 
            title: "Tu Memoria Eterna", 
            desc: "Aquí reside todo lo que has vivido. Nada se pierde, todo se transforma." 
          },
          { 
            icon: "albums", 
            title: "Filtros de Realidad", 
            desc: "Usa las pestañas superiores para navegar entre tus Diarios, Sueños y Chats pasados." 
          },
          { 
            icon: "download-outline", 
            title: "Legado y Descarga", 
            desc: "Puedes descargar cualquier imagen o texto a tu dispositivo. Lo que Alice crea para ti, te pertenece." 
          }
        ] : [
          { 
            icon: "file-tray-full", 
            title: "Your Eternal Memory", 
            desc: "Everything you have lived resides here. Nothing is lost; all is transformed." 
          },
          { 
            icon: "albums", 
            title: "Reality Filters", 
            desc: "Use the top tabs to navigate between your past Journals, Dreams, and Chats." 
          },
          { 
            icon: "download-outline", 
            title: "Legacy & Download", 
            desc: "You can download any image or text to your device. What Alice creates for you, belongs to you." 
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { marginTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 1 },
  headerSubtitle: { fontSize: 10, color: '#64748B', letterSpacing: 3, marginTop: 5 },
  alarmBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(30, 41, 59, 0.5)', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  archetypeCard: { padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  archHeader: { flexDirection: 'row', alignItems: 'center' },
  archTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  archLevel: { color: '#94A3B8', fontSize: 12 },
  archDesc: { color: '#CBD5E1', marginTop: 10, fontStyle: 'italic', fontSize: 13 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 15, overflow: 'hidden' },
  progressFill: { height: '100%' },
  statsText: { color: '#64748B', fontSize: 10, marginTop: 8, textAlign: 'right' },
  tabsContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(30, 41, 59, 0.3)' },
  activeTab: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  activeTabText: { color: '#38BDF8' },
  activeTabDream: { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
  activeTabTextDream: { color: '#6366F1' },
  activeTabChat: { borderColor: '#94A3B8', backgroundColor: 'rgba(148, 163, 184, 0.1)' },
  activeTabTextChat: { color: '#E2E8F0' },
  tabText: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardContainer: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, marginBottom: 20, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardTag: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDay: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  dateMonth: { color: '#E2E8F0', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dateTime: { color: '#94A3B8', fontSize: 10, fontWeight: '500' },
  dateTextSimple: { color: '#64748B', fontSize: 10 },
  textContainer: { paddingHorizontal: 15, paddingBottom: 15 },
  summaryText: { color: '#E2E8F0', fontSize: 14, lineHeight: 22 },
  actionBox: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 8 },
  actionText: { color: '#F59E0B', fontSize: 12, fontStyle: 'italic', flex: 1 },
  imageWrapper: { width: '100%', height: 200, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  imageTag: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', padding: 12 },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  chatCard: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, marginBottom: 15, padding: 15, borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badgeContainerChat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeLabel: { fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  actionsBarChat: { marginTop: 10, alignItems: 'flex-end' },
  actionBtn: { padding: 5 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#475569', marginTop: 10 },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, marginBottom: 20 },
  loadMoreText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  badgeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  badgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginLeft: 6, fontWeight: 'bold' },
  dotIndicator: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.8 },
  debugText: { color: '#EF4444', fontSize: 9, fontWeight: '900', marginTop: 5, letterSpacing: 1 }
});