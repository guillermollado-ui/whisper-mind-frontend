import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

type GodModeContextType = {
  isGodMode: boolean;
  unlockGodMode: () => void;
  lockGodMode: () => void;
};

const GodModeContext = createContext<GodModeContextType>({
  isGodMode: false,
  unlockGodMode: () => {},
  lockGodMode: () => {},
});

export const useGodMode = () => useContext(GodModeContext);

export const GodModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGodMode, setIsGodMode] = useState(false);

  useEffect(() => {
    const loadGodMode = async () => {
      try {
        const stored = await SecureStore.getItemAsync('whisper_god_mode');
        if (stored === 'true') {
          setIsGodMode(true);
        }
      } catch (e) {}
    };
    loadGodMode();
  }, []);

  const unlockGodMode = async () => {
    setIsGodMode(true);
    await SecureStore.setItemAsync('whisper_god_mode', 'true');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Día 19 (A16/TASK-05): si no se limpia al cerrar sesión, la siguiente cuenta que entre en
  // este dispositivo heredaría el Modo Dios de la anterior sin volver a comprobar is_founder.
  const lockGodMode = async () => {
    setIsGodMode(false);
    try { await SecureStore.deleteItemAsync('whisper_god_mode'); } catch (e) {}
  };

  return (
    <GodModeContext.Provider value={{ isGodMode, unlockGodMode, lockGodMode }}>
      {children}
    </GodModeContext.Provider>
  );
};