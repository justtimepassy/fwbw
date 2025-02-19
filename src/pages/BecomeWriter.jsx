// pages/BecomeWriter.js
import React, { useState } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";

const BecomeWriter = () => {
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!bio.trim()) {
      setError("Bio cannot be empty.");
      return;
    }
    try {
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        isWriter: true,
        writerProfile: {
          rating: 0,
          reviews: [],
          tasksChosen: 0,
          tasksCompleted: 0,
          bio,
          // You can add additional fields like portfolio, skills, and availability here
        },
      });
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError("Failed to update writer profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto py-12">
        <h2 className="text-2xl font-bold text-center mb-4">Become a Writer</h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
          <textarea
            placeholder="Tell us about yourself (Bio)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecomeWriter;
