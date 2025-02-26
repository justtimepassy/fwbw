import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, logOut } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(firestore, "notifications"), where("userId", "==", user.uid), where("read", "==", false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.docs.length);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="text-2xl font-bold text-blue-600">WriteHub</Link>

                    <div className="hidden md:flex space-x-6">
                        <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
                        <Link to="/post" className="text-gray-700 hover:text-blue-600 transition">Post Work</Link>
                        <Link to="/available-work" className="text-gray-700 hover:text-blue-600 transition">Available Work</Link>
                        <Link to="/notifications" className="text-gray-700 hover:text-blue-600 transition">
                            Notifications {unreadCount > 0 && <span className="bg-red-500 text-white px-2 rounded-full">{unreadCount}</span>}
                        </Link>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="relative">
                        {user ? (
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition duration-200 font-medium"
                            >
                                <span>{user.displayName || "Profile"}</span>
                                <span className="text-xs">▼</span>
                            </button>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                                Sign In
                            </Link>
                        )}

                        {isDropdownOpen && user && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                                <button onClick={logOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
