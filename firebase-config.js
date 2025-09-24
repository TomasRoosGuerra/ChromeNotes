// Firebase Configuration for Web App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config - Your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBx5HGGzz7e9FU3E1ra878mUqqaFRTzfxM",
  authDomain: "chromenotes-52954.firebaseapp.com",
  projectId: "chromenotes-52954",
  storageBucket: "chromenotes-52954.firebasestorage.app",
  messagingSenderId: "34266562578",
  appId: "1:34266562578:web:c8d2cb76de1092b5f3d8cb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseSignIn = signInWithPopup;
window.firebaseSignOut = signOut;
window.firebaseOnAuthStateChanged = onAuthStateChanged;
window.firebaseGoogleProvider = new GoogleAuthProvider();
window.firebaseDoc = doc;
window.firebaseSetDoc = setDoc;
window.firebaseGetDoc = getDoc;
window.firebaseOnSnapshot = onSnapshot;
