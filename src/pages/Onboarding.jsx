// pages/Onboarding.js
import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";

const Onboarding = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(firestore, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && docSnap.data().username) {
          navigate("/profile"); // Redirect if user has already onboarded
        }
      } else {
        navigate("/login"); // Ensure only logged-in users access this page
      }
    };

    checkUserProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    setChecking(true);

    try {
      // Check if username is already taken
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("Username is already taken. Please choose another.");
        setChecking(false);
        return;
      }

      // Store user's profile picture if available
      const profilePic = auth.currentUser?.photoURL || "";

      // Save user details in Firestore
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await setDoc(
        userDocRef,
        {
          username,
          email: auth.currentUser.email,
          profilePic, // Save Google profile picture
          isWriter: false,
        },
        { merge: true }
      );

      navigate("/profile"); // Redirect to profile after onboarding
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }

    setChecking(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Set up your Username</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter a unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            {checking ? "Checking..." : "Save Username"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
