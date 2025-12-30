import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

// ⚠️ URL DE RENDER
const API_URL = 'https://wishpermind-backend.onrender.com';
const SESSION_ID = 'user-premium-1';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function InsightsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchInsights = async () => {
        try {
            const res = await fetch(`${API_URL}/insights/${SESSION_ID}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchInsights(); }, []));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchInsights();
    }, []);

    // Configuración del Gráfico
    const chartConfig = {
        backgroundGradientFrom: "#1e293b",
        backgroundGradientTo: "#0f172a",
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`, // Cyan Cyberpunk
        strokeWidth: 3,
        barPercentage: 0.5,
        propsForDots: { r: "5", strokeWidth: "2", stroke: "#38BDF8" },
        propsForBackgroundLines: { strokeDasharray: "" }, // Líneas sólidas
        decimalPlaces: 0, 
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>INSIGHTS</Text>
                <Text style={styles.headerSubtitle}>NEURAL PATTERNS</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {loading || !data ? (
                    <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: 50}} />
                ) : (
                    <>
                        {/* 📈 SISMÓGRAFO EMOCIONAL */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="pulse-outline" size={20} color="#38BDF8" />
                                <Text style={styles.cardTitle}>MOOD SEISMOGRAPH</Text>
                            </View>
                            
                            {data.mood_trend.length > 1 ? (
                                <LineChart
                                    data={{
                                        labels: [], // Sin etiquetas para look minimalista
                                        datasets: [{ data: data.mood_trend }]
                                    }}
                                    width={SCREEN_WIDTH - 60} // Ajuste al padding
                                    height={220}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    yAxisInterval={1}
                                    chartConfig={chartConfig}
                                    bezier // Curvas suaves
                                    style={styles.chart}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Not enough data to map trends.</Text>
                                    <Text style={styles.emptySub}>Complete at least 2 sessions.</Text>
                                </View>
                            )}
                            <Text style={styles.chartFooter}>Emotional Volatility Analysis (Last 10 sessions)</Text>
                        </View>

                        {/* 🧠 MAPA DE TEMAS (Distribución) */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="pie-chart-outline" size={20} color="#F59E0B" />
                                <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>MENTAL MAP</Text>
                            </View>
                            
                            <View style={styles.topicContainer}>
                                {Object.keys(data.category_distribution).length > 0 ? (
                                    Object.entries(data.category_distribution).map(([key, value]: any, index) => {
                                        const percentage = (value / data.total_sessions) * 100;
                                        return (
                                            <View key={index} style={styles.topicRow}>
                                                <View style={styles.topicInfo}>
                                                    <Text style={styles.topicName}>{key}</Text>
                                                    <Text style={styles.topicCount}>{value} sessions</Text>
                                                </View>
                                                <View style={styles.progressBarBg}>
                                                    <LinearGradient 
                                                        colors={['#F59E0B', '#F59E0B']} 
                                                        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                                        style={[styles.progressBarFill, { width: `${percentage}%` }]} 
                                                    />
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.emptyText}>No topics mapped yet.</Text>
                                )}
                            </View>
                        </View>

                        {/* 📊 ESTADÍSTICAS TOTALES */}
                        <View style={styles.statRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>{data.total_sessions}</Text>
                                <Text style={styles.statLabel}>TOTAL SESSIONS</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>
                                    {data.mood_trend.length > 0 ? (data.mood_trend.reduce((a:any, b:any) => a + b, 0) / data.mood_trend.length).toFixed(1) : '-'}
                                </Text>
                                <Text style={styles.statLabel}>AVG. MOOD</Text>
                            </View>
                        </View>

                    </>
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

    card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    cardTitle: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    
    chart: { borderRadius: 16, marginVertical: 8, alignSelf: 'center' },
    chartFooter: { color: '#64748B', fontSize: 10, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
    
    emptyState: { height: 150, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#94A3B8', fontSize: 14 },
    emptySub: { color: '#64748B', fontSize: 12, marginTop: 5 },

    // TOPICS
    topicContainer: { gap: 15 },
    topicRow: { marginBottom: 5 },
    topicInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    topicName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    topicCount: { color: '#94A3B8', fontSize: 12 },
    progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },

    // STATS
    statRow: { flexDirection: 'row', gap: 15 },
    statBox: { flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statNumber: { fontSize: 32, fontWeight: '900', color: 'white' },
    statLabel: { color: '#64748B', fontSize: 10, letterSpacing: 1, marginTop: 5 },
});