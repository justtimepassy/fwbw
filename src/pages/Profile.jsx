import { auth, logOut } from "../firebase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate("/login"); // Redirect if not signed in
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4">
      <h2 className="text-2xl font-bold text-center">My Profile</h2>
      
      {!user ? (
        <p className="text-center mt-4">You need to sign in to view your profile.</p>
      ) : (
        <div className="mt-6 border p-4 rounded-lg shadow-md text-center">
          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
          <h3 className="text-xl font-semibold mt-2">{user.displayName}</h3>
          <p className="text-gray-600">{user.email}</p>
          <button onClick={logOut} className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
