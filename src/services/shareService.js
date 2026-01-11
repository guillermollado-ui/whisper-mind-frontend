import * as Sharing from 'expo-sharing';
// Mantén tu importación legacy si es la que te funciona
import * as FileSystem from 'expo-file-system/legacy'; 
import { Alert } from 'react-native';

export const shareImage = async (uri) => {
  try {
    // 1. Validación básica
    if (!uri) {
      console.error("Error: No hay URI para compartir");
      return;
    }

    // 2. Verificar si compartir está disponible
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Error", "Compartir no soportado en este dispositivo");
      return;
    }

    // Definimos dónde vamos a guardar el archivo temporalmente con un timestamp para evitar conflictos
    const fileUri = `${FileSystem.cacheDirectory}whisper_artifact_${Date.now()}.png`;
    let uriToShare = fileUri;

    // 3. LÓGICA HÍBRIDA 🔑
    
    if (uri.startsWith('data:')) {
      // --- CASO A: IMAGEN ETERNA (Base64) ---
      const base64Code = uri.split('base64,')[1];

      await FileSystem.writeAsStringAsync(fileUri, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else if (uri.startsWith('http') || uri.startsWith('https')) {
      // --- CASO B: IMAGEN ANTIGUA (URL Web) ---
      const downloadRes = await FileSystem.downloadAsync(uri, fileUri);
      uriToShare = downloadRes.uri;
    } else {
      // Si ya es un archivo local (file://), lo usamos directo
      uriToShare = uri;
    }

    // --- ADICIÓN DE SEGURIDAD PARA APK ---
    // Verificamos que el archivo realmente existe antes de llamar a la hoja de compartir
    const fileInfo = await FileSystem.getInfoAsync(uriToShare);
    if (!fileInfo.exists) {
      throw new Error("El archivo no se creó correctamente en el sistema local.");
    }

    // 4. Compartir el archivo (Físico en el almacenamiento local)
    await Sharing.shareAsync(uriToShare, {
      mimeType: 'image/png',
      dialogTitle: 'Guardar Artefacto de Alice',
      UTI: 'public.png' // Crítico para compatibilidad iOS/Android
    });

  } catch (error) {
    console.error("Error en shareImage:", error);
    Alert.alert("Error de Exportación", "No se pudo procesar la imagen para compartir. Revisa los permisos de tu dispositivo.");
  }
};