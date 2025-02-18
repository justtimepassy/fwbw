// Import necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
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

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services for use in the project
export { app, auth, db, storage };
