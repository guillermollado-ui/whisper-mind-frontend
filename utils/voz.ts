/**
 * utils/voz.ts
 * Día 11: grabación ligera de las notas de voz y voz del dispositivo (expo-speech)
 * para cuando la respuesta llega sin voz neural (tts:"device").
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// Notas de voz: AAC mono a 16 kHz y 32 kbps, unos 60 KB cada 15 s (HIGH_QUALITY, estéreo
// a 44,1 kHz y 128 kbps, pasaba de 240 KB). La extensión .m4a y el tipo audio/m4a no cambian.
export const GRABACION_VOZ: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  // En web el navegador elige la frecuencia y los canales; solo se fija el bitrate.
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
};

// En Android, expo-speech hace Locale("es-ES"), no lo reconoce y lee con el idioma del
// sistema: allí hay que pasar 'es'/'en'. En iOS y web, la etiqueta completa.
export const idiomaVoz = (idioma: string): string => {
  const base = idioma === 'es' ? 'es' : 'en';
  if (Platform.OS === 'android') return base;
  return base === 'es' ? 'es-ES' : 'en-US';
};

// Android (expo-speech 14.0.8): hasta que el motor de voz arranca, speak() deja la lectura en una cola
// que stop() no vacía (suena luego aunque se haya parado), y si el motor no arranca (desactivado o
// ausente) nunca llega onDone ni onError. Por eso se arranca al montar la pantalla y solo se lee con
// el motor listo. getAvailableVoicesAsync() responde cuando ha arrancado; si no arranca, no responde
// nunca, así que se espera como mucho esperaMs (false: solo el texto). En iOS y web no hace falta.
let arranqueMotor: Promise<boolean> | null = null;
export const motorDeVozListo = (esperaMs = 0): Promise<boolean> => {
  if (Platform.OS !== 'android') return Promise.resolve(true);
  // Si responde, aunque sea con un error al listar las voces, el motor ya está arrancado.
  if (!arranqueMotor) arranqueMotor = Speech.getAvailableVoicesAsync().then(() => true, () => true);
  return Promise.race([arranqueMotor, new Promise<boolean>((r) => setTimeout(() => r(false), esperaMs))]);
};

// Plazos de la voz del dispositivo: lo que se espera a que el motor esté listo y a que empiece a
// leer (onStart). Pasado el segundo, la lectura se da por terminada y queda el texto.
export const ESPERA_MOTOR_VOZ_MS = 3000;
export const INICIO_VOZ_MS = 8000;

// Como clean_text_for_audio del backend: sin el bloque IMAGE PROMPT ni los caracteres *, # y `.
// Android no acepta más de 4000 caracteres y ese error no llega a onError, así que se recorta.
export const textoParaVoz = (texto: string): string =>
  (texto || '')
    .split(/IMAGE[ _]PROMPT:|IMAGEN_PROMPT:/i)[0]
    .replace(/[*#`]/g, '')
    .trim()
    .slice(0, Math.min(3999, Speech.maxSpeechInputLength - 1));
