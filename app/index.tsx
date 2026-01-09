import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Esperamos 100ms (imperceptible) para asegurar que la navegación está montada
    // Esto evita el bloqueo en la Splash Screen
    const timer = setTimeout(() => {
      router.replace('/(auth)');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}