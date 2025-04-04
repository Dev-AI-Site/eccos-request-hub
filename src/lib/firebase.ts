
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGDLj4P5wNnfVK2BjjzzPhCKJNxi-z5QE",
  authDomain: "plataforma---eccos.firebaseapp.com",
  projectId: "plataforma---eccos",
  storageBucket: "plataforma---eccos.appspot.com",
  messagingSenderId: "38379860284",
  appId: "1:38379860284:web:a849fdf87b126ed080ae39"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google authentication with domain restriction
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: "colegioeccos.com.br" // Restrict to this domain
  });
  
  return signInWithPopup(auth, provider);
};
