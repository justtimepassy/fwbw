import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const Post = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate("/login"); // Redirect to login if not signed in
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4">
      <h2 className="text-2xl font-bold text-center">Post an Assignment</h2>
      
      {!user ? (
        <p className="text-center mt-4">You need to sign in to post.</p>
      ) : (
        <div className="mt-6 border p-4 rounded-lg shadow-md">
          <p><strong>User:</strong> {user.displayName || "Anonymous"}</p>
          <label className="block mt-4">
            <span className="text-gray-700">Assignment Details</span>
            <textarea className="w-full border rounded p-2 mt-1" placeholder="Describe your assignment..." />
          </label>
          <label className="block mt-4">
            <span className="text-gray-700">Pages Required</span>
            <input type="number" className="w-full border rounded p-2 mt-1" placeholder="Enter number of pages" />
          </label>
          <label className="block mt-4">
            <span className="text-gray-700">Price Per Page</span>
            <input type="number" className="w-full border rounded p-2 mt-1" placeholder="Enter price per page" />
          </label>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Submit Post
          </button>
        </div>
      )}
    </div>
  );
};

export default Post;
