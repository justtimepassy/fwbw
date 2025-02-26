import React, { useState, useEffect } from "react";
import { auth, firestore, logOut } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [pricePerPage, setPricePerPage] = useState(0);
  const [minPages, setMinPages] = useState(1);
  const [maxPages, setMaxPages] = useState(10);
  const [isAvailable, setIsAvailable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists() || !docSnap.data().username) {
        navigate("/onboarding");
      } else {
        const data = docSnap.data();
        setUserData(data);

        if (data.isWriter && data.writerProfile) {
          setBio(data.writerProfile.bio || "");
          setPricePerPage(data.writerProfile.pricePerPage || 0);
          setMinPages(data.writerProfile.minPages || 1);
          setMaxPages(data.writerProfile.maxPages || 10);
          setIsAvailable(data.writerProfile.isAvailable || false);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUpdate = async () => {
    if (!userData) return;
    const userDocRef = doc(firestore, "users", auth.currentUser.uid);
    await updateDoc(userDocRef, {
      writerProfile: {
        bio,
        pricePerPage,
        minPages,
        maxPages,
        isAvailable,
        tasksCompleted: userData.writerProfile?.tasksCompleted || 0,
        rating: userData.writerProfile?.rating || 0,
      },
    });
    setEditing(false);
  };

  const handleBecomeWriter = async () => {
    if (!userData) return;
    const userDocRef = doc(firestore, "users", auth.currentUser.uid);
    await setDoc(userDocRef, {
      isWriter: true,
      writerProfile: {
        bio: "",
        pricePerPage: 0,
        minPages: 1,
        maxPages: 10,
        isAvailable: false,
        tasksCompleted: 0,
        rating: 0,
      },
    }, { merge: true });

    setUserData((prev) => ({ ...prev, isWriter: true, writerProfile: {} }));
    setEditing(true);
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold">My Profile</h2>

      <img
        src={userData.profilePic || auth.currentUser?.photoURL || "https://via.placeholder.com/150"}
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-gray-300 mt-4"
        onError={(e) => (e.target.src = "https://via.placeholder.com/150")} // Fallback if image fails to load
      />

      <h3 className="text-xl mt-2">{userData.username}</h3>
      <p>{userData.email}</p>

      {!userData.isWriter ? (
        <button
          onClick={handleBecomeWriter}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Become a Writer
        </button>
      ) : (
        <div className="mt-4 w-full max-w-md">
          <h3 className="font-bold">Writer Profile</h3>

          <div className="border p-4 rounded-md shadow-md">
            <p><strong>Bio:</strong> {bio || "No bio available"}</p>
            <p><strong>Price per Page:</strong> ₹{pricePerPage}</p>
            <p><strong>Pages Accepted:</strong> {minPages} - {maxPages}</p>
            <p><strong>Tasks Completed:</strong> {userData.writerProfile?.tasksCompleted ?? 0}</p>
            <p><strong>Rating:</strong> {userData.writerProfile?.rating ?? "No ratings yet"}</p>
            <p><strong>Status:</strong> {isAvailable ? "✅ Available" : "❌ Unavailable"}</p>
          </div>

          {editing ? (
            <div className="mt-4 space-y-2">
              <label className="block">
                <span className="text-gray-700">Bio:</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border p-2 w-full rounded-md"
                />
              </label>

              <label className="block">
                <span className="text-gray-700">Price per Page (₹):</span>
                <input
                  type="number"
                  value={pricePerPage}
                  onChange={(e) => setPricePerPage(Number(e.target.value))}
                  className="border p-2 w-full rounded-md"
                />
              </label>

              <label className="block">
                <span className="text-gray-700">Min Pages:</span>
                <input
                  type="number"
                  value={minPages}
                  onChange={(e) => setMinPages(Number(e.target.value))}
                  className="border p-2 w-full rounded-md"
                />
              </label>

              <label className="block">
                <span className="text-gray-700">Max Pages:</span>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  className="border p-2 w-full rounded-md"
                />
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="mr-2"
                />
                <span>Available for Writing</span>
              </label>

              <div className="flex space-x-4">
                <button
                  onClick={handleUpdate}
                  className="bg-green-500 text-white px-4 py-2 rounded-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Edit Writer Profile
            </button>
          )}
        </div>
      )}

      <button
        onClick={logOut}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded-md"
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
