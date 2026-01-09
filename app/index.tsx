import React from 'react';
import { View, ActivityIndicator } from 'react-native';

// Esta pantalla es solo un "Lobby" temporal.
// El _layout.tsx se encargará de redirigir al usuario inmediatamente.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}