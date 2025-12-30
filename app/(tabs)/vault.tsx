import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// ⚠️ URL DE RENDER
const API_URL = 'https://wishpermind-backend.onrender.com';
const SESSION_ID = 'user-premium-1';

// 🔮 ARQUETIPOS DINÁMICOS (Identity Evolution)
const ARCHETYPES = [
    { limit: 0, title: "Echo Wanderer", icon: "footsteps-outline", color: "#94A3B8", desc: "Beginning the journey inward." },
    { limit: 3, title: "Mind Gardner", icon: "leaf-outline", color: "#10B981", desc: "Cultivating first insights." },
    { limit: 10, title: "Lucid Navigator", icon: "compass-outline", color: "#38BDF8", desc: "Mapping the subconscious terrain." },
    { limit: 25, title: "Void Architect", icon: "construct-outline", color: "#F59E0B", desc: "Building new mental structures." },
];

export default function VaultScreen() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentArchetype, setCurrentArchetype] = useState(ARCHETYPES[0]);

    const fetchVault = async () => {
        try {
            const res = await fetch(`${API_URL}/vault/${SESSION_ID}`);
            const data = await res.json();
            setSessions(data);
            determineArchetype(data.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const determineArchetype = (count: number) => {
        let arch = ARCHETYPES[0];
        for (let a of ARCHETYPES) {
            if (count >= a.limit) arch = a;
        }
        setCurrentArchetype(arch);
    };

    useFocusEffect(useCallback(() => { fetchVault(); }, []));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVault();
    }, []);

    const getMoodColor = (score: number) => {
        if (score >= 8) return '#10B981'; // Green
        if (score >= 5) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>THE VAULT</Text>
                <Text style={styles.headerSubtitle}>SAVED CONSCIOUSNESS</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {/* 🆔 IDENTITY CARD (Visualización del Arquetipo) */}
                {!loading && (
                    <LinearGradient colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.8)']} style={styles.archetypeCard}>
                        <View style={styles.archHeader}>
                            <Ionicons name={currentArchetype.icon as any} size={32} color={currentArchetype.color} />
                            <View style={{marginLeft: 15}}>
                                <Text style={[styles.archTitle, { color: currentArchetype.color }]}>{currentArchetype.title.toUpperCase()}</Text>
                                <Text style={styles.archLevel}>Level {Math.floor(sessions.length / 3) + 1}</Text>
                            </View>
                        </View>
                        <Text style={styles.archDesc}>{currentArchetype.desc}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min((sessions.length % 10) * 10, 100)}%`, backgroundColor: currentArchetype.color }]} />
                        </View>
                        <Text style={styles.statsText}>{sessions.length} Sessions Logged</Text>
                    </LinearGradient>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: 50}} />
                ) : (
                    sessions.map((item, index) => {
                        const bp = item.data;
                        const isDream = item.mode === 'dream';
                        
                        return (
                            <View key={index} style={styles.card}>
                                {/* Cabecera de la Tarjeta */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.tagContainer}>
                                        <View style={[styles.moodDot, { backgroundColor: getMoodColor(bp.mood_score) }]} />
                                        <Text style={styles.category}>{bp.category || 'General'}</Text>
                                    </View>
                                    <Text style={styles.date}>{item.timestamp || 'Recent'}</Text>
                                </View>

                                {/* Título e Insight */}
                                <Text style={styles.cardTitle}>{bp.title}</Text>
                                <Text style={styles.goldenNugget}>"{bp.golden_nugget}"</Text>

                                {/* 🎨 SI ES SUEÑO: Mostrar Arte */}
                                {isDream && bp.image && (
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: `data:image/png;base64,${bp.image}` }} style={styles.dreamImage} />
                                        <View style={styles.imageOverlay}>
                                            <Ionicons name="color-palette" size={16} color="white" />
                                            <Text style={styles.imageTag}>DREAM ART</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Acción sugerida */}
                                <View style={styles.footer}>
                                    <Ionicons name="arrow-forward-circle-outline" size={20} color="#64748B" />
                                    <Text style={styles.actionItem}>{bp.action_item}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
                
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

    // ARCHETYPE CARD
    archetypeCard: { padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    archHeader: { flexDirection: 'row', alignItems: 'center' },
    archTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    archLevel: { color: '#94A3B8', fontSize: 12 },
    archDesc: { color: '#CBD5E1', marginTop: 10, fontStyle: 'italic', fontSize: 13 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 15, overflow: 'hidden' },
    progressFill: { height: '100%' },
    statsText: { color: '#64748B', fontSize: 10, marginTop: 8, textAlign: 'right' },

    // SESSION CARD
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    moodDot: { width: 8, height: 8, borderRadius: 4 },
    category: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    date: { color: '#64748B', fontSize: 10 },
    
    cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    goldenNugget: { color: '#E2E8F0', fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: 15 },
    
    // DREAM IMAGE
    imageContainer: { marginTop: 10, marginBottom: 15, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    dreamImage: { width: '100%', height: 200, borderRadius: 10 },
    imageOverlay: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
    imageTag: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    actionItem: { color: '#94A3B8', fontSize: 12, flex: 1 },
});