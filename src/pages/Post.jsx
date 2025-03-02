import { useEffect, useState } from "react";
import { firestore, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const Post = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState("");
  const [ratePerPage, setRatePerPage] = useState("");
  const [deadline, setDeadline] = useState(""); // ✅ New state for deadline
  const [error, setError] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchAssignments = async () => {
      try {
        console.log("🔥 Fetching assignments for user:", currentUser.uid);

        const q = query(
          collection(firestore, "assignments"),
          where("userId", "==", currentUser.uid),
          where("isFinished", "==", false) // Only count active assignments
        );

        const snapshot = await getDocs(q);
        const fetchedAssignments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("✅ Fetched Assignments:", fetchedAssignments);
        setAssignments(fetchedAssignments);
      } catch (error) {
        console.error("🔥 Firestore Read Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [currentUser]);

  const handlePostWork = async (e) => {
    e.preventDefault();
    setError("");

    if (assignments.length >= 5) {
      setError("⚠️ You can only have 5 active posts. Delete or finish a task to add more.");
      return;
    }

    if (!title.trim() || !description.trim() || !pages || !ratePerPage || !deadline) {
      setError("⚠️ All fields are required.");
      return;
    }

    if (Number(pages) <= 0 || Number(ratePerPage) <= 0) {
      setError("⚠️ Pages and Rate per Page must be positive numbers.");
      return;
    }

    const totalPrice = Number(pages) * Number(ratePerPage);
    const deadlineDate = new Date(deadline);

    if (deadlineDate <= new Date()) {
      setError("⚠️ Deadline must be a future date.");
      return;
    }

    try {
      await addDoc(collection(firestore, "assignments"), {
        userId: currentUser.uid,
        title,
        description,
        pages: Number(pages),
        ratePerPage: Number(ratePerPage),
        totalPrice,
        isFinished: false,
        isAssigned: false,
        status: "pending",
        deadline: deadlineDate, // ✅ Store deadline in Firestore
        createdAt: new Date(),
      });

      setAssignments((prev) => [
        ...prev,
        { title, description, pages, ratePerPage, totalPrice, deadline: deadlineDate, isFinished: false },
      ]);

      setTitle("");
      setDescription("");
      setPages("");
      setRatePerPage("");
      setDeadline("");
      console.log("✅ Work posted successfully!");
    } catch (error) {
      console.error("🔥 Firestore Write Error:", error.message);
      setError("❌ Error posting work. Please try again.");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(firestore, "assignments", postId));
      setAssignments(assignments.filter((a) => a.id !== postId));
      console.log("✅ Work deleted successfully!");
    } catch (error) {
      console.error("🔥 Firestore Delete Error:", error.message);
      setError("❌ Error deleting post.");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Post a Work</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {assignments.length < 5 ? (
        <form
          onSubmit={handlePostWork}
          className="bg-white p-6 rounded-md shadow-md"
        >
          <label className="block mb-2">
            <span className="text-gray-700">Title:</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded-md"
              required
            />
          </label>

          <label className="block mb-2">
            <span className="text-gray-700">Description:</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded-md"
              required
            />
          </label>

          <label className="block mb-2">
            <span className="text-gray-700">Number of Pages:</span>
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full border p-2 rounded-md"
              required
            />
          </label>

          <label className="block mb-2">
            <span className="text-gray-700">Rate per Page (₹):</span>
            <input
              type="number"
              value={ratePerPage}
              onChange={(e) => setRatePerPage(e.target.value)}
              className="w-full border p-2 rounded-md"
              required
            />
          </label>

          <label className="block mb-2">
            <span className="text-gray-700">Deadline:</span>
            <input
              type="datetime-local" // ✅ Allows date & time selection
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border p-2 rounded-md"
              required
            />
          </label>

          <p className="text-gray-800 font-semibold mt-2">
            Total Cost: ₹{pages && ratePerPage ? pages * ratePerPage : 0}
          </p>

          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
          >
            Post Work
          </button>
        </form>
      ) : (
        <p className="text-red-500 font-semibold">
          ⚠️ You have 5 active posts. Delete or finish a task to add more.
        </p>
      )}

      <h2 className="text-xl font-bold mt-6">Your Active Posts</h2>

      {loading ? (
        <p>Loading...</p>
      ) : assignments.length === 0 ? (
        <p>No active posts.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-gray-800 font-bold">{assignment.title}</p>
                <p className="text-gray-700">{assignment.description}</p>
                <p className="text-sm text-gray-500">Pages: {assignment.pages}</p>
                <p className="text-sm text-gray-500">Rate/Page: ₹{assignment.ratePerPage}</p>
                <p className="text-sm text-gray-500 font-bold">
                  Total Cost: ₹{assignment.totalPrice}
                </p>
                <p className="text-sm text-red-500">
    Deadline: {assignment.deadline && assignment.deadline.seconds 
        ? new Date(assignment.deadline.seconds * 1000).toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        : "No deadline set"}
</p>

              </div>
              <button
                onClick={() => handleDeletePost(assignment.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-md"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Post;
