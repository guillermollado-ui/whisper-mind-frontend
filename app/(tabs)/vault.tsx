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
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { shareImage } from '../../src/services/shareService';

const API_URL = 'https://wishpermind-backend.onrender.com';

// --- COLORES DE MODOS ---
const MODE_COLORS = {
    default: '#38BDF8', calm: '#10B981', win: '#F59E0B', sleep: '#8B5CF6', 
    dream: '#6366F1', morning: '#F472B6', flash: '#EF4444', journal: '#0EA5E9'
};

// --- ARQUETIPOS ---
const ARCHETYPES = [
  { limit: 0, title: "Echo Wanderer", icon: "footsteps-outline", color: "#94A3B8", desc: "Beginning the journey inward." },
  { limit: 3, title: "Mind Gardner", icon: "leaf-outline", color: "#10B981", desc: "Cultivating first insights." },
  { limit: 10, title: "Lucid Navigator", icon: "compass-outline", color: "#38BDF8", desc: "Mapping the subconscious terrain." },
  { limit: 25, title: "Void Architect", icon: "construct-outline", color: "#F59E0B", desc: "Building new mental structures." },
];

const determineArchetype = (count) => {
  let arch = ARCHETYPES[0];
  for (let a of ARCHETYPES) {
    if (count >= a.limit) arch = a;
  }
  return arch;
};

