import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native'; // 👈 Añadimos Platform

type GodModeContextType = {
  isGodMode: boolean;
  unlockGodMode: () => void;
};

const GodModeContext = createContext<GodModeContextType>({
  isGodMode: false,
  unlockGodMode: () => {},
});

export const useGodMode = () => useContext(GodModeContext);

export const GodModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGodMode, setIsGodMode] = useState(false);

  useEffect(() => {
    const loadGodMode = async () => {
      try {
        let stored: string | null = null;
        
        if (Platform.OS === 'web') {
          stored = localStorage.getItem('whisper_god_mode');
        } else {
          stored = await SecureStore.getItemAsync('whisper_god_mode');
        }

        if (stored === 'true') {
          setIsGodMode(true);
        }
      } catch (e) {
        console.log("Error cargando God Mode", e);
      }
    };
    loadGodMode();
  }, []);

  const unlockGodMode = async () => {
    setIsGodMode(true);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('whisper_god_mode', 'true');
      // En web no hay Haptics, así que no lo llamamos para evitar más errores
    } else {
      await SecureStore.setItemAsync('whisper_god_mode', 'true');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <GodModeContext.Provider value={{ isGodMode, unlockGodMode }}>
      {children}
    </GodModeContext.Provider>
  );
};