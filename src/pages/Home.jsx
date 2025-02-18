import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';

const dummyWriters = [
  { name: "John Doe", rating: 4.8, pricePerPage: 10, minPages: 2, maxPages: 10 },
  { name: "Jane Smith", rating: 4.5, pricePerPage: 12, minPages: 1, maxPages: 5 },
  { name: "Alex Brown", rating: 4.7, pricePerPage: 8, minPages: 3, maxPages: 15 },
];

const Home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome to WriteHub
          </h1>
          {!user && (
            <p className="mt-4 text-gray-600">
              Sign in to connect with professional writers and start your project
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyWriters.map((writer, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {writer.name}
              </h2>
              
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center">
                  <span className="mr-2">⭐</span>
                  <span>{writer.rating}/5</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">💰</span>
                  <span>${writer.pricePerPage}/page</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">📄</span>
                  <span>{writer.minPages}-{writer.maxPages} pages</span>
                </p>
              </div>
              
              <button 
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                onClick={() => !user && signInWithGoogle()}
              >
                {user ? 'View Profile' : 'Sign in to Connect'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;