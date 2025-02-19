import React, { useState, useEffect } from "react";
import { auth, firestore, logOut } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
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

        if (data.writerProfile) {
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
      "writerProfile.pricePerPage": pricePerPage,
      "writerProfile.minPages": minPages,
      "writerProfile.maxPages": maxPages,
      "writerProfile.isAvailable": isAvailable,
    });
    setEditing(false);
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
        src={userData.profilePic || "https://via.placeholder.com/150"}
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-gray-300 mt-4"
      />

      <h3 className="text-xl mt-2">{userData.username}</h3>
      <p>{userData.email}</p>
      <p className="mt-2">{userData.writerProfile?.bio || "No bio available"}</p>

      {userData.isWriter && (
        <div className="mt-4">
          <p>Rating: {userData.writerProfile?.rating ?? "No ratings yet"}</p>
          <p>Tasks Completed: {userData.writerProfile?.tasksCompleted ?? 0}</p>

          {editing ? (
            <div className="mt-4 space-y-2">
              <label>
                Price per Page (₹):
                <input
                  type="number"
                  value={pricePerPage}
                  onChange={(e) => setPricePerPage(Number(e.target.value))}
                  className="border p-2 w-full"
                />
              </label>

              <label>
                Min Pages:
                <input
                  type="number"
                  value={minPages}
                  onChange={(e) => setMinPages(Number(e.target.value))}
                  className="border p-2 w-full"
                />
              </label>

              <label>
                Max Pages:
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  className="border p-2 w-full"
                />
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span className="ml-2">Available for Writing</span>
              </label>

              <button
                onClick={handleUpdate}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <p>Price per Page: ₹{pricePerPage}</p>
              <p>Pages Accepted: {minPages} - {maxPages}</p>
              <p>Status: {isAvailable ? "✅ Available" : "❌ Unavailable"}</p>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={logOut}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
