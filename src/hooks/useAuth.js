import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

let globalTokenClient = null;
let scriptLoading = false;

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState(() => localStorage.getItem('google_access_token'));

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const initTokenClient = () => {
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!client_id) {
        console.warn("VITE_GOOGLE_CLIENT_ID missing! GIS automatic sync will fail.");
        return;
      }
      globalTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: client_id,
        scope: 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setGoogleToken(tokenResponse.access_token);
            localStorage.setItem('google_access_token', tokenResponse.access_token);
            console.log("GIS Silent Refresh successful!");
          } else if (tokenResponse && tokenResponse.error) {
            console.warn("GIS Silent Refresh failed:", tokenResponse.error);
            clearGoogleToken();
          }
        },
      });
    };

    if (!globalTokenClient && !scriptLoading) {
      if (window.google?.accounts?.oauth2) {
        initTokenClient();
      } else {
        scriptLoading = true;
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          scriptLoading = false;
          initTokenClient();
        };
        document.body.appendChild(script);
      }
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

  const clearGoogleToken = () => {
    setGoogleToken(null);
    localStorage.removeItem('google_access_token');
  };

  const refreshGoogleToken = async () => {
    if (!globalTokenClient) {
      console.warn("GIS Token Client not loaded.");
      clearGoogleToken();
      return;
    }

    const lastRefresh = sessionStorage.getItem('last_refresh_attempt');
    if (lastRefresh && Date.now() - parseInt(lastRefresh) < 60000) {
      console.warn("Token refresh loop detected. Clearing token.");
      clearGoogleToken();
      return;
    }
    sessionStorage.setItem('last_refresh_attempt', Date.now().toString());
    
    try {
      globalTokenClient.requestAccessToken({ 
        prompt: 'none', 
        login_hint: auth?.currentUser?.email 
      });
    } catch (error) {
      console.error("GIS silent refresh trigger failed:", error);
      clearGoogleToken();
    }
  };

  const connectGoogleAPI = () => {
    if (!globalTokenClient) return alert("Google API not loaded yet. Check VITE_GOOGLE_CLIENT_ID.");
    globalTokenClient.requestAccessToken({ prompt: 'consent', login_hint: auth?.currentUser?.email });
  };

  return { user, loading, loginWithGoogle, logout, googleToken, clearGoogleToken, refreshGoogleToken, connectGoogleAPI };
}
