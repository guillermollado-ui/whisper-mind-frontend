import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 1. ESTILO DE LA BARRA (Panel de Control Oscuro)
        tabBarStyle: {
          backgroundColor: '#020617', // Negro profundo
          borderTopWidth: 1,
          borderTopColor: '#1e293b', // Línea sutil
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        // 2. COLORES
        tabBarActiveTintColor: '#38BDF8', // Cian Eléctrico
        tabBarInactiveTintColor: '#64748B', // Gris Metal
        
        // 3. TIPOGRAFÍA TÉCNICA
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 1,
          marginTop: 4,
        },
        
        // 4. SIN CABECERAS NATIVAS
        headerShown: false, 
      }}
    >
      {/* 1️⃣ NEXUS (Inicio) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'NEXUS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "pulse" : "pulse-outline"} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />

      {/* 2️⃣ VAULT (Memoria) - Movido a segunda posición */}
      <Tabs.Screen
        name="vault"
        options={{
          title: 'VAULT',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "albums" : "albums-outline"} 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />

      {/* 3️⃣ INSIGHTS (Gráficas) */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'INSIGHTS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"} 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />

      {/* 4️⃣ NETWORK (Red Global) - Última posición */}
      <Tabs.Screen
        name="network"
        options={{
          title: 'NETWORK',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "earth" : "earth-outline"} 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}