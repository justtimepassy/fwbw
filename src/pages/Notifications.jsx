import { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { 
    collection, doc, getDoc, updateDoc, setDoc, arrayUnion, onSnapshot
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        console.log("🔍 Listening for notifications for:", currentUser.uid);

        const notificationsRef = doc(firestore, "notifications", currentUser.uid);

        const unsubscribe = onSnapshot(notificationsRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                console.log("🔔 Fetched Notifications:", data.messages);
                setNotifications(data.messages || []);
            } else {
                console.log("❌ No notifications found.");
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // ✅ Accept Request: Assign Writer & Open Chat
    const acceptRequest = async (request, index) => {
        if (!currentUser) return;

        try {
            console.log("🔍 Accepting request:", request);

            const { assignmentId, writerId, writerName, userId } = request;

            if (!assignmentId || !writerId || !userId) {
                console.error("🚨 Missing required fields in request object:", request);
                return;
            }

            console.log("📌 Using Assignment ID:", assignmentId);

            const chatId = `${assignmentId}-${writerId}`;
            const chatRef = doc(firestore, "chats", chatId);

            // ✅ Create a chat document
            await setDoc(chatRef, {
                assignmentId,
                userId,
                writerId,
                messages: [],
                createdAt: new Date(),
            });

            console.log(`✅ Chat created with ID: ${chatId}`);

            // ✅ Update assignment as assigned
            const assignmentRef = doc(firestore, "assignments", assignmentId);
            await updateDoc(assignmentRef, {
                isAssigned: true,
                writerId: writerId,
                status: "in progress",
            });

            console.log(`✅ Assignment updated as "in progress"`);

            // ✅ Send notification to writer
            const writerNotificationsRef = doc(firestore, "notifications", writerId);
            const writerNotificationsSnapshot = await getDoc(writerNotificationsRef);

            if (!writerNotificationsSnapshot.exists()) {
                await setDoc(writerNotificationsRef, { messages: [] });
                console.log("✅ Notifications document created for writer.");
            }

            await updateDoc(writerNotificationsRef, {
                messages: arrayUnion({
                    message: `✅ Your request to work on "${request.assignmentTitle}" has been accepted. Chat is now open!`,
                    chatId: chatId,
                    timestamp: new Date(),
                    read: false,
                }),
            });

            console.log(`✅ Notification sent to writer: ${writerId}`);

            // ✅ Mark notification as read
            markAsRead(index);

            // Redirect to chat page
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("🔥 Error accepting request:", error.message);
        }
    };

    // ❌ Reject Request: Remove the notification
    const rejectRequest = async (index) => {
        markAsRead(index);
    };

    // ✅ Mark notification as read (removes it)
    const markAsRead = async (index) => {
        if (!currentUser) return;

        const notificationsRef = doc(firestore, "notifications", currentUser.uid);
        const updatedMessages = notifications.filter((_, i) => i !== index);

        await updateDoc(notificationsRef, { messages: updatedMessages });

        console.log("✅ Notification removed");
    };

    return (
        <div className="min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>

            {loading ? (
                <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <p>No new notifications.</p>
            ) : (
                <ul className="space-y-2">
                    {notifications.map((n, index) => (
                        <li key={index} className={`bg-gray-100 p-4 rounded-lg ${n.read ? "opacity-50" : ""}`}>
                            <p className="text-gray-700">{n.message}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(n.timestamp.seconds * 1000).toLocaleString()}
                            </p>

                            {/* Accept & Reject Buttons */}
                            {!n.read && (
                                <div className="mt-2 flex space-x-4">
                                    <button
                                        onClick={() => acceptRequest(n, index)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md"
                                    >
                                        Accept & Open Chat
                                    </button>

                                    <button
                                        onClick={() => rejectRequest(index)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-md"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;
