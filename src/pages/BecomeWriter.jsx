import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";

const BecomeWriter = () => {
  const [writerDetails, setWriterDetails] = useState({
    pricePerPage: "",
    minPages: "",
    maxPages: "",
    bio: "",
  });
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [error, setError] = useState("");
  const [isWriter, setIsWriter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAssignments, setHasAssignments] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    checkWriterStatus();
    fetchAvailableAssignments();
  }, []);

  const checkWriterStatus = async () => {
    try {
      const writersRef = collection(firestore, "writers");
      const q = query(writersRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      setIsWriter(!querySnapshot.empty);
      setIsLoading(false);
    } catch (err) {
      console.error("Error checking writer status:", err);
      setIsLoading(false);
    }
  };

  const fetchAvailableAssignments = async () => {
    try {
      const assignmentsRef = collection(firestore, "assignments");
      const q = query(assignmentsRef, where("isAssigned", "==", false));
      const querySnapshot = await getDocs(q);
      const assignments = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(assignment => assignment.userId !== currentUser.uid); // Filter out assignments created by current user
      setAvailableAssignments(assignments);
      setHasAssignments(assignments.length > 0);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWriterDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!writerDetails.bio.trim() || !writerDetails.pricePerPage || !writerDetails.minPages || !writerDetails.maxPages) {
      setError("All fields are required.");
      return;
    }

    try {
      setIsLoading(true);
      const writerRef = doc(collection(firestore, "writers"));
      await setDoc(writerRef, {
        userId: currentUser.uid,
        username: currentUser.displayName,
        pricePerPage: Number(writerDetails.pricePerPage),
        minPages: Number(writerDetails.minPages),
        maxPages: Number(writerDetails.maxPages),
        bio: writerDetails.bio,
        rating: 0,
        reviews: [],
        tasksCompleted: 0,
        isAvailable: true,
        createdAt: new Date()
      });

      setIsWriter(true);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create writer profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePickAssignment = async (assignmentId) => {
    try {
      const assignmentRef = doc(firestore, "assignments", assignmentId);
      await updateDoc(assignmentRef, {
        isAssigned: true,
        writerId: currentUser.uid,
        assignedAt: new Date()
      });
      
      fetchAvailableAssignments();
    } catch (err) {
      console.error("Error picking assignment:", err);
      setError("Failed to pick assignment. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isWriter) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold">Writer Dashboard</h2>
          </div>
          <div className="p-6">
            {hasAssignments ? (
              <div className="grid gap-4">
                {availableAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-2">Pages: {assignment.pages}</h3>
                    <p className="text-gray-600 mb-2">{assignment.description}</p>
                    <p className="text-gray-600 mb-4">Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
                    <button
                      onClick={() => handlePickAssignment(assignment.id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Pick Assignment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
                No assignments are available at the moment. Please wait until someone posts a new assignment or chooses you as their writer.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center">Become a Writer</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="number"
                name="pricePerPage"
                value={writerDetails.pricePerPage}
                onChange={handleInputChange}
                placeholder="Price per page (₹)"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="minPages"
                value={writerDetails.minPages}
                onChange={handleInputChange}
                placeholder="Min pages"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                name="maxPages"
                value={writerDetails.maxPages}
                onChange={handleInputChange}
                placeholder="Max pages"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <textarea
              name="bio"
              placeholder="Tell us about yourself (Bio)"
              value={writerDetails.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeWriter;