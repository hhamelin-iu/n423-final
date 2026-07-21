import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

let app = null;
let auth = null;
let db = null;

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const isConfigured = Boolean(apiKey && !apiKey.includes("<your_") && apiKey.trim().length > 10);

if (isConfigured) {
  try {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    auth =
      Platform.OS === "web"
        ? getAuth(app)
        : initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
          });
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firebase initialization skipped due to invalid credentials. Running in Standalone Demo Mode.", err);
    app = null;
    auth = null;
    db = null;
  }
} else {
  // eslint-disable-next-line no-console
  console.log("No live Firebase credentials detected. App running in Standalone Demo Mode.");
}

export { app, auth, db };
