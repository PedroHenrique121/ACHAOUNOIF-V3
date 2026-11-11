import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCPlhId9WflsQAPKzD5Ue5gZsuzqm-Oemk",
  authDomain: "achanoif2.firebaseapp.com",
  projectId: "achanoif2",
  storageBucket: "achanoif2.firebasestorage.app",
  messagingSenderId: "934497056190",
  appId: "1:934497056190:web:b0c818e765f4c74e95b5ef",
  measurementId: "G-HNNXHVESFS",
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence:
      Platform.OS === "web"
        ? browserLocalPersistence
        : getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { app, auth };
