// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVeg--ErX4tMgWvzuWpCEAyTiYTclT_Gs",
  authDomain: "fwbw-8ad0f.firebaseapp.com",
  databaseURL: "https://fwbw-8ad0f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fwbw-8ad0f",
  storageBucket: "fwbw-8ad0f.appspot.com",
  messagingSenderId: "945105370845",
  appId: "1:945105370845:web:ba17b7b1805db8e967e534",
  measurementId: "G-482V93QLGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Function to Sign in with Google (Only College Email Allowed)
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;

    // Restrict to only @cmrcet.ac.in emails
    if (!email.endsWith("@cmrcet.ac.in")) {
      await signOut(auth); // Immediately log the user out
      alert("Only CMRCET college emails are allowed!");
      return null;
    }

    console.log("User Info:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};

// Function to Sign Out
const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// Export modules with Firestore as "firestore"
export { app, auth, db as firestore, storage, signInWithGoogle, logOut };
