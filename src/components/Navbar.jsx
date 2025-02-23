import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Menu } from 'lucide-react';

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
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">WriteHub</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm md:text-base font-medium"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  <span className="hidden md:block">
                    {user.displayName || 'Account'}
                  </span>
                  <span className="md:hidden">
                    {user.displayName?.split(' ')[0] || 'Account'}
                  </span>
                  <span className="text-xs">▼</span>
                </button>

                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={logOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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