import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DEMO_USER, INITIAL_DEMO_SUBMISSIONS } from './demoData';
import { MOCK_GAMES, MOCK_PLATFORMS } from './mockGames';

const STORAGE_KEY_SUBMISSIONS = 'loreboards_demo_submissions_v7';
const STORAGE_KEY_USER_PROFILE = 'loreboards_demo_user_profile';

// Check if live Firebase is active and configured
export function isFirebaseConfigured() {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  return Boolean(key && !key.includes('<your_'));
}

// Helpers for LocalStorage demo persistence
function getLocalSubmissions() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_DEMO_SUBMISSIONS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
      return INITIAL_DEMO_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_SUBMISSIONS;
  }
}

function saveLocalSubmissions(subs) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(subs));
    } catch (err) {
      console.warn('Failed to save to localStorage', err);
    }
  }
}

// -------------------------------------------------------------
// SUBMISSION SERVICE
// -------------------------------------------------------------

export function subscribeSubmissions(callback, limitCount = 20) {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
      const unsubscribe = onSnapshot(
        q,
        async (snap) => {
          const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const profilePromises = raw.map(async (s) => {
            if (!s.userId) return { userPhoto: null, displayName: null, username: null };
            try {
              const profileSnap = await getDoc(doc(db, 'profiles', s.userId));
              const pdata = profileSnap.data();
              return {
                userPhoto: pdata?.photoData || null,
                displayName: pdata?.displayName || pdata?.username || null,
                username: pdata?.username || null,
              };
            } catch {
              return { userPhoto: null, displayName: null, username: null };
            }
          });
          const profiles = await Promise.all(profilePromises);
          const merged = raw.map((s, idx) => ({
            ...s,
            userPhoto: profiles[idx]?.userPhoto || null,
            userDisplayName: profiles[idx]?.displayName || profiles[idx]?.username || s.userDisplayName || 'Anonymous',
            userUsername: profiles[idx]?.username || s.userUsername || null,
          }));
          callback({ data: merged, error: null });
        },
        (err) => {
          console.warn('Firestore snapshot listener failed, falling back to local storage', err);
          callback({ data: getLocalSubmissions(), error: null });
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firebase query failed, using demo storage', e);
    }
  }

  // Fallback / Standalone Demo Mode
  const demoData = getLocalSubmissions();
  callback({ data: demoData, error: null });
  return () => {};
}

export async function fetchSubmissions(limitCount = 120) {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
      const snap = await getDocs(q);
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const profilePromises = raw.map(async (s) => {
        if (!s.userId) return { userPhoto: null, displayName: null, username: null };
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', s.userId));
          const pdata = profileSnap.data();
          return {
            userPhoto: pdata?.photoData || null,
            displayName: pdata?.displayName || pdata?.username || null,
            username: pdata?.username || null,
          };
        } catch {
          return { userPhoto: null, displayName: null, username: null };
        }
      });
      const profiles = await Promise.all(profilePromises);
      return raw.map((s, idx) => ({
        ...s,
        userPhoto: profiles[idx]?.userPhoto || null,
        userDisplayName: profiles[idx]?.displayName || s.userDisplayName || 'Anonymous',
        userUsername: profiles[idx]?.username || s.userUsername || null,
      }));
    } catch (err) {
      console.warn('Firebase fetchSubmissions failed, returning demo data', err);
    }
  }
  return getLocalSubmissions();
}

export async function getSubmissionById(id) {
  if (isFirebaseConfigured() && db) {
    try {
      const docSnap = await getDoc(doc(db, 'submissions', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {
      console.warn('Firebase getSubmissionById failed', err);
    }
  }
  const local = getLocalSubmissions();
  return local.find((s) => s.id === id) || null;
}

export async function saveSubmission(submissionData, user, editId = null) {
  const payload = {
    ...submissionData,
    userId: user?.uid || DEMO_USER.uid,
    userDisplayName: user?.displayName || DEMO_USER.displayName,
    userUsername: user?.username || DEMO_USER.username,
    userPhoto: user?.photoData || user?.photoURL || DEMO_USER.photoData,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db && !user?.isDemo) {
    try {
      if (editId) {
        await setDoc(doc(db, 'submissions', editId), payload, { merge: true });
        return editId;
      } else {
        payload.createdAt = new Date().toISOString();
        const ref = await addDoc(collection(db, 'submissions'), payload);
        return ref.id;
      }
    } catch (err) {
      console.warn('Firebase saveSubmission failed, writing to local demo storage', err);
    }
  }

  // Demo / LocalStorage behavior
  const current = getLocalSubmissions();
  if (editId) {
    const updated = current.map((item) => (item.id === editId ? { ...item, ...payload } : item));
    saveLocalSubmissions(updated);
    return editId;
  } else {
    const newId = `demo-sub-${Date.now()}`;
    payload.id = newId;
    payload.createdAt = new Date().toISOString();
    const updated = [payload, ...current];
    saveLocalSubmissions(updated);
    return newId;
  }
}

export async function deleteSubmission(id, userId, userObj) {
  if (isFirebaseConfigured() && db && !userObj?.isDemo) {
    try {
      await deleteDoc(doc(db, 'submissions', id));
    } catch (err) {
      console.warn('Firebase deleteSubmission failed', err);
    }
  }
  const current = getLocalSubmissions();
  const filtered = current.filter((item) => item.id !== id);
  saveLocalSubmissions(filtered);
  return true;
}

// -------------------------------------------------------------
// GAME SEARCH SERVICE (IGDB + Static Fallback)
// -------------------------------------------------------------

export async function searchGames(queryTerm, apiBaseUrl = '') {
  if (!queryTerm || !queryTerm.trim()) {
    return MOCK_GAMES;
  }

  const cleanQuery = queryTerm.trim().toLowerCase();

  // 1. Try local Express proxy if apiBaseUrl is available
  if (apiBaseUrl) {
    try {
      const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/igdb/games?q=${encodeURIComponent(queryTerm)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      // Proxy unavailable, will fallback to mock
    }
  }

  // 2. Fallback to searching mock games dataset
  return MOCK_GAMES.filter((g) =>
    (g.title || g.name || '').toLowerCase().includes(cleanQuery) ||
    (g.developer || '').toLowerCase().includes(cleanQuery) ||
    (g.platform || '').toLowerCase().includes(cleanQuery)
  );
}

export { MOCK_PLATFORMS, MOCK_GAMES, DEMO_USER };