// --- COMPONENTE TEXTO EXPANDIBLE ---
const ExpandableText = ({ text, color }) => {
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
          {isExpanded ? 'READ LESS' : 'READ MORE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function VaultScreen() {
  const [activeTab, setActiveTab] = useState('journal'); 
  const [vaultItems, setVaultItems] = useState([]); 
  const [chatItems, setChatItems] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // PAGINACIÓN
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
      setDisplayLimit(10);
  }, [activeTab]);
  
  const totalMemories = vaultItems.length + chatItems.length;
  const currentArchetype = determineArchetype(totalMemories);

  const getAuthToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('user_token');
    return await SecureStore.getItemAsync('user_token');
  };

  const fetchAllData = async () => {
    try {
      const token = await getAuthToken();
      if (!token) { setLoading(false); return; }

      // 1. CARGAR GALERÍA
      const resVault = await fetch(`${API_URL}/vault`, { headers: { 'Authorization': `Bearer ${token}` } });
      const dataVault = await resVault.json();
      if (resVault.ok) setVaultItems(dataVault);

      // 2. CARGAR HISTORIAL
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

  // --- LÓGICA DE DATOS VISIBLES ---
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

  const handleShareImage = async (url) => { await shareImage(url, url.startsWith('data:')); };
  const handleShareText = async (text, title) => { try { await Share.share({ message: `${title}\n\n${text}` }); } catch (error) { Alert.alert("Error sharing"); } };

  // --- RENDER VISUAL CARD (FECHA BONITA AÑADIDA) ---
  const renderVisualCard = ({ item }) => {
    const isJournal = activeTab === 'journal';
    const accentColor = isJournal ? '#38BDF8' : '#6366F1'; 
    
    // FORMATO DE FECHA BONITO
    const dateObj = new Date(item.date);
    const dayNum = dateObj.getDate();
    const monthStr = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    return (
        <View style={[styles.cardContainer, { borderLeftColor: accentColor }]}>
            <View style={styles.cardHeader}>
                {/* LADO IZQUIERDO: ETIQUETA */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <View style={[styles.dot, { backgroundColor: accentColor }]} />
                    <Text style={[styles.cardTag, { color: accentColor }]}>{activeTab.toUpperCase()}</Text>
                </View>

                {/* LADO DERECHO: FECHA BONITA */}
                <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{dayNum}</Text>
                    <View style={{alignItems: 'flex-start'}}>
                        <Text style={styles.dateMonth}>{monthStr}</Text>
                        <Text style={styles.dateTime}>{weekday} • {timeStr}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.textContainer}>
                <ExpandableText text={isJournal ? item.summary : item.prompt} color={accentColor} />
                {isJournal && item.action && (
                    <View style={styles.actionBox}>
                        <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
                        <Text style={styles.actionText}>{item.action}</Text>
                    </View>
                )}
            </View>

            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.image_url || item.url }} style={styles.cardImage} />
                <View style={styles.imageOverlay}>
                    <Ionicons name="color-palette" size={12} color="white" />
                    <Text style={styles.imageTag}>{isJournal ? "EMOTIONAL ART" : "DREAM ART"}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.footerBtn} onPress={() => handleShareText(isJournal ? item.summary : item.prompt, "WhisperMind Log")}>
                    <Ionicons name="share-social-outline" size={16} color="#94A3B8" />
                    <Text style={styles.footerBtnText}>EXPORT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerBtn} onPress={() => handleShareImage(item.image_url || item.url)}>
                    <Ionicons name="download-outline" size={16} color="#94A3B8" />
                    <Text style={styles.footerBtnText}>SAVE ART</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  const renderChatCard = ({ item }) => {
    const mode = item.mode || 'default';
    const color = MODE_COLORS[mode] || MODE_COLORS.default;
    const dateObj = new Date(item.timestamp);
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    return (
        <View style={[styles.chatCard, { borderLeftColor: color }]}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={color} />
                    <Text style={[styles.modeLabel, { color: color }]}>{mode.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateTextSimple}>{dateStr} • {timeStr}</Text>
            </View>
            <ExpandableText text={item.content} color={color} />
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
        <Text style={styles.headerTitle}>THE VAULT</Text>
        <Text style={styles.headerSubtitle}>MEMORY ARCHIVE</Text>
      </View>

      <FlatList
        data={visibleList}
        renderItem={activeTab === 'chats' ? renderChatCard : renderVisualCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        
        ListHeaderComponent={
            <>
                {/* ARQUETIPO */}
                <LinearGradient colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.8)']} style={styles.archetypeCard}>
                    <View style={styles.archHeader}>
                        <Ionicons name={currentArchetype.icon} size={32} color={currentArchetype.color} />
                        <View style={{marginLeft: 15}}>
                            <Text style={[styles.archTitle, { color: currentArchetype.color }]}>{currentArchetype.title.toUpperCase()}</Text>
                            <Text style={styles.archLevel}>Level {Math.floor(totalMemories / 5) + 1}</Text>
                        </View>
                    </View>
                    <Text style={styles.archDesc}>{currentArchetype.desc}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min((totalMemories % 10) * 10, 100)}%`, backgroundColor: currentArchetype.color }]} />
                    </View>
                    <Text style={styles.statsText}>{totalMemories} Memories Stored</Text>
                </LinearGradient>

                {/* TABS */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'journal' && styles.activeTab]} onPress={() => setActiveTab('journal')}>
                        <Ionicons name="book-outline" size={16} color={activeTab === 'journal' ? '#38BDF8' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'journal' && styles.activeTabText]}>JOURNAL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tab, activeTab === 'dream' && styles.activeTabDream]} onPress={() => setActiveTab('dream')}>
                        <Ionicons name="moon-outline" size={16} color={activeTab === 'dream' ? '#6366F1' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'dream' && styles.activeTabTextDream]}>DREAMS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tab, activeTab === 'chats' && styles.activeTabChat]} onPress={() => setActiveTab('chats')}>
                        <Ionicons name="chatbubbles-outline" size={16} color={activeTab === 'chats' ? '#94A3B8' : '#64748B'} />
                        <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabTextChat]}>LOGS</Text>
                    </TouchableOpacity>
                </View>
            </>
        }
        
        ListEmptyComponent={
            !loading && (
                <View style={styles.emptyState}>
                    <Ionicons name="file-tray-outline" size={48} color="#334155" />
                    <Text style={styles.emptyText}>No {activeTab} found.</Text>
                </View>
            )
        }

        ListFooterComponent={
             showLoadMore && (
                 <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                     <Text style={styles.loadMoreText}>LOAD OLDER MEMORIES</Text>
                     <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                 </TouchableOpacity>
             )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { marginTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 1 },
  headerSubtitle: { fontSize: 10, color: '#64748B', letterSpacing: 3, marginTop: 5 },
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
  
  // --- NUEVOS ESTILOS PARA LA FECHA BONITA ---
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDay: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  dateMonth: { color: '#E2E8F0', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dateTime: { color: '#94A3B8', fontSize: 10, fontWeight: '500' },
  // -------------------------------------------

  dateTextSimple: { color: '#64748B', fontSize: 10 }, // Para los chats normales

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
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeLabel: { fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  actionsBarChat: { marginTop: 10, alignItems: 'flex-end' },
  actionBtn: { padding: 5 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#475569', marginTop: 10 },

  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, marginBottom: 20 },
  loadMoreText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }
});