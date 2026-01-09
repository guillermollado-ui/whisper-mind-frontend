import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  // Sin lógica, sin comprobaciones, sin esperas.
  // Solo renderiza lo que tenga que salir.
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}