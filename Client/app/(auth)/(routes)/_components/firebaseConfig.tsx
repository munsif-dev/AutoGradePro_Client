import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjLvi4xu8uFkt8EM_qEtoEzJZLGFXM8zI",
  authDomain: "autogradepro-5ee7c.firebaseapp.com",
  projectId: "autogradepro-5ee7c",
  storageBucket: "autogradepro-5ee7c.appspot.com",
  messagingSenderId: "661141288583",
  appId: "1:661141288583:web:7d2f038fbef8388ff2ea22",
  measurementId: "G-5KM6E380V0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
