import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase config
// Find this in your Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, db, auth, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  
  // Use modern offline persistence (fixes the deprecation warning)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  
  auth = getAuth(app);

  googleProvider = new GoogleAuthProvider();
  // Request permissions to read calendar and manage tasks
  googleProvider.addScope('https://www.googleapis.com/auth/tasks');
  googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

} catch (e) {
  console.warn("Firebase is not configured. Add credentials to src/firebase.js to enable cloud sync.", e);
}

export { db, auth, googleProvider };
