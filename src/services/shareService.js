import * as Sharing from 'expo-sharing';
// Mantén tu importación legacy si es la que te funciona, o usa la normal:
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

    // Definimos dónde vamos a guardar el archivo temporalmente
    const fileUri = FileSystem.cacheDirectory + 'whisper_artifact.png';
    let uriToShare = fileUri;

    // 3. LÓGICA HÍBRIDA (La clave del éxito) 🔑
    
    if (uri.startsWith('data:')) {
      // --- CASO A: IMAGEN ETERNA (Base64) ---
      // El móvil no puede compartir el código directo, hay que crear el archivo.
      // Quitamos la cabecera "data:image/png;base64," para quedarnos solo con los datos.
      const base64Code = uri.split('base64,')[1];

      await FileSystem.writeAsStringAsync(fileUri, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

    } else if (uri.startsWith('http') || uri.startsWith('https')) {
      // --- CASO B: IMAGEN ANTIGUA (URL Web) ---
      // La descargamos de internet.
      const downloadRes = await FileSystem.downloadAsync(uri, fileUri);
      uriToShare = downloadRes.uri;

    } else {
      // Si ya es un archivo local (file://), lo usamos directo
      uriToShare = uri;
    }

    // 4. Compartir el archivo (Ahora sí es un archivo físico en ambos casos)
    await Sharing.shareAsync(uriToShare, {
      mimeType: 'image/png',
      dialogTitle: 'Guardar Artefacto de Alice',
      UTI: 'public.png' // Importante para iOS
    });

  } catch (error) {
    console.error("Error en shareImage:", error);
    // Alert más descriptivo para saber qué pasa si falla
    alert("Error al procesar la imagen. Intenta de nuevo.");
  }
};