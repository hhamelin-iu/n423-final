import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { DEMO_USER, isFirebaseConfigured } from '../services/dataService';

const DEMO_USER_SESSION_KEY = 'loreboards_demo_user';

const AuthContext = createContext({
  user: null,
  isDemoMode: false,
  loading: true,
  signInAsDemo: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined: loading; null: signed out
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // If Firebase isn't configured, default immediately to Demo User for portfolio reviewers
    const hasFirebase = isFirebaseConfigured();

    if (!hasFirebase) {
      setUser(DEMO_USER);
      setIsDemoMode(true);
      return;
    }

    // Check if demo session was manually activated in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedDemo = window.localStorage.getItem(DEMO_USER_SESSION_KEY);
      if (storedDemo) {
        try {
          setUser(JSON.parse(storedDemo));
          setIsDemoMode(true);
          return;
        } catch {
          // ignore error
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsDemoMode(false);
      } else {
        // Fallback to Demo User if not signed in via Firebase
        const savedDemo = typeof window !== 'undefined' ? window.localStorage?.getItem(DEMO_USER_SESSION_KEY) : null;
        if (savedDemo) {
          setUser(JSON.parse(savedDemo));
          setIsDemoMode(true);
        } else {
          setUser(DEMO_USER);
          setIsDemoMode(true);
        }
      }
    });

    return unsubscribe;
  }, []);

  const signInAsDemo = (customProfile = null) => {
    const activeDemoUser = customProfile ? { ...DEMO_USER, ...customProfile } : DEMO_USER;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEMO_USER_SESSION_KEY, JSON.stringify(activeDemoUser));
    }
    setUser(activeDemoUser);
    setIsDemoMode(true);
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DEMO_USER_SESSION_KEY);
    }
    if (isFirebaseConfigured() && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setIsDemoMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isDemoMode,
        loading: user === undefined,
        signInAsDemo,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
