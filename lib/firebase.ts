import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA51r7DnAIzJDkawawEXeNVCGb4VC6Eq1M",
  authDomain: "ascclub-dbd02.firebaseapp.com",
  projectId: "ascclub-dbd02",
  storageBucket: "ascclub-dbd02.firebasestorage.app",
  messagingSenderId: "804361246876",
  appId: "1:804361246876:web:51da96f9a9ebea28bf3559"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;




