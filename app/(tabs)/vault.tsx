import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    RefreshControl,
    Platform,
    TouchableOpacity,
    Alert,
    Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// 👇 CORRECCIÓN AQUÍ: Usamos '../../' para salir de (tabs) y de app, y entrar en src
import { shareImage } from '../../src/services/shareService';

const API_URL = 'https://wishpermind-backend.onrender.com';

const ARCHETYPES = [
    { limit: 0, title: "Echo Wanderer", icon: "footsteps-outline", color: "#94A3B8", desc: "Beginning the journey inward." },
    { limit: 3, title: "Mind Gardner", icon: "leaf-outline", color: "#10B981", desc: "Cultivating first insights." },
    { limit: 10, title: "Lucid Navigator", icon: "compass-outline", color: "#38BDF8", desc: "Mapping the subconscious terrain." },
    { limit: 25, title: "Void Architect", icon: "construct-outline", color: "#F59E0B", desc: "Building new mental structures." },
];

const MODE_COLORS = {
    default: '#38BDF8', calm: '#10B981', win: '#F59E0B', sleep: '#8B5CF6', dream: '#6366F1', morning: '#F472B6', silent_comfort: '#94A3B8'
};

const determineArchetype = (count) => {
    let arch = ARCHETYPES[0];
    for (let a of ARCHETYPES) {
        if (count >= a.limit) arch = a;
    }
    return arch;
};

// Componente Texto Expandible
const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
   
    if (text.length < 100) return <Text style={styles.previewText}>{text}</Text>;

    return (
        <View>
            <Text style={styles.previewText} numberOfLines={isExpanded ? undefined : 3} ellipsizeMode="tail">
                {text}
            </Text>
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginBottom: 15 }}>
                <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold' }}>
                    {isExpanded ? 'SHOW LESS' : 'READ MORE'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default function VaultScreen() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentArchetype, setCurrentArchetype] = useState(ARCHETYPES[0]);

    const getAuthToken = async () => {
        if (Platform.OS === 'web') return localStorage.getItem('user_token');
        return await SecureStore.getItemAsync('user_token');
    };

    const fetchVault = async () => {
        try {
            const token = await getAuthToken();
            if (!token) { setLoading(false); return; }

            const res = await fetch(`${API_URL}/chat/history`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
           
            if (res.ok) {
                const aiEntries = data.filter((msg) => msg.role === 'assistant');
                setSessions(aiEntries);
                setCurrentArchetype(determineArchetype(aiEntries.length));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchVault(); }, []));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchVault(); }, []);

    // --- FUNCIÓN DE COMPARTIR ---
    const shareArtifact = async (imageUrl) => {
        if (!imageUrl) return;

        // Detectamos si es Base64 (comienza con data:) o URL remota
        const isBase64 = imageUrl.startsWith('data:') || !imageUrl.startsWith('http');
        
        // Llamamos al arquitecto (el servicio) para que gestione el envío
        await shareImage(imageUrl, isBase64);
    };

    const shareText = async (content, date, mode) => {
        try {
            await Share.share({
                message: `🧠 WHISPER MIND LOG\n📅 ${date}\nMODE: ${mode.toUpperCase()}\n\n${content}`,
                title: `WhisperMind Log - ${date}`
            });
        } catch (error) { Alert.alert("Error", "Could not share."); }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>THE VAULT</Text>
                <Text style={styles.headerSubtitle}>SAVED CONSCIOUSNESS</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}>
                {!loading && (
                    <LinearGradient colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.8)']} style={styles.archetypeCard}>
                        <View style={styles.archHeader}>
                            <Ionicons name={currentArchetype.icon} size={32} color={currentArchetype.color} />
                            <View style={{marginLeft: 15}}>
                                <Text style={[styles.archTitle, { color: currentArchetype.color }]}>{currentArchetype.title.toUpperCase()}</Text>
                                <Text style={styles.archLevel}>Level {Math.floor(sessions.length / 3) + 1}</Text>
                            </View>
                        </View>
                        <Text style={styles.archDesc}>{currentArchetype.desc}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min((sessions.length % 10) * 10, 100)}%`, backgroundColor: currentArchetype.color }]} />
                        </View>
                        <Text style={styles.statsText}>{sessions.length} Memories Stored</Text>
                    </LinearGradient>
                )}
                {loading ? <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: 50}} /> : sessions.map((item, index) => {
                    const modeColor = MODE_COLORS[item.mode] || MODE_COLORS.default;
                    const dateObj = new Date(item.timestamp);
                    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                   
                    return (
                        <View key={index} style={[styles.card, { borderLeftColor: modeColor }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.badgeContainer}>
                                    <View style={[styles.dot, { backgroundColor: modeColor }]} />
                                    <Text style={[styles.modeLabel, { color: modeColor }]}>{item.mode ? item.mode.toUpperCase() : "ARCHIVE"}</Text>
                                </View>
                                <Text style={styles.dateText}>{dateStr} • {timeStr}</Text>
                            </View>
                           
                            <ExpandableText text={item.content} />
                           
                            {item.image_url && (
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: item.image_url }} style={styles.previewImage} />
                                    <View style={styles.imageOverlay}><Ionicons name="color-palette" size={12} color="white" /><Text style={styles.imageTag}>DREAM ART</Text></View>
                                </View>
                            )}
                            <View style={styles.actionsBar}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => shareText(item.content, `${dateStr} ${timeStr}`, item.mode || 'default')}>
                                    <Ionicons name="share-social-outline" size={18} color="#94A3B8" /><Text style={styles.actionText}>EXPORT LOG</Text>
                                </TouchableOpacity>
                                {item.image_url && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => shareArtifact(item.image_url)}>
                                        <Ionicons name="download-outline" size={18} color="#94A3B8" /><Text style={styles.actionText}>SAVE / SHARE</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
                <View style={{height: 100}} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { marginTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 1 },
    headerSubtitle: { fontSize: 10, color: '#64748B', letterSpacing: 3, marginTop: 5 },
    scrollContent: { paddingHorizontal: 20 },
    archetypeCard: { padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    archHeader: { flexDirection: 'row', alignItems: 'center' },
    archTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    archLevel: { color: '#94A3B8', fontSize: 12 },
    archDesc: { color: '#CBD5E1', marginTop: 10, fontStyle: 'italic', fontSize: 13 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 15, overflow: 'hidden' },
    progressFill: { height: '100%' },
    statsText: { color: '#64748B', fontSize: 10, marginTop: 8, textAlign: 'right' },
    card: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, padding: 15, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    modeLabel: { fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
    dateText: { color: '#64748B', fontSize: 10 },
    previewText: { color: '#E2E8F0', fontSize: 14, lineHeight: 22, marginBottom: 15, opacity: 0.9 },
    imageWrapper: { marginBottom: 15, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: 180, resizeMode: 'cover' },
    imageOverlay: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    imageTag: { color: 'white', fontSize: 9, fontWeight: 'bold' },
    actionsBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, gap: 20 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }
});