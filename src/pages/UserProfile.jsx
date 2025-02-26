import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams } from "react-router-dom";

const UserProfile = () => {
  const { username } = useParams(); // Get username from URL
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };

    fetchUserProfile();
  }, [username]);

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold">User Profile</h2>

      <img
        src={userData.profilePic || userData.photoURL || "https://via.placeholder.com/150"}
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-gray-300 mt-4"
        onError={(e) => (e.target.src = "https://via.placeholder.com/150")} // Fallback image
      />

      <h3 className="text-xl mt-2">{userData.username}</h3>
      <p>{userData.email}</p>
      <p className="mt-2">{userData.writerProfile?.bio || "No bio available"}</p>

      {userData.isWriter && (
        <div className="mt-4">
          <p>Rating: {userData.writerProfile?.rating ?? "No ratings yet"}</p>
          <p>Tasks Completed: {userData.writerProfile?.tasksCompleted ?? 0}</p>
          <p>Price per Page: ₹{userData.writerProfile?.pricePerPage}</p>
          <p>Pages Accepted: {userData.writerProfile?.minPages} - {userData.writerProfile?.maxPages}</p>
          <p>Status: {userData.writerProfile?.isAvailable ? "✅ Available" : "❌ Unavailable"}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
