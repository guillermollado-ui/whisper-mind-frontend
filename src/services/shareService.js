// 👇 CORRECCIÓN CLAVE: Añadimos '/legacy' para usar las herramientas clásicas de Expo
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Servicio de arquitectura para compartir imágenes.
 * Versión corregida para Expo SDK 51/52 (Legacy API).
 */
export const shareImage = async (imageSource, isBase64 = true) => {
  try {
    // 1. Verificación de disponibilidad
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert("Tu dispositivo no permite compartir archivos.");
      return;
    }

    let uriToShare = imageSource;

    // 2. Procesamiento de Base64
    if (isBase64) {
      // Usamos cacheDirectory para no llenar el móvil de basura
      const filename = FileSystem.cacheDirectory + `whisper_dream_${Date.now()}.png`;
      
      // Limpiamos la cadena Base64 por si viene sucia
      const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, "");

      // Escribimos el archivo usando la API Legacy
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: 'base64', // Usamos el texto directo para evitar errores de constantes
      });

      uriToShare = filename;
    }

    // 3. Compartir
    await Sharing.shareAsync(uriToShare, {
      mimeType: 'image/png',
      dialogTitle: 'Whisper Mind Artifact',
      UTI: 'public.png'
    });

  } catch (error) {
    console.error("Error en shareService:", error);
    // Mostramos el mensaje limpio al usuario
    alert("No se pudo iniciar el compartido. Inténtalo de nuevo.");
  }
};