import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

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
      alert("Compartir no soportado en este dispositivo");
      return;
    }

    let uriToShare = uri;

    // 3. IMPORTANTE: Si es una URL de internet (https), descargarla primero
    if (uri.startsWith('http') || uri.startsWith('https')) {
      // Creamos una ruta temporal local
      const fileUri = FileSystem.cacheDirectory + 'whisper_shared_image.png';
      
      // Descargamos la imagen de la URL remota a la ruta local
      const downloadRes = await FileSystem.downloadAsync(uri, fileUri);
      
      // Usamos la nueva ruta local
      uriToShare = downloadRes.uri;
    }

    // 4. Compartir el archivo (ahora garantizado que es local)
    await Sharing.shareAsync(uriToShare, {
      mimeType: 'image/png',
      dialogTitle: 'Compartir Artefacto',
      UTI: 'public.png'
    });

  } catch (error) {
    console.error("Error en shareImage:", error);
    alert("No se pudo compartir la imagen. Intenta de nuevo.");
  }
};