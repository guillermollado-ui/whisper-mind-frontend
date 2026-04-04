import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

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

  return (
    <GodModeContext.Provider value={{ isGodMode, unlockGodMode }}>
      {children}
    </GodModeContext.Provider>
  );
};