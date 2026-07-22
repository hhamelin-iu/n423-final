import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DEMO_USER, SIMULATED_USERS, SIMULATED_FEED_SUBMISSIONS } from './simulatedData';

export const MOCK_GAMES = [];

export const MOCK_PLATFORMS = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'PlayStation 3',
  'PlayStation 2',
  'PlayStation',
  'Xbox Series X|S',
  'Xbox One',
  'Xbox 360',
  'Xbox',
  'Nintendo Switch',
  'Wii U',
  'Wii',
  'GameCube',
  'Nintendo 64',
  'Super NES',
  'NES',
  'Game Boy',
  'Game Boy Advance',
  'Nintendo DS',
  'Nintendo 3DS',
  'iOS',
  'Android',
  'macOS',
  'Linux',
  'Sega Genesis',
  'Dreamcast',
  'Arcade',
  'Retro / Other'
];

export function hydrateSubmissionUser(sub) {
  if (!sub) return sub;
  const user = SIMULATED_USERS[sub.userId] || (sub.userId === DEMO_USER.uid ? DEMO_USER : null);
  return {
    ...sub,
    userDisplayName: sub.userDisplayName || user?.displayName || 'Gamer',
    userUsername: sub.userUsername || user?.username || 'Gamer',
    userPhoto: sub.userPhoto || user?.userPhoto || user?.photoData || null,
  };
}

const HYDRATED_SIMULATED_SUBMISSIONS = SIMULATED_FEED_SUBMISSIONS.map(hydrateSubmissionUser);

const STORAGE_KEY_SUBMISSIONS = 'loreboards_demo_submissions_v13';
const STORAGE_KEY_USER_PROFILE = 'loreboards_demo_user_profile';

const demoChannel = typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('loreboards_demo_sync')
  : null;

// Unique session tab ID to coordinate single generator tab leadership
const tabId = typeof window !== 'undefined' ? Math.random().toString(36).substr(2, 9) : 'native';

let currentDemoSubmissions = null;
let nextSimulatedIndex = 0;
const activeCallbacks = new Set();
let globalTimerId = null;

function ensureDemoSubmissionsInitialized() {
  if (currentDemoSubmissions === null) {
    currentDemoSubmissions = getLocalSubmissions();
  }
  return currentDemoSubmissions;
}

function triggerActiveCallbacks() {
  activeCallbacks.forEach(({ callback, limitCount }) => {
    callback({ data: currentDemoSubmissions.slice(0, limitCount), error: null });
  });
}

// Leadership lock mechanism: only one tab acquires card generation authority
function acquireLeadershipLock() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const now = Date.now();
    const rawTime = window.localStorage.getItem('loreboards_sync_lock_time');
    const owner = window.localStorage.getItem('loreboards_sync_lock_owner');
    const lockTime = rawTime ? parseInt(rawTime, 10) : 0;

    // Claim or renew lock if we already own it, or lock is unowned / expired (over 6 seconds old)
    if (owner === tabId || !owner || now - lockTime > 6000) {
      window.localStorage.setItem('loreboards_sync_lock_time', String(now));
      window.localStorage.setItem('loreboards_sync_lock_owner', tabId);
      return true;
    }
  } catch (err) {
    console.warn('Failed to access localStorage for leader lock', err);
  }
  return false;
}

// Listen for broadcast sync events from other tabs
if (demoChannel) {
  demoChannel.onmessage = (event) => {
    const { type, submission, id, nextIndex } = event.data || {};
    ensureDemoSubmissionsInitialized();

    if (type === 'NEW_SIMULATED_SUBMISSION') {
      if (typeof nextIndex === 'number') {
        nextSimulatedIndex = nextIndex;
      }
      if (!currentDemoSubmissions.some((s) => s.id === submission.id)) {
        const updated = [submission, ...currentDemoSubmissions];
        const capped = updated.slice(0, 60);
        saveLocalSubmissions(capped);
        triggerActiveCallbacks();
      }
    } else if (type === 'SAVE_SUBMISSION') {
      const index = currentDemoSubmissions.findIndex((s) => s.id === submission.id);
      let updated;
      if (index !== -1) {
        updated = currentDemoSubmissions.map((item) => item.id === submission.id ? submission : item);
      } else {
        updated = [submission, ...currentDemoSubmissions];
      }
      currentDemoSubmissions = updated.slice(0, 60);
      triggerActiveCallbacks();
    } else if (type === 'DELETE_SUBMISSION') {
      currentDemoSubmissions = currentDemoSubmissions.filter((item) => item.id !== id);
      triggerActiveCallbacks();
    }
  };
}

