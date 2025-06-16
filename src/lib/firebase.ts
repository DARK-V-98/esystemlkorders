
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; // Import getAuth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4N7py6wI38KUyKD1RzzuZenIA1VAwV9M",
  authDomain: "esystemlk-web.firebaseapp.com",
  projectId: "esystemlk-web",
  storageBucket: "esystemlk-web.appspot.com", // Corrected storageBucket from your previous request, as .firebasestorage.app is not valid. It should be .appspot.com
  messagingSenderId: "87807547925",
  appId: "1:87807547925:web:299ba3a46823791ade0c1c"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize and export auth

export { db, storage, app, auth }; // Export auth
