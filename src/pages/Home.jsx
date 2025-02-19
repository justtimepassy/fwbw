import React, { useState, useEffect } from "react";
import { auth, firestore, signInWithGoogle } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const Home = () => {
  const [user, setUser] = useState(null);
  const [writers, setWriters] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const fetchAvailableWriters = async () => {
      const writersRef = collection(firestore, "users");
      const q = query(writersRef, where("writerProfile.isAvailable", "==", true));
      const querySnapshot = await getDocs(q);
      const fetchedWriters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWriters(fetchedWriters);
    };

    fetchAvailableWriters();
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to WriteHub</h1>
          {!user && (
            <p className="mt-4 text-gray-600">
              Sign in to connect with professional writers and start your project
            </p>
          )}
        </div>

        {writers.length === 0 ? (
          <p className="text-center text-gray-600">No available writers at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writers.map((writer) => (
              <div 
                key={writer.id} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <img
                  src={writer.profilePic || "https://via.placeholder.com/150"}
                  alt="Writer"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-gray-300 object-cover mb-3"
                />

                <Link to={`/user/${writer.username}`}>
                  <h2 className="text-xl font-semibold text-gray-800 text-center hover:underline">
                    {writer.username}
                  </h2>
                </Link>

                <div className="space-y-2 text-gray-600 text-center mt-2">
                  <p>⭐ {writer.writerProfile?.rating}/5</p>
                  <p>💰 Price: ₹{writer.writerProfile?.pricePerPage}/page</p>
                  <p>📄 Pages: {writer.writerProfile?.minPages} - {writer.writerProfile?.maxPages}</p>
                </div>

                <Link 
                  to={`/user/${writer.username}`}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 text-center block"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
