import React, { useState, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    Dimensions, 
    ActivityIndicator, 
    Platform, 
    TouchableOpacity, 
    Alert, 
    LayoutAnimation, 
    UIManager 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy'; 
import ConfettiCannon from 'react-native-confetti-cannon';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = 'https://wishpermind-backend.onrender.com';
const SCREEN_WIDTH = Dimensions.get('window').width;

// --- COMPONENTE: BARRA HORIZONTAL ---
const HorizontalBar = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    return (
        <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>{label}</Text>
                <Text style={{ color: color, fontSize: 12, fontWeight: 'bold' }}>{value}</Text>
            </View>
            <View style={{ height: 12, backgroundColor: '#1E293B', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    backgroundColor: color, 
                    borderRadius: 6 
                }} />
            </View>
        </View>
    );
};

// --- COMPONENTE: TEXTO EXPANDIBLE ---
const ExpandableAliceText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
    if (text.length < 150) return <Text style={styles.aliceText}>"{text}"</Text>;

    return (
        <View>
            <Text style={styles.aliceText} numberOfLines={isExpanded ? undefined : 4}>
                "{text}"
            </Text>
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginBottom: 15, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
                    {isExpanded ? 'SHOW LESS' : 'READ MORE'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default function InsightsScreen() {
    const router = useRouter();
    const confettiRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    
    // NAVEGACIÓN EMOCIONAL
    const [aliceStory, setAliceStory] = useState(null); 
    const [aliceMessage, setAliceMessage] = useState("Tap below to see what Alice sees in you this week.");
    
    const [dailyTasks, setDailyTasks] = useState([]); 
    const [analyzing, setAnalyzing] = useState(false);
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const getAuthToken = async () => {
        if (Platform.OS === 'web') return localStorage.getItem('user_token');
        return await SecureStore.getItemAsync('user_token');
    };

    const loadCachedData = async () => {
        try {
            const today = new Date().toDateString();
            
            const savedTasks = await AsyncStorage.getItem('daily_tasks_cache');
            const savedDate = await AsyncStorage.getItem('daily_tasks_date');
            if (savedDate === today && savedTasks) {
                setDailyTasks(JSON.parse(savedTasks));
            }

            const savedStory = await AsyncStorage.getItem('insights_story_cache');
            if (savedDate === today && savedStory) {
                setAliceStory(JSON.parse(savedStory));
            }

        } catch (e) { console.log("Cache error", e); }
    };

    const handleToggleTask = (id) => {
        const updatedTasks = dailyTasks.map(task => {
            if (task.id === id) {
                const isNowCompleted = !task.completed;
                if (isNowCompleted && confettiRef.current) {
                    confettiRef.current.start();
                }
                return { ...task, completed: isNowCompleted };
            }
            return task;
        });
        setDailyTasks(updatedTasks);
        AsyncStorage.setItem('daily_tasks_cache', JSON.stringify(updatedTasks));
    };

    const playAudioData = async (audioData) => {
        try {
            if (sound) await sound.unloadAsync();
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true,
            });
            let uri = '';
            if (audioData.startsWith('http')) uri = audioData;
            else {
                uri = FileSystem.cacheDirectory + 'alice_voice.mp3';
                await FileSystem.writeAsStringAsync(uri, audioData, { encoding: 'base64' });
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
            setSound(newSound);
            setIsPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
            });
        } catch (error) { console.error("Audio Playback Error:", error); }
    };

    const fetchInsights = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;
            const res = await fetch(`${API_URL}/insights`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (res.ok) {
                const fakeDistribution = {};
                if (!json.category_distribution || Object.keys(json.category_distribution).length === 0) {
                      fakeDistribution["Resilience"] = 4; fakeDistribution["Clarity"] = 2;
                      fakeDistribution["Anxiety"] = 1; fakeDistribution["Focus"] = 5;
                } else { Object.assign(fakeDistribution, json.category_distribution); }

                const moodData = json.weekly_mood && json.weekly_mood.length > 0 ? json.weekly_mood : [5, 5, 5, 5, 5];
                const adaptedData = { mood_trend: moodData, category_distribution: fakeDistribution, total_sessions: moodData.length };
                setData(adaptedData);
                return adaptedData;
            }
        } catch (e) { console.error("Fetch error:", e); } 
        finally { setLoading(false); setRefreshing(false); }
    };

    const runAliceAnalysis = async (currentData) => {
        setAnalyzing(true);
        if (sound) await sound.unloadAsync();
        setIsPlaying(false);
        try {
            const token = await getAuthToken();
            if (!token) { Alert.alert("Error", "Please login again"); return; }

            const rawMoods = currentData.mood_trend || [];
            const rawEmotions = currentData.category_distribution ? Object.keys(currentData.category_distribution) : [];
            const payload = { mood_trend: rawMoods, top_emotions: rawEmotions };

            const res = await fetch(`${API_URL}/insights/analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();
            if (res.ok) {
                const newStory = {
                    story: responseData.story || responseData.text, 
                    core_pattern: responseData.core_pattern || "Finding your rhythm.",
                    archetype: responseData.archetype || { name: "The Observer", description: "Watching before acting." }
                };
                
                setAliceStory(newStory);
                setAliceMessage(responseData.analysis_text || responseData.text);
                
                const today = new Date().toDateString();
                await AsyncStorage.setItem('insights_story_cache', JSON.stringify(newStory));
                await AsyncStorage.setItem('daily_tasks_date', today);

                if (responseData.audio) playAudioData(responseData.audio);
                
                if (responseData.tasks && Array.isArray(responseData.tasks)) {
                    const timestamp = Date.now();
                    const newTasks = responseData.tasks.map((t, i) => ({
                        id: `task_${timestamp}_${i}`,
                        title: t.title, 
                        time: t.time || "5 min",
                        description: t.description, 
                        route: t.route || "/",
                        completed: false, 
                        expanded: false
                    }));
                    setDailyTasks(newTasks);
                    await AsyncStorage.setItem('daily_tasks_cache', JSON.stringify(newTasks));
                }
            } else { setAliceMessage("Neural link unstable."); }
        } catch (e) { Alert.alert("Connection Error", e.message); } finally { setAnalyzing(false); }
    };

    const toggleExpand = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newTasks = [...dailyTasks];
        newTasks[index].expanded = !newTasks[index].expanded;
        setDailyTasks(newTasks);
    };

    // --- ✅ FUNCIÓN MEJORADA: MARCA COMO HECHA + NAVEGA ---
    const navigateToTask = async (route, taskId) => {
        // 1. Marcar automáticamente como completada (¡esto dispara el confeti!)
        handleToggleTask(taskId);

        const today = new Date().toDateString();
        if (route === '/vault') await AsyncStorage.setItem('last_vault_visit', today);
        else if (route === '/') await AsyncStorage.setItem('last_chat_interaction', today);
        
        // 2. Pequeño delay para ver el Check y el Confeti antes de irnos
        setTimeout(() => {
            if (route === '/') router.replace('/'); 
            else if (route === '/vault') router.replace('/vault');
        }, 1200); // 1.2 segundos de gloria antes de navegar
    };

    useFocusEffect(useCallback(() => { 
        const load = async () => {
            const d = await fetchInsights();
            if (!analyzing) await loadCachedData(); 
        };
        load();
        return () => { if(sound) sound.unloadAsync(); };
    }, []));

    const handleManualAnalyze = async () => {
        if(data) runAliceAnalysis(data);
        else fetchInsights().then(d => { if(d) runAliceAnalysis(d); });
    };

    const chartConfig = {
        backgroundGradientFrom: "#1e293b", backgroundGradientTo: "#0f172a",
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`, strokeWidth: 3,
        propsForDots: { r: "5", strokeWidth: "2", stroke: "#38BDF8" },
        propsForBackgroundLines: { strokeDasharray: "" }, decimalPlaces: 0, 
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#000000']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>INSIGHTS</Text>
                <Text style={styles.headerSubtitle}>YOUR EMOTIONAL BLUEPRINT</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchInsights();}} tintColor="#fff" />}
            >
                {loading || !data ? (
                    <ActivityIndicator size="large" color="#38BDF8" style={{marginTop: 50}} />
                ) : (
                    <>
                        {/* --- BLOQUE 1: YOUR EMOTIONAL STORY --- */}
                        <LinearGradient 
                            colors={['#1e293b', '#0f172a']} 
                            style={styles.storyCard}
                        >
                            <View style={styles.archetypeHeader}>
                                <View>
                                    <Text style={styles.storyLabel}>THIS WEEK'S ARCHETYPE</Text>
                                    <Text style={styles.archetypeTitle}>
                                        {aliceStory?.archetype?.name || "The Unwritten Story"}
                                    </Text>
                                    <Text style={styles.archetypeDesc}>
                                        {aliceStory?.archetype?.description || "Tap the button below to discover who you've been this week."}
                                    </Text>
                                </View>
                                <Ionicons name="finger-print-outline" size={40} color="rgba(56, 189, 248, 0.3)" />
                            </View>

                            <View style={styles.divider} />

                            {aliceStory?.core_pattern && (
                                <View style={styles.patternBox}>
                                    <Ionicons name="key-outline" size={16} color="#F59E0B" />
                                    <Text style={styles.patternText}>
                                        "{aliceStory.core_pattern}"
                                    </Text>
                                </View>
                            )}

                            {analyzing ? (
                                <View style={{flexDirection:'row', alignItems:'center', gap:10, paddingVertical: 20}}>
                                    <ActivityIndicator color="#10B981" size="small" />
                                    <Text style={styles.analyzingText}>Reading your nervous system...</Text>
                                </View>
                            ) : (
                                <View style={{marginTop: 15}}>
                                    <ExpandableAliceText text={aliceStory?.story || aliceMessage} />
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.analyzeBtn, isPlaying && {borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)'}]} 
                                onPress={handleManualAnalyze} disabled={analyzing}
                            >
                                <Ionicons name={isPlaying ? "volume-high" : "eye-outline"} size={16} color={isPlaying ? "#38BDF8" : "#10B981"} style={{marginRight: 8}} />
                                <Text style={[styles.analyzeBtnText, isPlaying && {color: '#38BDF8'}]}>
                                    {analyzing ? "CONNECTING..." : isPlaying ? "LISTENING TO ALICE" : "SEE WHAT ALICE SEES"}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* --- BLOQUE 2: GRÁFICOS --- */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="pulse-outline" size={20} color="#38BDF8" />
                                <Text style={styles.cardTitle}>NERVOUS SYSTEM RHYTHM</Text>
                            </View>
                            {data.mood_trend && data.mood_trend.length > 1 ? (
                                <LineChart 
                                    data={{ labels: [], datasets: [{ data: data.mood_trend }] }} 
                                    width={SCREEN_WIDTH - 60} height={200} 
                                    yAxisLabel="" yAxisSuffix="" 
                                    chartConfig={chartConfig} 
                                    bezier 
                                    style={styles.chart} 
                                />
                            ) : (<View style={styles.emptyState}><Text style={styles.emptyText}>Not enough data points.</Text></View>)}
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="prism-outline" size={20} color="#F59E0B" />
                                <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>WHAT'S LIVING INSIDE YOU</Text>
                            </View>
                            {data.category_distribution ? (
                                <View style={{ marginTop: 10 }}>
                                    {Object.entries(data.category_distribution).map(([label, value], i) => (
                                        <HorizontalBar 
                                            key={i} 
                                            label={label} 
                                            value={value} 
                                            maxValue={5} 
                                            color="#F59E0B"
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyState}><Text style={styles.emptyText}>No emotional data yet.</Text></View>
                            )}
                        </View>

                        {/* --- BLOQUE 3: PROTOCOLOS --- */}
                        <View style={styles.tasksContainer}>
                            <Text style={styles.sectionTitle}>ALIGNMENT PROTOCOLS</Text>
                            {dailyTasks.length > 0 ? dailyTasks.map((task, index) => (
                                <View key={task.id || index} style={[styles.taskCard, task.completed && styles.taskCardDone]}>
                                    <View style={styles.taskHeaderRow}>
                                        <TouchableOpacity 
                                            style={[styles.checkBox, task.completed && styles.checkBoxDone]} 
                                            onPress={() => handleToggleTask(task.id)}
                                        >
                                            {task.completed ? <Ionicons name="checkmark" size={14} color="#000" /> : <Ionicons name="radio-button-off" size={12} color="#475569" />}
                                        </TouchableOpacity>

                                        <TouchableOpacity style={{flex: 1, marginLeft: 15}} onPress={() => toggleExpand(index)}>
                                            <Text style={[styles.taskTitle, task.completed && styles.taskTextDone]}>{task.title}</Text>
                                            <Text style={styles.taskTime}>{task.time}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => toggleExpand(index)} style={styles.expandBtn}>
                                            <Ionicons name={task.expanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>

                                    {task.expanded && (
                                        <View style={styles.taskBody}>
                                            <View style={styles.divider} />
                                            <Text style={styles.taskDesc}>{task.description}</Text>
                                            {/* Si NO está completada, mostramos el botón INITIATE */}
                                            {!task.completed && (
                                                <TouchableOpacity style={styles.actionLink} onPress={() => navigateToTask(task.route, task.id)}>
                                                    <Text style={styles.actionLinkText}>INITIATE</Text>
                                                    <Ionicons name="arrow-forward" size={12} color="#38BDF8" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )) : (
                                <Text style={styles.emptyText}>Waiting for Alice's input...</Text>
                            )}
                        </View>
                    </>
                )}
                <View style={{height: 100}} /> 
            </ScrollView>

            <ConfettiCannon 
                count={200} 
                origin={{x: -10, y: 0}} 
                autoStart={false} 
                ref={confettiRef} 
                fadeOut={true}
                fallSpeed={3000}
                zIndex={1000} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { marginTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 1 },
    headerSubtitle: { fontSize: 10, color: '#64748B', letterSpacing: 3, marginTop: 5 },
    scrollContent: { paddingHorizontal: 20 },
    
    // ESTILOS NUEVOS STORY CARD
    storyCard: { padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
    archetypeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    storyLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    archetypeTitle: { color: '#38BDF8', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginBottom: 5 },
    archetypeDesc: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic', maxWidth: '90%' },
    
    patternBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 10, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 15 },
    patternText: { color: '#F59E0B', fontSize: 13, fontWeight: 'bold', fontStyle: 'italic', flex: 1 },
    
    aliceText: { color: '#E2E8F0', fontSize: 15, lineHeight: 24, marginBottom: 15 },
    analyzingText: { color: '#64748B', fontSize: 14, fontStyle: 'italic' },
    
    analyzeBtn: { marginTop: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', justifyContent: 'center' },
    analyzeBtnText: { color: '#10B981', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

    tasksContainer: { marginBottom: 30 },
    sectionTitle: { color: '#64748B', fontSize: 10, letterSpacing: 2, marginBottom: 15, fontWeight: 'bold' },
    taskCard: { backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
    taskCardDone: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    taskHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
    checkBoxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
    taskTitle: { color: 'white', fontSize: 14, fontWeight: '500' },
    taskTextDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
    taskTime: { color: '#64748B', fontSize: 10, marginTop: 2 },
    expandBtn: { padding: 5 },
    taskBody: { paddingHorizontal: 15, paddingBottom: 15 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10, marginTop: 10 },
    taskDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 15 },
    actionLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 6 },
    actionLinkText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    
    card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    cardTitle: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    chart: { borderRadius: 16, marginVertical: 8, alignSelf: 'center' },
    emptyState: { height: 150, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#94A3B8', fontSize: 14 },
});