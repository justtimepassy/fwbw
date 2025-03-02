import { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState({});
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const fetchChats = async () => {
            try {
                const q = query(collection(firestore, "chats"), where("userId", "==", currentUser.uid));
                const writerQuery = query(collection(firestore, "chats"), where("writerId", "==", currentUser.uid));

                const [userChatsSnap, writerChatsSnap] = await Promise.all([getDocs(q), getDocs(writerQuery)]);

                const userChats = userChatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const writerChats = writerChatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                let allChats = [...userChats, ...writerChats];

                // Fetch assignment details and chat partner names
                const chatDetails = await Promise.all(allChats.map(async (chat) => {
                    const assignmentRef = doc(firestore, "assignments", chat.assignmentId);
                    const assignmentSnap = await getDoc(assignmentRef);
                    let assignmentTitle = "Unknown Assignment";
                    let ownerId = "";
                    let writerId = "";

                    if (assignmentSnap.exists()) {
                        const assignmentData = assignmentSnap.data();
                        assignmentTitle = assignmentData.title;
                        ownerId = assignmentData.userId;
                        writerId = assignmentData.writerId;
                    }

                    const chatPartnerId = currentUser.uid === ownerId ? writerId : ownerId;
                    const userRef = doc(firestore, "users", chatPartnerId);
                    const userSnap = await getDoc(userRef);
                    const chatPartnerName = userSnap.exists() ? userSnap.data().username : "Unknown User";

                    return {
                        ...chat,
                        assignmentTitle,
                        chatPartnerName
                    };
                }));

                setChats(chatDetails);
            } catch (error) {
                console.error("🔥 Error fetching chats:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [currentUser]);

    // ✅ Real-time listener for unread messages
    useEffect(() => {
        if (!currentUser) return;

        const chatsRef = collection(firestore, "chats");
        const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
            let unreadCountMap = {};

            snapshot.docs.forEach(docSnap => {
                const chatData = docSnap.data();
                if (!chatData) return;

                // If user is part of this chat, count unread messages
                if (chatData.userId === currentUser.uid || chatData.writerId === currentUser.uid) {
                    const unreadCount = chatData.messages.filter(
                        msg => !msg.read && msg.senderId !== currentUser.uid
                    ).length;
                    
                    if (unreadCount > 0) {
                        unreadCountMap[docSnap.id] = unreadCount;
                    }
                }
            });

            setUnreadMessages(unreadCountMap);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <div className="min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-4">Your Chats</h1>

            {loading ? (
                <p>Loading chats...</p>
            ) : chats.length === 0 ? (
                <p>No active chats available.</p>
            ) : (
                <ul className="space-y-4">
                    {chats.map((chat) => (
                        <li key={chat.id} className={`bg-gray-100 p-4 rounded-lg flex justify-between items-center 
                            ${unreadMessages[chat.id] ? "border-l-4 border-red-500" : ""}`}>
                            
                            <div>
                                <p className="font-semibold">Assignment: {chat.assignmentTitle}</p>
                                <p className="text-sm text-gray-500">Chat with: {chat.chatPartnerName}</p>
                            </div>

                            <div className="flex items-center">
                                {unreadMessages[chat.id] > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                                        {unreadMessages[chat.id]} New
                                    </span>
                                )}
                                <Link 
                                    to={`/chat/${chat.id}`}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Open Chat
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ChatList;
