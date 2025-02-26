import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase"; // Firebase Authentication
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Navbar from "./components/Navbar";
import Post from "./pages/Post"; // Work Posting Page
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import AvailableWork from "./pages/AvailableWork"; // Writers see & claim assignments
import Notifications from "./pages/Notifications"; // Notifications Page
import Chat from "./pages/Chat"; // 🔥 New Chat Page

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Home />} />  
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        <Route path="/post" element={user ? <Post /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/available-work" element={user ? <AvailableWork /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/chat/:chatId" element={user ? <Chat /> : <Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;
