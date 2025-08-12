// lib/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAFwfkNljj0IMDiEQ8P9cWKWgJWWVfgC2g',
  authDomain: 'crossword-battle-arena-c1000.firebaseapp.com',
  projectId: 'crossword-battle-arena-c1000',
  storageBucket: 'crossword-battle-arena-c1000.firebasestorage.app',
  messagingSenderId: '664223071645',
  appId: '1:664223071645:web:940f30c02f7f1ac651c374',
}

// ✅ Initialize app once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Firestore (for stats, profiles, etc.)
export const firestore = getFirestore(app);

// ✅ Realtime Database (for grid, chat, live scores)
export const rtdb = getDatabase(app);
