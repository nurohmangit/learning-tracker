import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5uJBrQ9Uugh1EG3EgeUWEXX1b447rqR4",
  authDomain: "learning-tracker-484f5.firebaseapp.com",
  projectId: "learning-tracker-484f5",
  storageBucket: "learning-tracker-484f5.firebasestorage.app",
  messagingSenderId: "761997592115",
  appId: "1:761997592115:web:a9303a845c4f71c818c546"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
