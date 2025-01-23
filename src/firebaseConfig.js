// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCs-xerrIr0KpnCTihTX-GowGDAZbRZFvA",
  authDomain: "creative-assistant-j.firebaseapp.com",
  databaseURL: "https://creative-assistant-j-default-rtdb.firebaseio.com",
  projectId: "creative-assistant-j",
  storageBucket: "creative-assistant-j.firebasestorage.app",
  messagingSenderId: "414003942125",
  appId: "1:414003942125:web:d1400f5fa9358683f832e4",
  measurementId: "G-NJWKCE24C4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db, signInWithPopup };
