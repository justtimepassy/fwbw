import React, { useEffect, useState } from "react";
import { auth, signInWithGoogle, logOut } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const GoogleAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
        <div className="text-center">
          <img src={user.photoURL} alt="User Avatar" className="w-16 h-16 rounded-full mb-2" />
          <h2 className="text-lg font-bold">{user.displayName}</h2>
          <p>{user.email}</p>
          <button
            onClick={logOut}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default GoogleAuth;
