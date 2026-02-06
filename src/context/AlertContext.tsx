import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// Si usas Expo Blur, descomenta la siguiente línea. Si no, bórrala.
// import { BlurView } from 'expo-blur'; 

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertContextType {
  showAlert: (title: string, msg: string, type?: AlertType) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const CustomAlertModal = ({ visible, title, message, type, onClose }: any) => {
  if (!visible) return null;

  const getBorderColor = () => {
    switch (type) {
      case 'error': return '#EF4444'; // Rojo
      case 'success': return '#10B981'; // Verde
      case 'warning': return '#F59E0B'; // Dorado
      default: return '#06B6D4'; // Cyan
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        {/* Si tienes expo-blur instalado, usa esto: */}
        {/* <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" /> */}
        
        {/* Si NO tienes expo-blur, usa este fondo oscuro simple: */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
        
        <View style={[styles.alertBox, { borderColor: getBorderColor() }]}>
          <Text style={[styles.title, { color: getBorderColor() }]}>
            {title.toUpperCase()}
          </Text>
          
          <Text style={styles.message}>
            {message}
          </Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: getBorderColor() }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>ACKNOWLEDGE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('info');

  const showAlert = (t: string, m: string, ty: AlertType = 'info') => {
    setTitle(t);
    setMessage(m);
    setType(ty);
    setVisible(true);
  };

  const hideAlert = () => setVisible(false);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlertModal 
        visible={visible} 
        title={title} 
        message={message} 
        type={type} 
        onClose={hideAlert} 
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert debe usarse dentro de AlertProvider");
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#09090b', // Zinc 950
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  message: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  }
});