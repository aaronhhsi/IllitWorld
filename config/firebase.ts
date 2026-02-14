import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUMWsGsiRvOg4_a9CKUUFBifR1kw_guC8",
  authDomain: "illit-world.firebaseapp.com",
  projectId: "illit-world",
  storageBucket: "illit-world.firebasestorage.app",
  messagingSenderId: "585880702830",
  appId: "1:585880702830:web:3be7a766ac69a3acefbb7f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);
