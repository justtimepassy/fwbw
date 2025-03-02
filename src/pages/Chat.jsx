import { useState, useEffect, useRef } from "react";
import { firestore, auth } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";

// 🎨 **Feedback Modal Component**
const FeedbackModal = ({ rating, setRating, comment, setComment, taskCompleted, setTaskCompleted, onClose, submitFeedback }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-md shadow-md w-96">
                <h2 className="text-xl font-bold mb-2">Provide Feedback</h2>

                <label className="block mb-2">
                    <span className="text-gray-700">Was the task completed?</span>
                    <select 
                        value={taskCompleted} 
                        onChange={(e) => setTaskCompleted(e.target.value === "true")} 
                        className="border p-2 w-full rounded-md"
                    >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </label>

                <label className="block mb-2">
                    <span className="text-gray-700">Rating (1-5):</span>
                    <select 
                        value={rating} 
                        onChange={(e) => setRating(Number(e.target.value))} 
                        className="border p-2 w-full rounded-md"
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <option key={star} value={star}>{star} ⭐</option>
                        ))}
                    </select>
                </label>

                <label className="block mb-2">
                    <span className="text-gray-700">Comment:</span>
                    <textarea 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)} 
                        className="border p-2 w-full rounded-md"
                    />
                </label>

                <div className="flex justify-end space-x-4 mt-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded-md">Cancel</button>
                    <button onClick={submitFeedback} className="px-4 py-2 bg-blue-500 text-white rounded-md">
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [typingStatus, setTypingStatus] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [currentUserEndChat, setCurrentUserEndChat] = useState(false);
    const [otherUserEndChat, setOtherUserEndChat] = useState(false);
    const [deadlineTimeLeft, setDeadlineTimeLeft] = useState("");
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [taskCompleted, setTaskCompleted] = useState(true);
    const [isUser, setIsUser] = useState(false);
    const currentUser = auth.currentUser;
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!chatId || !currentUser) return;

        const chatRef = doc(firestore, "chats", chatId);

        const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setMessages(data.messages || []);
                setChatData(data);

                setCurrentUserEndChat(data[`endChat_${currentUser.uid}`] || false);
                setOtherUserEndChat(data[`endChat_${data.writerId === currentUser.uid ? data.userId : data.writerId}`] || false);

                setTypingStatus(data.typing && data.typing !== currentUser.uid ? "typing..." : null);

                setIsUser(data.userId === currentUser.uid);

                const assignmentRef = doc(firestore, "assignments", data.assignmentId);
                const assignmentSnap = await getDoc(assignmentRef);
                if (assignmentSnap.exists()) {
                    const assignmentData = assignmentSnap.data();
                    if (assignmentData.deadline) {
                        const deadline = new Date(assignmentData.deadline.seconds * 1000);
                        startDeadlineTimer(deadline);
                    }
                }

                if (data[`endChat_${data.userId}`] && data[`endChat_${data.writerId}`] && data.userId === currentUser.uid && !feedbackSubmitted) {
                    setShowFeedbackModal(true);
                }
            }
        });

        return () => unsubscribe();
    }, [chatId, currentUser, feedbackSubmitted]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startDeadlineTimer = (deadline) => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeLeft = deadline - now;

            if (timeLeft <= 0) {
                setDeadlineTimeLeft("⏳ Deadline Passed!");
                clearInterval(interval);
                handleForceEndChat();
            } else {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                setDeadlineTimeLeft(`${hours}h ${minutes}m left`);
            }
        }, 60000);
    };

    const handleEndChat = async () => {
        if (!chatData || !currentUser) return;

        const chatRef = doc(firestore, "chats", chatId);
        await updateDoc(chatRef, { [`endChat_${currentUser.uid}`]: !currentUserEndChat });

        setCurrentUserEndChat(!currentUserEndChat);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return;

        const chatRef = doc(firestore, "chats", chatId);
        await updateDoc(chatRef, {
            messages: arrayUnion({
                senderId: currentUser.uid,
                senderName: currentUser.displayName || "Anonymous",
                text: newMessage,
                timestamp: new Date(),
                read: false,
            }),
        });

        setNewMessage("");
    };

    const submitFeedback = async () => {
        if (!rating || !comment.trim()) {
            alert("Please provide both a rating and a comment.");
            return;
        }

        try {
            const writerRef = doc(firestore, "users", chatData.writerId);
            await updateDoc(writerRef, {
                reviews: arrayUnion({ rating: Number(rating), comment, taskCompleted }),
                "writerProfile.tasksCompleted": taskCompleted ? (chatData.writerProfile?.tasksCompleted || 0) + 1 : chatData.writerProfile?.tasksCompleted || 0,
            });

            await deleteDoc(doc(firestore, "chats", chatId));
            await deleteDoc(doc(firestore, "assignments", chatData.assignmentId));

            setFeedbackSubmitted(true);
            setShowFeedbackModal(false);
            navigate("/available-work");
        } catch (error) {
            console.error("🔥 Error submitting feedback:", error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Chat</h2>
                <p className={`text-md font-semibold ${deadlineTimeLeft.includes("Passed") ? "text-red-500" : "text-gray-600"}`}>
                    {deadlineTimeLeft}
                </p>
                <button onClick={handleEndChat} className={`px-6 py-2 rounded-md ${currentUserEndChat ? "bg-gray-500 text-white" : "bg-red-500 text-white"}`}>
                    {currentUserEndChat ? "Undo End Chat" : "End Chat"}
                </button>
            </div>

            {isUser && showFeedbackModal && <FeedbackModal {...{ rating, setRating, comment, setComment, taskCompleted, setTaskCompleted, onClose: () => setShowFeedbackModal(false), submitFeedback }} />}
        </div>
    );
};

export default Chat;
