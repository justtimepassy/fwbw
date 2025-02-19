import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const Writers = () => {
  const [writers, setWriters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [requestDetails, setRequestDetails] = useState({
    pages: "",
    deadline: "",
    description: "",
  });

  useEffect(() => {
    const fetchWriters = async () => {
      const writersRef = collection(firestore, "users");
      const q = query(writersRef, where("writerProfile.isAvailable", "==", true));
      const querySnapshot = await getDocs(q);
      const fetchedWriters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWriters(fetchedWriters);
    };

    fetchWriters();
  }, []);

  // Open the modal with selected writer details
  const openModal = (writer) => {
    setSelectedWriter(writer);
    setShowModal(true);
  };

  // Handle closing the modal
  const closeModal = () => {
    setShowModal(false);
    setRequestDetails({ pages: "", deadline: "", description: "" });
  };

  // Handle input changes in the request form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestDetails((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">Available Writers</h2>

        {writers.length === 0 ? (
          <p className="text-center text-gray-600">No available writers at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writers.map((writer) => (
              <div 
                key={writer.id} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <img
                  src={writer.profilePic || "https://via.placeholder.com/150"}
                  alt="Writer"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-gray-300 object-cover mb-3"
                />

                <Link to={`/user/${writer.username}`}>
                  <h3 className="text-xl font-semibold text-gray-800 text-center hover:underline">
                    {writer.username}
                  </h3>
                </Link>

                <div className="space-y-2 text-gray-600 text-center mt-2">
                  <p>⭐ {writer.writerProfile?.rating}/5</p>
                  <p>💰 Price: ₹{writer.writerProfile?.pricePerPage}/page</p>
                  <p>📄 Pages: {writer.writerProfile?.minPages} - {writer.writerProfile?.maxPages}</p>
                </div>

                <button 
                  className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                  onClick={() => openModal(writer)}
                >
                  Request Work
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showModal && selectedWriter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Request Work from {selectedWriter.username}</h3>

            <input type="number" name="pages" value={requestDetails.pages} onChange={handleInputChange} className="w-full p-2 border rounded mb-2" placeholder="Number of Pages" />
            <input type="date" name="deadline" value={requestDetails.deadline} onChange={handleInputChange} className="w-full p-2 border rounded mb-2" />
            <textarea name="description" value={requestDetails.description} onChange={handleInputChange} className="w-full p-2 border rounded mb-2" placeholder="Describe your request"></textarea>

            <button className="bg-gray-400 text-white px-4 py-2 rounded mr-2" onClick={closeModal}>Cancel</button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Submit Request</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writers;
