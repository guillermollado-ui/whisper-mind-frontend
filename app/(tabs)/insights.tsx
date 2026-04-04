/**
 * (tabs)/insights.tsx — TRANSLATED & SECURE (With Language Pre-wiring)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    LayoutAnimation,
    UIManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import ConfettiCannon from 'react-native-confetti-cannon';
import { API_URL, apiFetch } from '../../utils/api';
import { useAlert } from '../../src/context/AlertContext';
// 🌍 IMPORTACIÓN DEL MOTOR DE IDIOMAS
import { useLanguage } from '../../src/context/LanguageContext';
// ✅ [NUEVO] Importamos la Guía de Iniciación
import InitiationOverlay from '../../components/InitiationOverlay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const THEME = {
    bg: '#000000',
    card: '#09090b',
    border: '#27272a',
    cyan: '#22d3ee',
    amber: '#f59e0b',
    text: '#e4e4e7',
    subtext: '#71717a',
    success: '#10b981'
};

const HorizontalBar = ({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: THEME.subtext, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
                <Text style={{ color: color, fontSize: 11, fontWeight: 'bold' }}>{value}</Text>
            </View>
            <View style={{ height: 4, backgroundColor: '#18181b', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
            </View>
        </View>
    );
};

// 🌍 Componente de texto traducido
const ExpandableAliceText = ({ text, t }: { text: string; t: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
    
    if (text.length < 150) return <Text style={styles.aliceText}>"{text}"</Text>;
    
    return (
        <View>
            <Text style={styles.aliceText} numberOfLines={isExpanded ? undefined : 4}>
                "{text}"
            </Text>
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginTop: 8 }}>
                <Text style={styles.readMore}>{isExpanded ? t('insights.hero.read_less') : t('insights.hero.read_more')}</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function InsightsScreen() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { t, language } = useLanguage(); // 🌍 Usamos el hook de idioma

    const confettiRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [aliceStory, setAliceStory] = useState<any>(null);
    const [aliceMessage, setAliceMessage] = useState(t('insights.hero.sync_message'));
    const [dailyTasks, setDailyTasks] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, []);

    const loadCachedData = async () => {
        try {
            const today = new Date().toDateString();
            const savedDate = await AsyncStorage.getItem('daily_tasks_date');
            if (savedDate === today) {
                const savedTasks = await AsyncStorage.getItem('daily_tasks_cache');
                if (savedTasks) setDailyTasks(JSON.parse(savedTasks));

                const savedStory = await AsyncStorage.getItem('insights_story_cache');
                if (savedStory) {
                    const parsedStory = JSON.parse(savedStory);
                    setAliceStory(parsedStory);
                    if (parsedStory.full_text) {
                        setAliceMessage(parsedStory.full_text);
                    }
                }
            }
        } catch (e) { console.log("Cache error", e); }
    };

    const handleToggleTask = (id: string) => {
        const updatedTasks = dailyTasks.map(task => {
            if (task.id === id) {
                const isNowCompleted = !task.completed;
                if (isNowCompleted && confettiRef.current) confettiRef.current.start();
                return { ...task, completed: isNowCompleted };
            }
            return task;
        });
        setDailyTasks(updatedTasks);
        AsyncStorage.setItem('daily_tasks_cache', JSON.stringify(updatedTasks));
    };

    const playAudioData = async (audioData: string) => {
        try {
            if (soundRef.current) {
                soundRef.current.setOnPlaybackStatusUpdate(null); 
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setIsPlaying(false);

            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true });

            let uri = '';
            if (audioData.startsWith('http')) {
                uri = audioData;
            } else if (audioData.startsWith('/')) {
                uri = `${API_URL}${audioData}`;
            } else {
                uri = FileSystem.cacheDirectory + 'alice_voice.mp3';
                await FileSystem.writeAsStringAsync(uri, audioData, { encoding: 'base64' });
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
            soundRef.current = newSound;
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) { console.error("Audio Error:", error); }
    };

    const stopAudio = async () => {
        if (soundRef.current) {
            soundRef.current.setOnPlaybackStatusUpdate(null);
            try { await soundRef.current.stopAsync(); } catch (e) {}
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setIsPlaying(false);
    };

    const fetchInsights = async (): Promise<any | null> => {
        try {
            const res = await apiFetch('/insights');
            const json = await res.json();
            if (res.ok) {
                const fakeDistribution: Record<string, number> = {};
                if (!json.category_distribution || Object.keys(json.category_distribution).length === 0) {
                    fakeDistribution["Resilience"] = 4;
                    fakeDistribution["Clarity"] = 2;
                    fakeDistribution["Anxiety"] = 1;
                    fakeDistribution["Focus"] = 5;
                } else {
                    Object.assign(fakeDistribution, json.category_distribution);
                }
                const moodData = json.weekly_mood && json.weekly_mood.length > 0 ? json.weekly_mood : [5, 5, 5, 5, 5];
                const adaptedData = { mood_trend: moodData, category_distribution: fakeDistribution, total_sessions: moodData.length };
                setData(adaptedData);
                return adaptedData;
            }
        } catch (e: any) {
            if (e.message === 'SESSION_EXPIRED') return null;
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
        return null;
    };

    const runAliceAnalysis = async (currentData: any) => {
        setAnalyzing(true);
        await stopAudio();

        try {
            const rawMoods = currentData.mood_trend || [];
            const rawEmotions = currentData.category_distribution ? Object.keys(currentData.category_distribution) : [];
            
            // 🔌 PRE-INSTALACIÓN: Enviamos el idioma al servidor
            const payload = { 
                mood_trend: rawMoods, 
                top_emotions: rawEmotions,
                language: language 
            };

            const res = await apiFetch('/insights/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();
            if (res.ok) {
                // 🌍 Usamos las traducciones dinámicas para las partes fijas
                const closingPhrase = t('insights.tasks.closing_phrase');
                const fullText = `${responseData.story || ''}\n\n${responseData.analysis_text || ''}${closingPhrase}`.trim();
                
                const newStory = {
                    story: responseData.story, 
                    full_text: fullText, 
                    core_pattern: responseData.core_pattern || "Finding your rhythm.",
                    archetype: responseData.archetype || { name: t('insights.hero.awaiting'), description: "" }
                };
                
                setAliceStory(newStory);
                setAliceMessage(fullText);

                const today = new Date().toDateString();
                await AsyncStorage.setItem('insights_story_cache', JSON.stringify(newStory));
                await AsyncStorage.setItem('daily_tasks_date', today);

                if (responseData.audio) playAudioData(responseData.audio);

                // 🌍 Procesamiento de Tareas usando el idioma actual
                let rawTasks = responseData.tasks && Array.isArray(responseData.tasks) ? responseData.tasks : [];
                const timestamp = Date.now();
                const helpText = t('insights.tasks.help_text');
                
                let newTasks = rawTasks.map((t_item: any, i: number) => {
                    const isString = typeof t_item === 'string';
                    const originalDesc = isString ? t_item : (t_item.description || "No details provided.");
                    
                    return {
                        id: `task_${timestamp}_${i}`,
                        title: isString ? t('insights.tasks.default_title') : (t_item.title || "Task"),
                        time: isString ? t('insights.tasks.default_time') : (t_item.time || "5 min"),
                        description: `${originalDesc}\n\n${helpText}`,
                        route: "/", 
                        completed: false,
                        expanded: false
                    };
                });

                // 🌍 Tareas de respaldo traducidas
                while (newTasks.length < 3) {
                    const extraIndex = newTasks.length + 1;
                    newTasks.push({
                        id: `task_backup_${timestamp}_${extraIndex}`,
                        title: t('insights.tasks.backup_title'),
                        time: t('insights.tasks.backup_time'),
                        description: `${t('insights.tasks.backup_desc')}\n\n${helpText}`,
                        route: "/",
                        completed: false,
                        expanded: false
                    });
                }
                
                if (newTasks.length > 3) newTasks = newTasks.slice(0, 3);

                setDailyTasks(newTasks);
                await AsyncStorage.setItem('daily_tasks_cache', JSON.stringify(newTasks));
                
            } else {
                setAliceMessage("Neural link unstable.");
            }
        } catch (e: any) {
            if (e.message === 'SESSION_EXPIRED') return;
            showAlert("ANALYSIS ERROR", e.message, "error");
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newTasks = [...dailyTasks];
        newTasks[index].expanded = !newTasks[index].expanded;
        setDailyTasks(newTasks);
    };

    const navigateToTask = async (route: string, taskId: string) => {
        handleToggleTask(taskId);
        const today = new Date().toDateString();
        await AsyncStorage.setItem('last_chat_interaction', today);
        setTimeout(() => {
            router.replace('/'); 
        }, 800);
    };

    useFocusEffect(useCallback(() => {
        const load = async () => {
            await loadCachedData();
            await fetchInsights();
        };
        load();
        return () => { stopAudio(); };
    }, [t])); // Recargar si cambia el idioma

    const handleManualAnalyze = async () => {
        if (data) {
            runAliceAnalysis(data);
        } else {
            const d = await fetchInsights();
            if (d) runAliceAnalysis(d);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: "#000000",
        backgroundGradientTo: "#000000",
        fillShadowGradient: THEME.cyan,
        fillShadowGradientOpacity: 0.2,
        color: (opacity = 1) => `rgba(34, 211, 238, ${opacity})`,
        strokeWidth: 2,
        propsForDots: { r: "4", strokeWidth: "2", stroke: THEME.bg },
        propsForBackgroundLines: { strokeDasharray: "", stroke: "#18181b" },
        decimalPlaces: 0,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('insights.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('insights.subtitle')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInsights(); }} tintColor="#fff" />}
            >
                {loading || !data ? (
                    <ActivityIndicator size="large" color={THEME.cyan} style={{marginTop: 50}} />
                ) : (
                    <>
                        {/* Hero Card */}
                        <View style={styles.heroCard}>
                            <LinearGradient colors={['rgba(34, 211, 238, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
                            <View style={styles.archetypeHeader}>
                                <View>
                                    <Text style={styles.storyLabel}>{t('insights.hero.archetype_label')}</Text>
                                    <Text style={styles.archetypeTitle}>{aliceStory?.archetype?.name || t('insights.hero.awaiting')}</Text>
                                </View>
                                <View style={styles.iconBox}>
                                    <Ionicons name="finger-print-outline" size={24} color={THEME.cyan} />
                                </View>
                            </View>
                            <View style={styles.divider} />
                            {aliceStory?.core_pattern && <Text style={styles.patternText}>/// {t('insights.hero.pattern_prefix')}{aliceStory.core_pattern.toUpperCase()}</Text>}
                            
                            {analyzing ? (
                                <View style={{flexDirection:'row', alignItems:'center', gap:10, paddingVertical: 20}}>
                                    <ActivityIndicator color={THEME.cyan} size="small" />
                                    <Text style={styles.analyzingText}>{t('insights.hero.analyzing')}</Text>
                                </View>
                            ) : (
                                <View style={{marginTop: 10}}>
                                    <ExpandableAliceText text={aliceMessage} t={t} />
                                </View>
                            )}
                            
                            <TouchableOpacity
                                style={[styles.analyzeBtn, isPlaying && { borderColor: THEME.cyan, backgroundColor: 'rgba(34,211,238,0.1)' }]}
                                onPress={isPlaying ? stopAudio : handleManualAnalyze}
                                disabled={analyzing}
                            >
                                <Ionicons name={isPlaying ? "pause" : "play"} size={12} color={isPlaying ? THEME.cyan : THEME.text} />
                                <Text style={[styles.analyzeBtnText, isPlaying && {color: THEME.cyan}]}>
                                    {analyzing ? t('insights.hero.btn_calculating') : isPlaying ? t('insights.hero.btn_stop') : t('insights.hero.btn_initiate')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Mood Chart */}
                        <View style={[styles.sectionHeader]}>
                            <Ionicons name="pulse" size={14} color={THEME.subtext} />
                            <Text style={styles.sectionTitle}>{t('insights.sections.mood_rhythm')}</Text>
                        </View>
                        <View style={styles.chartContainer}>
                            {data.mood_trend && data.mood_trend.length > 1 ? (
                                <LineChart
                                    data={{ labels: [], datasets: [{ data: data.mood_trend }] }}
                                    width={SCREEN_WIDTH - 40} height={180}
                                    yAxisLabel="" yAxisSuffix="" chartConfig={chartConfig} bezier
                                    style={styles.chart} withInnerLines={true} withOuterLines={false} withVerticalLines={false} withHorizontalLabels={false}
                                />
                            ) : (<Text style={styles.emptyText}>{t('insights.empty.data')}</Text>)}
                        </View>

                        {/* Emotional Spectrum */}
                        <View style={[styles.sectionHeader, {marginTop: 20}]}>
                            <Ionicons name="prism" size={14} color={THEME.subtext} />
                            <Text style={styles.sectionTitle}>{t('insights.sections.spectrum')}</Text>
                        </View>
                        <View style={styles.spectrumContainer}>
                            {data.category_distribution ? (
                                <View>
                                    {Object.entries(data.category_distribution).map(([label, value], i) => (
                                        <HorizontalBar key={i} label={label} value={value as number} maxValue={5} color={THEME.amber} />
                                    ))}
                                </View>
                            ) : (<Text style={styles.emptyText}>{t('insights.empty.spectrum')}</Text>)}
                        </View>

                        {/* Tasks */}
                        <View style={[styles.sectionHeader, {marginTop: 20}]}>
                            <Ionicons name="git-network" size={14} color={THEME.subtext} />
                            <Text style={styles.sectionTitle}>{t('insights.sections.protocols')}</Text>
                        </View>
                        <View style={styles.tasksContainer}>
                            {dailyTasks.length > 0 ? dailyTasks.map((task, index) => (
                                <View key={task.id || index} style={[styles.taskCard, task.completed && {borderColor: THEME.success}]}>
                                    <View style={styles.taskHeaderRow}>
                                        <TouchableOpacity style={[styles.checkBox, task.completed && { borderColor: THEME.success, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} onPress={() => handleToggleTask(task.id)}>
                                            {task.completed && <Ionicons name="checkmark" size={10} color={THEME.success} />}
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{flex: 1, marginLeft: 15}} onPress={() => toggleExpand(index)}>
                                            <Text style={[styles.taskTitle, task.completed && {color: THEME.subtext, textDecorationLine: 'line-through'}]}>{task.title}</Text>
                                            <Text style={styles.taskTime}>{task.time.toUpperCase()}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => toggleExpand(index)} style={{padding: 5}}>
                                            <Ionicons name={task.expanded ? "remove" : "add"} size={16} color={THEME.subtext} />
                                        </TouchableOpacity>
                                    </View>
                                    {task.expanded && (
                                        <View style={styles.taskBody}>
                                            <Text style={styles.taskDesc}>{task.description}</Text>
                                            {!task.completed && (
                                                <TouchableOpacity style={styles.actionButton} onPress={() => navigateToTask(task.route, task.id)}>
                                                    <Text style={styles.actionButtonText}>{t('insights.tasks.execute')}</Text>
                                                    <Ionicons name="arrow-forward" size={10} color={THEME.cyan} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )) : (<Text style={styles.emptyText}>{t('insights.empty.protocols')}</Text>)}
                        </View>
                    </>
                )}
                <View style={{height: 100}} />
            </ScrollView>
            <ConfettiCannon count={150} origin={{x: -10, y: 0}} autoStart={false} ref={confettiRef} fadeOut={true} fallSpeed={3500} zIndex={1000} />

            {/* ✅ [NUEVO] Guía de Iniciación para el INSIGHTS */}
            <InitiationOverlay 
              screenName="insights" 
              steps={language === 'es' ? [
                { icon: "analytics-outline", title: "El Espejo de Datos", desc: "Esto no son matemáticas. Es un reflejo de tu alma basado en lo que has hablado con Alice." },
                { icon: "pulse-outline", title: "Frecuencia Vital", desc: "El gráfico muestra tu ritmo emocional. Detecta si estás en expansión o si necesitas refugio." },
                { icon: "list-outline", title: "Misiones Diarias", desc: "Al pulsar 'INICIAR ANÁLISIS', Alice creará 3 tareas personalizadas para tu día. Cúmplelas para evolucionar." }
              ] : [
                { icon: "analytics-outline", title: "Data Mirror", desc: "This isn't math. It's a reflection of your soul based on your conversations with Alice." },
                { icon: "pulse-outline", title: "Vital Frequency", desc: "The chart shows your emotional rhythm. It detects if you are expanding or need refuge." },
                { icon: "list-outline", title: "Daily Missions", desc: "Pressing 'INITIATE ANALYSIS' generates 3 custom tasks for your day. Complete them to evolve." }
              ]} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { marginTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: THEME.text, letterSpacing: 2 },
    headerSubtitle: { fontSize: 10, color: THEME.subtext, letterSpacing: 3, marginTop: 4, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20 },
    heroCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
    archetypeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    storyLabel: { color: THEME.cyan, fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6 },
    archetypeTitle: { color: THEME.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(34, 211, 238, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.2)' },
    divider: { height: 1, backgroundColor: THEME.border, marginVertical: 15 },
    patternText: { color: THEME.amber, fontSize: 10, fontWeight: 'bold', fontStyle: 'italic', letterSpacing: 1, marginBottom: 10 },
    aliceText: { color: '#d4d4d8', fontSize: 14, lineHeight: 22 },
    readMore: { color: THEME.subtext, fontSize: 10, marginTop: 8, fontWeight: '700', letterSpacing: 1 },
    analyzingText: { color: THEME.subtext, fontSize: 12, fontStyle: 'italic' },
    analyzeBtn: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: THEME.border, backgroundColor: 'rgba(255,255,255,0.03)' },
    analyzeBtnText: { color: THEME.text, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { color: THEME.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
    chartContainer: { alignItems: 'center', marginBottom: 10 },
    chart: { borderRadius: 16, paddingRight: 0 },
    spectrumContainer: { backgroundColor: THEME.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: THEME.border },
    tasksContainer: { marginBottom: 30 },
    taskCard: { backgroundColor: THEME.card, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
    taskHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: THEME.subtext, justifyContent: 'center', alignItems: 'center' },
    taskTitle: { color: THEME.text, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    taskTime: { color: THEME.subtext, fontSize: 9, marginTop: 4, letterSpacing: 1 },
    taskBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
    taskDesc: { color: '#a1a1aa', fontSize: 12, lineHeight: 18, marginBottom: 15 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: 'rgba(34, 211, 238, 0.1)' },
    actionButtonText: { color: THEME.cyan, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
    emptyText: { color: THEME.subtext, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
});