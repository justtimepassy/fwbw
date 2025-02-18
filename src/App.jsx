import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar"; // Import Navbar
import Post from "./pages/Post"; // Add Post page (later)
import Profile from "./pages/Profile"; // Add Profile page (later)
import Writers from "./pages/Writers"; // Add Writers page (later)

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/post" element={<Post />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/writers" element={<Writers />} />
      </Routes>
    </Router>
  );
}

export default App;
