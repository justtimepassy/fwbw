import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { auth, logOut } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // 🔹 Reference for handling clicks outside

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;

        // ✅ Listen for unread notifications (inside user's notifications doc)
        const notificationsRef = doc(firestore, "notifications", user.uid);
        const unsubscribeNotifications = onSnapshot(notificationsRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const messages = docSnapshot.data().messages || [];
                const unreadCount = messages.filter((msg) => !msg.read).length;
                setUnreadNotifications(unreadCount);
            }
        });

        // ✅ Listen for unread chat messages
        const chatsRef = collection(firestore, "chats");
        const unsubscribeChats = onSnapshot(chatsRef, (snapshot) => {
            let unreadCount = 0;
            snapshot.docs.forEach((docSnap) => {
                const chatData = docSnap.data();
                if (!chatData) return;

                if (chatData.userId === user.uid || chatData.writerId === user.uid) {
                    const messages = chatData.messages || [];
                    unreadCount += messages.filter((msg) => !msg.read && msg.senderId !== user.uid).length;
                }
            });
            setUnreadMessages(unreadCount);
        });

        return () => {
            unsubscribeNotifications();
            unsubscribeChats();
        };
    }, [user]);

    // 🔹 Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                            Notifications {unreadNotifications > 0 && (
                                <span className="bg-red-500 text-white px-2 rounded-full">{unreadNotifications}</span>
                            )}
                        </Link>

                        <Link to="/chat" className="text-gray-700 hover:text-blue-600 transition">
                            Chat {unreadMessages > 0 && (
                                <span className="bg-red-500 text-white px-2 rounded-full">{unreadMessages}</span>
                            )}
                        </Link>
                    </div>

                    {/* 🔹 Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        {user ? (
                            <>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition duration-200 font-medium"
                                >
                                    <span>{user.displayName || "Profile"}</span>
                                    <span className="text-xs">▼</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            Profile
                                        </Link>
                                        <button 
                                            onClick={logOut} 
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
