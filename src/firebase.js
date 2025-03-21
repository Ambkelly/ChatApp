import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZtyOqL0DC7_ZeETGQi-1C_aMueNM-ss4",
  authDomain: "chatapp-b5e3c.firebaseapp.com",
  projectId: "chatapp-b5e3c",
  storageBucket: "chatapp-b5e3c.appspot.com", // Corrected storageBucket
  messagingSenderId: "888512999947",
  appId: "1:888512999947:web:816706e675cf3188088d0e", // Removed extra space
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app); // Initialize Storage

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export the required modules
export { auth, googleProvider, db, storage }; // Export storage