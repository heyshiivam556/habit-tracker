import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase config
// Find this in your Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyAWeQx9irdjZ8ICWtv8MTaW8Xy9wejfGgQ",
  authDomain: "habit-tracker-53f76.firebaseapp.com",
  projectId: "habit-tracker-53f76",
  storageBucket: "habit-tracker-53f76.firebasestorage.app",
  messagingSenderId: "1007113559306",
  appId: "1:1007113559306:web:72d47eba9e564c14ddaef3",
  measurementId: "G-RSBSJF0B38"
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
