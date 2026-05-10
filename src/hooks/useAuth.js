import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState(() => localStorage.getItem('google_access_token'));

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check if we just came back from a mobile redirect login
    getRedirectResult(auth).then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          const token = credential.accessToken;
          setGoogleToken(token);
          localStorage.setItem('google_access_token', token);
        }
      }
    }).catch((error) => {
      console.error("Error with redirect sign in", error);
      // alert("Error completing sign in: " + error.message); // Commented out to avoid annoying alerts on load
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) {
      alert("Firebase is not configured. Please add your credentials to src/firebase.js");
      return;
    }
    
    try {
      // Always try popup first. It works better when third-party cookies are blocked.
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken;
        setGoogleToken(token);
        localStorage.setItem('google_access_token', token);
      }
    } catch (error) {
      // If popup is blocked by the browser, fallback to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        alert("Popup blocked or closed. Trying redirect method instead...");
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error("Error signing in with Google", error);
        alert("Error signing in: " + error.message);
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setGoogleToken(null);
      localStorage.removeItem('google_access_token');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, loginWithGoogle, logout, googleToken };
}