const startGlobalSimulation = () => {
  if (globalTimerId) return;

  const scheduleNext = (delayMs) => {
    globalTimerId = setTimeout(() => {
      // 1. Attempt to claim/renew generator lock
      const isLeader = acquireLeadershipLock();
      
      // 2. Check tab visibility (hidden tabs yield lock to allow active tab to generate)
      const isVisible = typeof document !== 'undefined' && !document.hidden;

      let nextDelay = 1500; // Followers check lock status every 1.5 seconds

      if (isLeader && isVisible) {
        if (Array.isArray(SIMULATED_FEED_SUBMISSIONS) && SIMULATED_FEED_SUBMISSIONS.length > 0) {
          ensureDemoSubmissionsInitialized();

          // Pick a random game template that is not currently visible in currentDemoSubmissions
          const unshownTemplates = SIMULATED_FEED_SUBMISSIONS.filter(
            (currentT) => !currentDemoSubmissions.some(
              (s) => s.title.toLowerCase() === currentT.title.toLowerCase() || s.igdbId === currentT.igdbId
            )
          );

          let template = null;
          if (unshownTemplates.length > 0) {
            const randomIndex = Math.floor(Math.random() * unshownTemplates.length);
            template = unshownTemplates[randomIndex];
          } else {
            // Fallback: pick a random item from the full pool if all games are currently in view
            const randomIndex = Math.floor(Math.random() * SIMULATED_FEED_SUBMISSIONS.length);
            template = SIMULATED_FEED_SUBMISSIONS[randomIndex];
          }

          const newSub = hydrateSubmissionUser({
            ...template,
            id: `sim-sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            createdAt: new Date().toISOString()
          });

          const updated = [newSub, ...currentDemoSubmissions];
          const capped = updated.slice(0, 60);
          saveLocalSubmissions(capped);

          // Broadcast simulated addition to other tabs
          demoChannel?.postMessage({
            type: 'NEW_SIMULATED_SUBMISSION',
            submission: newSub,
            nextIndex: nextSimulatedIndex
          });

          // Trigger callbacks in this tab
          triggerActiveCallbacks();
        }

        // Leader schedules next execution in 3-6 seconds
        nextDelay = 3000 + Math.random() * 3000;
      }

      // Schedule next check/tick
      scheduleNext(nextDelay);
    }, delayMs);
  };

  // Start by scheduling the first check in 1 second (1000ms)
  scheduleNext(1000);
};

// Check if live Firebase is active and configured
export function isFirebaseConfigured() {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  return Boolean(key && !key.includes('<your_'));
}

// Helpers for LocalStorage demo persistence
function getLocalSubmissions() {
  const initial = HYDRATED_SIMULATED_SUBMISSIONS.slice(0, 12);
  if (typeof window === 'undefined' || !window.localStorage) {
    return initial;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(hydrateSubmissionUser) : initial;
  } catch {
    return initial;
  }
}

function saveLocalSubmissions(subs) {
  currentDemoSubmissions = subs;
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
          ensureDemoSubmissionsInitialized();
          callback({ data: currentDemoSubmissions.slice(0, limitCount), error: null });
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firebase query failed, using demo storage', e);
    }
  }

  // Fallback / Standalone Demo Mode
  ensureDemoSubmissionsInitialized();
  callback({ data: currentDemoSubmissions.slice(0, limitCount), error: null });

  const listenerRecord = { callback, limitCount };
  activeCallbacks.add(listenerRecord);

  // Start global timer loop
  startGlobalSimulation();

  return () => {
    activeCallbacks.delete(listenerRecord);
    if (activeCallbacks.size === 0) {
      if (globalTimerId) {
        clearTimeout(globalTimerId);
        globalTimerId = null;
      }
    }
  };
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
  ensureDemoSubmissionsInitialized();
  return currentDemoSubmissions.slice(0, limitCount);
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
  ensureDemoSubmissionsInitialized();
  return currentDemoSubmissions.find((s) => s.id === id) || null;
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
  ensureDemoSubmissionsInitialized();
  const current = currentDemoSubmissions;
  if (editId) {
    const updated = current.map((item) => (item.id === editId ? { ...item, ...payload } : item));
    saveLocalSubmissions(updated);
    // Broadcast manual edit
    demoChannel?.postMessage({
      type: 'SAVE_SUBMISSION',
      submission: { ...payload, id: editId }
    });
    return editId;
  } else {
    const newId = `demo-sub-${Date.now()}`;
    payload.id = newId;
    payload.createdAt = new Date().toISOString();
    const updated = [payload, ...current];
    saveLocalSubmissions(updated);
    // Broadcast manual addition
    demoChannel?.postMessage({
      type: 'SAVE_SUBMISSION',
      submission: payload
    });
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
  ensureDemoSubmissionsInitialized();
  const current = currentDemoSubmissions;
  const filtered = current.filter((item) => item.id !== id);
  saveLocalSubmissions(filtered);
  // Broadcast deletion
  demoChannel?.postMessage({
    type: 'DELETE_SUBMISSION',
    id: id
  });
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

export { DEMO_USER };
