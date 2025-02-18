import React from "react";
import { signInWithGoogle } from "../firebase";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    const user = await signInWithGoogle();
    if (user) navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
      <button
        onClick={handleGoogleSignUp}
        className="bg-green-500 text-white px-6 py-2 rounded-lg"
      >
        Sign up with Google
      </button>
    </div>
  );
};

export default Signup;
