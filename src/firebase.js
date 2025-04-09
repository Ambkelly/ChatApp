import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDZtyOqL0DC7_ZeETGQi-1C_aMueNM-ss4",
  authDomain: "chatapp-b5e3c.firebaseapp.com",
  projectId: "chatapp-b5e3c",
  storageBucket: "chatapp-b5e3c.appspot.com",
  messagingSenderId: "888512999947",
  appId: "1:888512999947:web:816706e675cf3188088d0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence for auth (optional)
import { setPersistence, browserLocalPersistence } from "firebase/auth";
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export { auth, googleProvider, db, storage };