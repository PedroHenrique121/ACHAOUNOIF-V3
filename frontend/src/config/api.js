import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizarUrl(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

function getLocalHostIp() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = String(hostUri)
      .trim()
      .replace(/^https?:\/\//i, "")
      .split(/[/:]/)[0];
    const hostEmTunel =
      host.endsWith(".on.expo.app") ||
      host.endsWith(".exp.direct") ||
      host.endsWith(".expo.dev") ||
      host.includes("ngrok");

    // O host do túnel serve o app Expo, não o backend na porta 3000.
    if (host && !hostEmTunel) {
      return host;
    }
  }

  // 10.0.2.2 só aponta para o computador no emulador Android.
  if (Platform.OS === "android" && !Constants.isDevice) {
    return "10.0.2.2";
  }

  return "localhost";
}

const urlConfigurada = normalizarUrl(process.env.EXPO_PUBLIC_API_URL);
const API_URL = urlConfigurada || `http://${getLocalHostIp()}:3000`;

export { API_URL };
export const UPLOADS_URL = `${API_URL}/uploads`;

export function getFotoUrl(nomeArquivo) {
  if (!nomeArquivo) return null;

  if (nomeArquivo.startsWith("http://") || nomeArquivo.startsWith("https://")) {
    return nomeArquivo;
  }

  return `${UPLOADS_URL}/${encodeURIComponent(nomeArquivo)}`;
}
