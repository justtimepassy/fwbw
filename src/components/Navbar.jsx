import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-white text-2xl font-bold hover:text-blue-100 transition-colors">
            WriteHub
          </Link>

          <div className="flex items-center space-x-8">
            <Link to="/writers" className="text-white hover:text-blue-100 transition-colors">
              Available Writers
            </Link>
            {user && (
              <Link to="/post" className="text-white hover:text-blue-100 transition-colors">
                Post
              </Link>
            )}
          </div>

          <div className="relative">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="bg-white text-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  <span>{user.displayName || 'Account'}</span>
                  <span className="text-xs">▼</span>
                </button>
                
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={logOut}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;