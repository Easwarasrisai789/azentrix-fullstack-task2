// Firebase initialization with provided config
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAhB6FQeXLsbr3BYqgWkbm2ILCsHYe7teI",
  authDomain: "fullstack2-40b7d.firebaseapp.com",
  projectId: "fullstack2-40b7d",
  storageBucket: "fullstack2-40b7d.firebasestorage.app",
  messagingSenderId: "55559663014",
  appId: "1:55559663014:web:fb0bbe0813e20e43267367",
  measurementId: "G-HSLHDZK014"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };