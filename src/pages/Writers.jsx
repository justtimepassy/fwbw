import React, { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { Star, DollarSign, FileText, CheckCircle, X, Plus } from "lucide-react";

const Writers = () => {
  const [writers, setWriters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [requestDetails, setRequestDetails] = useState({
    pages: "",
    deadline: "",
    description: "",
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false); // State for assignment modal
  const [assignmentDetails, setAssignmentDetails] = useState({
    pages: "",
    deadline: "",
    description: "",
  });
  const [error, setError] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const writersRef = collection(firestore, "writers");
        const q = query(writersRef, where("isAvailable", "==", true));
        const querySnapshot = await getDocs(q);
        const fetchedWriters = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(writer => writer.userId !== currentUser.uid); // Filter out the current user if they are a writer

        setWriters(fetchedWriters);
      } catch (err) {
        console.error("Error fetching writers:", err);
      }
    };

    fetchWriters();
  }, [currentUser]);

  const handleSubmitRequest = async () => {
    if (!requestDetails.pages || !requestDetails.deadline || !requestDetails.description) {
      setError("All fields are required");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      await addDoc(collection(firestore, "assignments"), {
        userId: currentUser.uid,
        writerId: selectedWriter.id, // Assign the selected writer's ID
        pages: Number(requestDetails.pages),
        deadline: requestDetails.deadline,
        description: requestDetails.description,
        isAssigned: false, // Set to false initially
        isFinished: false, // Set to false initially
        status: "pending", // Optional: Add a status field
        createdAt: new Date(),
        totalPrice: Number(requestDetails.pages) * selectedWriter.pricePerPage
      });
      setShowModal(false);
      setRequestDetails({ pages: "", deadline: "", description: "" }); // Reset form
    } catch (err) {
      setError("Failed to submit request. Please try again.");
    }
  };

  const handleAddAssignment = async () => {
    if (!assignmentDetails.pages || !assignmentDetails.deadline || !assignmentDetails.description) {
      setError("All fields are required");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      await addDoc(collection(firestore, "assignments"), {
        userId: currentUser.uid,
        pages: Number(assignmentDetails.pages),
        deadline: assignmentDetails.deadline,
        description: assignmentDetails.description,
        isAssigned: false,
        isFinished: false,
        writerId: "", // No specific writer assigned
        createdAt: new Date()
      });
      setShowAssignmentModal(false);
      setAssignmentDetails({ pages: "", deadline: "", description: "" });
    } catch (err) {
      setError("Failed to add assignment. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0118] bg-[radial-gradient(circle_at_50%_-20%,#4F3B78,#0A0118)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-center text-white">Available Writers</h2>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus size={18} />
            Add Assignment for Everyone
          </button>
        </div>

        {writers.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 text-center">
            <p className="text-gray-400 text-lg">No available writers at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writers.map((writer) => (
              <div 
                key={writer.id}
                className="bg-gray-800/20 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/30 transition-all duration-300 border border-purple-700/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{writer.username}</h3>
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                    Available
                  </span>
                </div>

                <div className="space-y-3 text-gray-300">
                  <p className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={18} />
                    {writer.rating}/5 Rating
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="text-green-400" size={18} />
                    ₹{writer.pricePerPage}/page
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="text-purple-400" size={18} />
                    {writer.minPages} - {writer.maxPages} pages
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="text-cyan-400" size={18} />
                    {writer.tasksCompleted} tasks completed
                  </p>
                  <p className="text-sm text-gray-400 mt-4">{writer.bio}</p>
                </div>

                <button 
                  onClick={() => {
                    setSelectedWriter(writer);
                    setShowModal(true);
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Request Work
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Work Modal */}
      {showModal && selectedWriter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-purple-700/30 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-6 text-white">
              Request Work from {selectedWriter.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  name="pages"
                  value={requestDetails.pages}
                  onChange={(e) => setRequestDetails({...requestDetails, pages: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-400 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="Number of Pages"
                  min={selectedWriter.minPages}
                  max={selectedWriter.maxPages}
                />
              </div>

              <div>
                <input
                  type="date"
                  name="deadline"
                  value={requestDetails.deadline}
                  onChange={(e) => setRequestDetails({...requestDetails, deadline: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <textarea
                  name="description"
                  value={requestDetails.description}
                  onChange={(e) => setRequestDetails({...requestDetails, description: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-400 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="Describe your request in detail..."
                  rows="4"
                />
              </div>

              {requestDetails.pages && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-700/30">
                  <p className="text-gray-300">
                    Total Price: <span className="text-purple-400 font-bold">₹{(requestDetails.pages * selectedWriter.pricePerPage).toFixed(2)}</span>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-purple-700/30 relative">
            <button
              onClick={() => setShowAssignmentModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-6 text-white">
              Add Assignment for Everyone
            </h3>
            
            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  name="pages"
                  value={assignmentDetails.pages}
                  onChange={(e) => setAssignmentDetails({...assignmentDetails, pages: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-400 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="Number of Pages"
                />
              </div>

              <div>
                <input
                  type="date"
                  name="deadline"
                  value={assignmentDetails.deadline}
                  onChange={(e) => setAssignmentDetails({...assignmentDetails, deadline: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <textarea
                  name="description"
                  value={assignmentDetails.description}
                  onChange={(e) => setAssignmentDetails({...assignmentDetails, description: e.target.value})}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-400 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="Describe your assignment in detail..."
                  rows="4"
                />
              </div>

              {error && (
                <p className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAssignment}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writers;