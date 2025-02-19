// pages/Onboarding.js
import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";

const Onboarding = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If the user already has a username, redirect them to the profile.
    const checkUserProfile = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(firestore, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().username) {
          navigate("/profile");
        }
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
      // Check for username uniqueness.
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError("Username is already taken. Please choose another.");
        setChecking(false);
        return;
      }
      // Save username to Firestore for the current user.
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await setDoc(
        userDocRef,
        {
          username,
          email: auth.currentUser.email,
          isWriter: false,
        },
        { merge: true }
      );
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto py-12">
        <h2 className="text-2xl font-bold text-center mb-4">Set up your Username</h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
          <input
            type="text"
            placeholder="Enter a unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
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
