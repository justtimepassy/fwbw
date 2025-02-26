import { useState, useEffect } from "react";
import { firestore, auth } from "../firebase"; // ✅ Make sure 'auth' is imported
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

const Chat = () => {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const currentUser = auth.currentUser; // ✅ Ensure current user is fetched

    useEffect(() => {
        if (!chatId) return;

        console.log("📢 Listening for chat updates on:", chatId);

        const chatRef = doc(firestore, "chats", chatId);

        const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                console.log("📩 Fetched Messages:", data.messages);
                setMessages(data.messages || []);
            } else {
                console.log("❌ No chat found.");
                setMessages([]);
            }
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return;

        try {
            const chatRef = doc(firestore, "chats", chatId);

            await updateDoc(chatRef, {
                messages: arrayUnion({
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || "Anonymous",
                    text: newMessage,
                    timestamp: new Date(),
                }),
            });

            console.log("✅ Message sent!");
            setNewMessage(""); // Clear input after sending
        } catch (error) {
            console.error("🔥 Error sending message:", error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-4">Chat</h2>

            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded-lg">
                {messages.length === 0 ? (
                    <p className="text-gray-600">No messages yet.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`p-2 my-1 rounded-md ${msg.senderId === currentUser.uid ? "bg-blue-200 self-end" : "bg-gray-200"}`}>
                            <p className="text-sm font-semibold">{msg.senderName}</p>
                            <p>{msg.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border p-2 rounded-l-md"
                    placeholder="Type a message..."
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
