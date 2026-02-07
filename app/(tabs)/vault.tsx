/**
 * (tabs)/vault.tsx — THE SPECTACULAR GALLERY UPGRADE + MATERIALIZATION LINK
 * * Design: Immersive Cards, Glassmorphism, Cyber-Typography.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Share,
  Dimensions,
  StatusBar,
  Linking, // <--- IMPORTANTE: Para abrir el navegador
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL, apiFetch } from '../../utils/api';
import { useAlert } from '../../src/context/AlertContext';

const { width } = Dimensions.get('window');

// --- THEME & COLORS ---
const THEME = {
  bg: '#000000',
  cardBg: '#09090b',
  border: 'rgba(255, 255, 255, 0.08)',
  textMain: '#F8FAFC',
  textSub: '#94A3B8',
  accentJournal: '#38BDF8',
  accentDream: '#818CF8',
  accentLog: '#64748B',
  accentGold: '#F59E0B' // <--- Nuevo color para el Libro
};

const ARCHETYPES = [
  { limit: 0, title: "ECHO WANDERER", icon: "footsteps-outline", color: "#94A3B8", desc: "Beginning the journey inward." },
  { limit: 3, title: "MIND GARDNER", icon: "leaf-outline", color: "#10B981", desc: "Cultivating first insights." },
  { limit: 10, title: "LUCID NAVIGATOR", icon: "compass-outline", color: "#38BDF8", desc: "Mapping the subconscious terrain." },
  { limit: 25, title: "VOID ARCHITECT", icon: "construct-outline", color: "#F59E0B", desc: "Building new mental structures." },
];

const determineArchetype = (count: number) => {
  let arch = ARCHETYPES[0];
  for (let a of ARCHETYPES) {
    if (count >= a.limit) arch = a;
  }
  return arch;
};

// --- IMAGE UTILS ---
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:image')) return url.replace(/\s/g, '');
  if (url.startsWith('http')) return url;
  const cleanPath = url.replace(/^\/+/, '');
  return `${API_URL}/${cleanPath}`;
};

// --- EXPANDABLE TEXT COMPONENT ---
const ExpandableText = ({ text, color, isChat = false }: { text: string; color: string, isChat?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  const cleanText = text.replace(/^"|"$/g, '');
  
  const limit = isChat ? 120 : 150; 
  if (cleanText.length < limit) return <Text style={[styles.summaryText, isChat && styles.chatText]}>{cleanText}</Text>;

  return (
    <View>
      <Text style={[styles.summaryText, isChat && styles.chatText]} numberOfLines={isExpanded ? undefined : 3}>
        {cleanText}
      </Text>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
        <Text style={{ color: color, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {isExpanded ? 'COLLAPSE' : 'READ FULL ENTRY'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function VaultScreen() {
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState('journal');
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [chatItems, setChatItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false); // <--- Estado para el botón mágico
  
  const [displayLimitState, setDisplayLimitState] = useState<Record<string, number>>({
    journal: 10, dream: 10, chats: 10
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDisplayLimitState(prev => ({ ...prev, [tab]: 10 }));
  };

  const totalMemories = vaultItems.length + chatItems.length;
  const currentArchetype = determineArchetype(totalMemories);

  const fetchAllData = async () => {
    try {
      const resVault = await apiFetch('/vault');
      const dataVault = await resVault.json();
      if (resVault.ok) setVaultItems(dataVault);

      const resChat = await apiFetch('/chat/history');
      const dataChat = await resChat.json();
      if (resChat.ok) {
        const aiEntries = dataChat.filter((msg: any) => msg.role === 'assistant');
        setChatItems(aiEntries);
      }
    } catch (e: any) {
      if (e.message === 'SESSION_EXPIRED') return;
      console.error("Vault fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAllData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAllData(); };

  // --- 🪄 LA MAGIA: ABRIR EL LIBRO WEB ---
  const openAtelier = async () => {
    setGeneratingLink(true);
    try {
      // 1. Pedimos a Alice un "Ticket de Entrada" usando POST
      const response = await apiFetch('/auth/generate-shop-ticket', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data && data.url) {
        // 2. Abrimos el navegador del móvil con ese enlace mágico
        await Linking.openURL(data.url);
      } else {
        showAlert("ACCESS DENIED", "Alice could not generate the pass.", "error");
      }
    } catch (error) {
      showAlert("CONNECTION ERROR", "Ensure Alice is running.", "error");
    } finally {
      setGeneratingLink(false);
    }
  };

  const fullList = activeTab === 'chats' ? chatItems : vaultItems.filter(item => {
    const itemMode = item.mode || (item.summary ? 'journal' : 'dream');
    return itemMode === activeTab;
  });
  
  const currentLimit = displayLimitState[activeTab] || 10;
  const visibleList = fullList.slice(0, currentLimit);

  // --- ACTIONS ---
  const handleShareImage = async (imgSource: string | null | undefined) => {
    try {
      const finalUrl = getImageUrl(imgSource);
      if (!finalUrl) { 
        showAlert("IMAGE ERROR", "No visual data found.", "error"); 
        return; 
      }
      const filename = FileSystem.cacheDirectory + "whisper_memory.png";
      if (finalUrl.startsWith('data:image')) {
        const base64Data = finalUrl.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
      } else {
        const download = await FileSystem.downloadAsync(finalUrl, filename);
        if (download.status === 200) await Sharing.shareAsync(download.uri, { mimeType: 'image/png', UTI: 'public.png' });
      }
    } catch (error) { 
        showAlert("EXPORT FAILED", "Could not process image.", "error"); 
    }
  };

  const handleShareText = async (text: string, title: string) => {
    try { 
        await Share.share({ message: `${title}\n\n${text}` }); 
    } catch (error) {
        showAlert("SHARE ERROR", "Text export interrupted.", "error");
    }
  };

  // --- RENDERERS ---

  const renderVisualCard = ({ item }: { item: any }) => {
    const isJournal = activeTab === 'journal';
    const accentColor = isJournal ? THEME.accentJournal : THEME.accentDream;
    
    const dateObj = new Date(item.date);
    const dayNum = dateObj.getDate();
    const monthStr = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    const rawImageSource = item.image_url || item.image || item.dream_image || item.generated_image || item.url;
    const imageUrl = getImageUrl(rawImageSource);

    return (
      <View style={styles.cardContainer}>
        {/* HERO IMAGE SECTION */}
        <View style={styles.imageSection}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.fallbackImage]}>
                <Ionicons name="aperture-outline" size={40} color="#1e293b" />
            </View>
          )}
          
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={{position:'absolute', top:0, width:'100%', height: 80}} />

          {/* Floating Badges */}
          <View style={styles.floatingHeader}>
             <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{dayNum}</Text>
                <View>
                    <Text style={styles.dateMonth}>{monthStr}</Text>
                    <Text style={styles.dateTime}>{timeStr}</Text>
                </View>
             </View>
             {imageUrl && (
                <TouchableOpacity style={styles.iconButton} onPress={() => handleShareImage(rawImageSource)}>
                    <Ionicons name="download-outline" size={18} color="white" />
                </TouchableOpacity>
             )}
          </View>

          <LinearGradient colors={['transparent', '#09090b']} style={{position:'absolute', bottom:0, width:'100%', height: 100}} />
          
          <View style={[styles.tagBadge, { backgroundColor: accentColor }]}>
             <Ionicons name={isJournal ? "book" : "planet"} size={10} color="black" />
             <Text style={styles.tagText}>{activeTab.toUpperCase()}</Text>
          </View>
        </View>

        {/* CONTENT BODY */}
        <View style={styles.cardBody}>
          {isJournal && item.action && (
            <View style={styles.actionBlock}>
              <Ionicons name="sparkles" size={14} color={accentColor} />
              <Text style={[styles.actionText, { color: accentColor }]}>{item.action.toUpperCase()}</Text>
            </View>
          )}
          
          <ExpandableText text={item.summary || item.prompt || ''} color={accentColor} />
          
          <View style={styles.cardFooter}>
             <TouchableOpacity style={styles.shareTextBtn} onPress={() => handleShareText(item.summary || item.prompt || '', "WhisperMind Memory")}>
                <Text style={styles.shareTextLabel}>SHARE TEXT</Text>
                <Ionicons name="share-outline" size={14} color={THEME.textSub} />
             </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderChatCard = ({ item }: { item: any }) => {
    const mode = item.mode || 'default';
    const dateObj = new Date(item.timestamp);
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    return (
      <View style={styles.chatCard}>
        <View style={styles.chatHeader}>
           <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
              <View style={[styles.dot, {backgroundColor: THEME.accentLog}]} />
              <Text style={styles.chatMode}>{mode.toUpperCase()}</Text>
           </View>
           <Text style={styles.chatDate}>{dateStr} • {timeStr}</Text>
        </View>
        <ExpandableText text={item.content || ''} color={THEME.accentLog} isChat={true} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#09090b']} style={StyleSheet.absoluteFill} />

      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>VAULT</Text>
          <Text style={styles.headerSubtitle}>PERMANENT MEMORY</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
           <Ionicons name="sync" size={18} color={THEME.textSub} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleList}
        renderItem={activeTab === 'chats' ? renderChatCard : renderVisualCard}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accentJournal} />}
        ListHeaderComponent={
          <>
            {/* ARCHETYPE WIDGET */}
            <LinearGradient
                colors={['#111827', '#000000']}
                start={{x:0, y:0}} end={{x:1, y:1}}
                style={[styles.archetypeWidget, { borderColor: currentArchetype.color + '30' }]}
            >
               <View style={styles.archRow}>
                  <View style={[styles.archIcon, { backgroundColor: currentArchetype.color + '15' }]}>
                     <Ionicons name={currentArchetype.icon as any} size={22} color={currentArchetype.color} />
                  </View>
                  <View style={{flex:1}}>
                     <Text style={[styles.archTitle, { color: currentArchetype.color }]}>{currentArchetype.title}</Text>
                     <Text style={styles.archSub}>{currentArchetype.desc}</Text>
                  </View>
                  <Text style={styles.countText}>{totalMemories}</Text>
               </View>
               <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min((totalMemories % 10) * 10, 100)}%`, backgroundColor: currentArchetype.color }]} />
               </View>
            </LinearGradient>

            {/* --- 🌟 MATERIALIZE MEMORY BUTTON (NUEVO) --- */}
            <TouchableOpacity 
                style={styles.materializeBtn}
                onPress={openAtelier}
                disabled={generatingLink}
            >
                <LinearGradient
                    colors={['#78350f', '#F59E0B']} // Ámbar/Oro Oscuro
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.materializeGradient}
                >
                    {generatingLink ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="book" size={20} color="white" />
                            <View>
                                <Text style={styles.materializeTitle}>MATERIALIZE MEMORY</Text>
                                <Text style={styles.materializeSub}>OPEN CHRONICLE OF MONTH</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" style={{marginLeft: 'auto'}} />
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
            {/* ------------------------------------------------ */}

            {/* TAB SELECTOR */}
            <View style={styles.tabsWrapper}>
               <TouchableOpacity onPress={() => handleTabChange('journal')} style={[styles.tabBtn, activeTab === 'journal' && styles.tabActive]}>
                  <Text style={[styles.tabLabel, activeTab === 'journal' && {color: THEME.accentJournal}]}>JOURNAL</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => handleTabChange('dream')} style={[styles.tabBtn, activeTab === 'dream' && styles.tabActive]}>
                  <Text style={[styles.tabLabel, activeTab === 'dream' && {color: THEME.accentDream}]}>DREAMS</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => handleTabChange('chats')} style={[styles.tabBtn, activeTab === 'chats' && styles.tabActive]}>
                  <Text style={[styles.tabLabel, activeTab === 'chats' && {color: THEME.textMain}]}>LOGS</Text>
               </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={currentLimit < fullList.length ? (
           <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setDisplayLimitState(prev => ({ ...prev, [activeTab]: (prev[activeTab] || 10) + 10 }))}>
              <Text style={styles.loadMoreText}>LOAD MORE ARCHIVES</Text>
           </TouchableOpacity>
        ) : <View style={{height:50}} />}
        ListEmptyComponent={!loading ? (
            <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={40} color="#334155" />
                <Text style={styles.emptyText}>The vault is empty.</Text>
            </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  headerContainer: { marginTop: 60, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 2 },
  headerSubtitle: { fontSize: 10, color: THEME.textSub, letterSpacing: 4, fontWeight: '700', marginTop: 4 },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },

  // ARCHETYPE
  archetypeWidget: { padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1f2937' },
  archRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  archIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  archTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  archSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  countText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  progressTrack: { height: 3, backgroundColor: '#1f2937', marginTop: 15, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // BOTÓN MATERIALIZE (ESTILO PREMIUM)
  materializeBtn: { borderRadius: 16, marginBottom: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', shadowColor: '#F59E0B', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  materializeGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  materializeTitle: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
  materializeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 9, letterSpacing: 1, marginTop: 2 },

  // TABS
  tabsWrapper: { flexDirection: 'row', marginBottom: 25, backgroundColor: '#0f172a', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1e293b' },
  tabLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#64748B' },

  // VISUAL CARD (SPECTACULAR)
  cardContainer: { backgroundColor: THEME.cardBg, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  imageSection: { height: 280, width: '100%', backgroundColor: '#111827', position: 'relative' },
  fallbackImage: { justifyContent: 'center', alignItems: 'center' },
  
  floatingHeader: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dateDay: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  dateMonth: { fontSize: 9, fontWeight: 'bold', color: '#cbd5e1' },
  dateTime: { fontSize: 9, color: '#94a3b8' },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  tagBadge: { position: 'absolute', bottom: 15, left: 15, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 9, fontWeight: '900', color: 'black', letterSpacing: 1 },

  cardBody: { padding: 20, paddingTop: 10 },
  actionBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  actionText: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  summaryText: { color: '#e2e8f0', fontSize: 15, lineHeight: 24, fontWeight: '300' },
  chatText: { fontFamily: 'Courier', fontSize: 13, color: '#94a3b8' }, // Monospaced feel for logs

  cardFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#1e293b', flexDirection: 'row', justifyContent: 'flex-end' },
  shareTextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareTextLabel: { fontSize: 10, fontWeight: 'bold', color: THEME.textSub, letterSpacing: 1 },

  // CHAT CARD
  chatCard: { backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 15, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chatMode: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  chatDate: { fontSize: 10, color: '#475569' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  loadMoreBtn: { padding: 20, alignItems: 'center' },
  loadMoreText: { fontSize: 10, fontWeight: 'bold', color: '#475569', letterSpacing: 2 },
  emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
  emptyText: { marginTop: 10, color: '#64748B' }
});