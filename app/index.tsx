import { Redirect } from 'expo-router';

export default function EntryPoint() {
  // Esta es la instrucción que dice: 
  // "Si entras por la raíz, vete directo a la carpeta (auth)"
  return <Redirect href="/(auth)" />;
}