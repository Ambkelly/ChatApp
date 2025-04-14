import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  serverTimestamp, 
  doc, 
  setDoc 
} from "firebase/firestore";
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

// Set persistence for auth
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// User presence tracking
const setupUserPresence = (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const isOfflineForFirestore = {
    status: 'offline',
    lastChanged: serverTimestamp(),
  };
  const isOnlineForFirestore = {
    status: 'online',
    lastChanged: serverTimestamp(),
  };

  // Set user as online
  setDoc(userRef, isOnlineForFirestore, { merge: true });
  
  // Set user as offline when they disconnect
  window.addEventListener('beforeunload', () => {
    setDoc(userRef, isOfflineForFirestore, { merge: true });
  });
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    setupUserPresence(user);
  }
});

export { auth, googleProvider, db, storage, serverTimestamp };