import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGodMode } from '../../src/context/GodModeContext'; // 👈 IMPORTAMOS EL MODO DIOS

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // 👈 LEEMOS SI EL MODO DIOS ESTÁ ACTIVADO
  const { isGodMode } = useGodMode(); 

  return (
    <Tabs
      screenOptions={{
        // 1. ESTILO DE LA BARRA (Panel de Control Oscuro)
        tabBarStyle: {
          backgroundColor: '#020617', // Negro profundo
          borderTopWidth: 1,
          borderTopColor: '#1e293b', // Línea sutil
          
          // 🛑 FIX: Altura dinámica. Base de 60px + lo que mida la barra del sistema
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          
          // 🛑 FIX: Padding dinámico. Si hay barra, empujamos los iconos arriba
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          
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
      {/* 1️⃣ NEXUS (Inicio) - SIEMPRE VISIBLE */}
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

      {/* 2️⃣ VAULT (Memoria) - SIEMPRE VISIBLE */}
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

      {/* 3️⃣ INSIGHTS (Gráficas) - 🕵️‍♂️ OCULTO HASTA ACTIVAR MODO DIOS */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'INSIGHTS',
          href: isGodMode ? '/(tabs)/insights' : null, // 👈 LA MAGIA ESTÁ AQUÍ
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

      {/* 4️⃣ NETWORK (Red Global) - SIEMPRE VISIBLE */}
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
      
      {/* 5️⃣ ETHER (Audio) - 🕵️‍♂️ OCULTO HASTA ACTIVAR MODO DIOS (Lo dejamos preparado) */}
      <Tabs.Screen
        name="ether"
        options={{
          title: 'ETHER',
          href: isGodMode ? '/(tabs)/ether' : null, // 👈 PREPARADO PARA ESTE FIN DE SEMANA
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "headset" : "headset-outline"} 
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