import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ocultamos la barra de arriba (ya tenemos la nuestra propia)
        tabBarStyle: {
          backgroundColor: '#0f172a', // Color fondo barra (Azul oscuro casi negro)
          borderTopColor: '#1e293b', // Borde sutil arriba
          height: 60, // Altura cómoda
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#38BDF8', // Color cuando estás dentro (Cyan)
        tabBarInactiveTintColor: '#64748B', // Color cuando estás fuera (Gris)
        tabBarShowLabel: true,
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1
        }
      }}
    >
      {/* 🏠 HABITACIÓN 1: NEXUS (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'NEXUS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "planet" : "planet-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 🏛️ HABITACIÓN 2: VAULT (Memoria) */}
      <Tabs.Screen
        name="vault"
        options={{
          title: 'VAULT',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 📊 HABITACIÓN 3: INSIGHTS (Datos) */}
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