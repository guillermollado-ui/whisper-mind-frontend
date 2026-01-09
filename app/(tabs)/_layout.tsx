import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // ⬅️ Ocultamos la barra (y el botón duplicado desaparece)
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'NEXUS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "planet" : "planet-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'VAULT',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'INSIGHTS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}