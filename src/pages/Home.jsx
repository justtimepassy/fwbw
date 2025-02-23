import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firestore, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

const Home = () => {
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [rating, setRating] = useState(0);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchActiveAssignments();
    }
  }, [currentUser]);

  const fetchActiveAssignments = async () => {
    try {
      const assignmentsRef = collection(firestore, "assignments");
      const userAssignmentsQuery = query(
        assignmentsRef,
        where("userId", "==", currentUser.uid),
        where("isAssigned", "==", true),
        where("isFinished", "==", false)
      );
      const writerAssignmentsQuery = query(
        assignmentsRef,
        where("writerId", "==", currentUser.uid),
        where("isAssigned", "==", true),
        where("isFinished", "==", false)
      );

      const [userSnapshots, writerSnapshots] = await Promise.all([
        getDocs(userAssignmentsQuery),
        getDocs(writerAssignmentsQuery)
      ]);

      const assignments = [
        ...userSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'requested'
        })),
        ...writerSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'assigned'
        }))
      ];

      setActiveAssignments(assignments);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const handleMarkAsFinished = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    try {
      // Update assignment status
      const assignmentRef = doc(firestore, "assignments", selectedAssignment.id);
      await updateDoc(assignmentRef, {
        isFinished: true,
        rating: rating,
        completedAt: new Date()
      });

      // Update writer's stats in the user's collection
      const userRef = doc(firestore, "users", selectedAssignment.writerId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData && userData.writerProfile) {
        const writerProfile = userData.writerProfile;

        // Calculate new rating
        const newRating = ((writerProfile.rating * writerProfile.tasksCompleted) + rating) / (writerProfile.tasksCompleted + 1);

        // Update writerProfile and reviews
        await updateDoc(userRef, {
          "writerProfile.rating": newRating,
          "writerProfile.tasksCompleted": writerProfile.tasksCompleted + 1,
          reviews: [...(userData.reviews || []), {
            rating: rating,
            assignmentId: selectedAssignment.id,
            reviewedAt: new Date()
          }]
        });
      }

      setShowRatingModal(false);
      fetchActiveAssignments(); // Refresh the assignments list
    } catch (err) {
      console.error("Error updating assignment or writer profile:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Welcome to WriteHub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Connect with professional writers or start your writing journey
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <Link to="/writers" className="group">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">Find a Writer</h2>
              <p className="text-gray-400">Connect with talented writers ready to bring your ideas to life</p>
              <div className="mt-4 text-cyan-400 group-hover:translate-x-2 transition-transform duration-300">
                →
              </div>
            </div>
          </Link>

          <Link to="/become-writer" className="group">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Become a Writer</h2>
              <p className="text-gray-400">Share your expertise and start your writing career today</p>
              <div className="mt-4 text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Active Assignments Section */}
        {currentUser && activeAssignments.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold mb-8 text-center">Active Assignments</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden"
                >
                  {/* Glowing effect for new assignments */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 blur"></div>
                  
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        assignment.type === 'requested' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {assignment.type === 'requested' ? 'Requested' : 'Assigned'}
                      </span>
                      <span className="text-gray-400">
                        Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-3">Pages: {assignment.pages}</p>
                    <p className="text-gray-400 mb-4">{assignment.description}</p>

                    {assignment.type === 'requested' && (
                      <button
                        onClick={() => handleMarkAsFinished(assignment)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                      >
                        Mark as Finished
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Rate the Writer</h3>
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;