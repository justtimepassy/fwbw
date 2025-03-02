import { useState } from "react";

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(true); // Default to "Yes"

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>

        {/* ⭐ Rating Selection */}
        <label className="block mb-2">Rating (1-5 Stars):</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full border p-2 rounded-md mb-3"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <option key={star} value={star}>{star} ⭐</option>
          ))}
        </select>

        {/* 📝 Comment Input */}
        <label className="block mb-2">Comment:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-2 rounded-md mb-4"
          placeholder="Write your review..."
        ></textarea>

        {/* ✅ Task Completion Status */}
        <label className="block mb-2">Was the Task Completed?</label>
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${taskCompleted ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => setTaskCompleted(true)}
          >
            Yes
          </button>
          <button
            className={`px-4 py-2 rounded-md ${!taskCompleted ? "bg-red-500 text-white" : "bg-gray-300"}`}
            onClick={() => setTaskCompleted(false)}
          >
            No
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(rating, comment, taskCompleted)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
