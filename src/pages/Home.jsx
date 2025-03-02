import { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const [writers, setWriters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWriter, setSelectedWriter] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [pages, setPages] = useState(1);
    const [ratePerPage, setRatePerPage] = useState(0);
    const [deadline, setDeadline] = useState("");
    const [userRequests, setUserRequests] = useState([]);
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const fetchWriters = async () => {
            const q = query(
                collection(firestore, "users"),
                where("isWriter", "==", true),
                where("writerProfile.isAvailable", "==", true)
            );
            const snapshot = await getDocs(q);

            const writersData = await Promise.all(snapshot.docs.map(async (doc) => {
                const writer = { id: doc.id, ...doc.data() };

                // ✅ Count pending requests
                const pendingRequestsQuery = query(
                    collection(firestore, "requests"),
                    where("writerId", "==", writer.id),
                    where("status", "==", "pending")
                );
                const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);

                return {
                    ...writer,
                    pendingRequests: pendingRequestsSnapshot.size
                };
            }));

            setWriters(writersData);
            setLoading(false);
        };

        const fetchUserRequests = async () => {
            const q = query(
                collection(firestore, "requests"),
                where("userId", "==", currentUser.uid),
                where("status", "==", "pending")
            );
            const snapshot = await getDocs(q);
            setUserRequests(snapshot.docs.map(doc => doc.data().writerId)); // 🔥 Store writer IDs
        };

        fetchWriters();
        fetchUserRequests();
    }, [currentUser]);

    const requestWriter = (writer) => {
        if (userRequests.includes(writer.id)) {
            alert("You have already sent a request to this writer.");
            return;
        }
        if (userRequests.length >= 5) {
            alert("You can only request up to 5 writers at a time.");
            return;
        }

        setSelectedWriter(writer);
        setIsModalOpen(true);
    };

    const submitRequest = async () => {
        if (!taskName.trim() || !description.trim() || pages <= 0 || ratePerPage <= 0 || !deadline) {
            alert("Please fill all fields correctly.");
            return;
        }

        const totalCost = pages * ratePerPage;
        const deadlineTimestamp = new Date(deadline);

        // ✅ Step 1: Create an Assignment in Available Work
        const assignmentRef = await addDoc(collection(firestore, "assignments"), {
            userId: currentUser.uid,
            title: taskName,
            description,
            pages,
            ratePerPage,
            totalPrice: totalCost,
            deadline: deadlineTimestamp,
            isFinished: false,
            isAssigned: false,
            status: "pending",
            createdAt: new Date(),
        });

        const assignmentId = assignmentRef.id;

        // ✅ Step 2: Create a Request for the Writer
        const requestRef = await addDoc(collection(firestore, "requests"), {
            writerId: selectedWriter.id,
            writerName: selectedWriter.username,
            userId: currentUser.uid,
            userName: currentUser.displayName,
            assignmentTitle: taskName,
            description,
            pages,
            ratePerPage,
            totalCost,
            deadline: deadlineTimestamp,
            status: "pending",
            timestamp: new Date(),
            assignmentId, // Link to assignment
            expiryTime: new Date(Date.now() + 48 * 60 * 60 * 1000) // 🔥 Expires in 48 hours
        });

        // ✅ Step 3: Notify the Writer
        const notificationsRef = doc(firestore, "notifications", selectedWriter.id);
        const notificationsSnapshot = await getDoc(notificationsRef);

        if (!notificationsSnapshot.exists()) {
            await setDoc(notificationsRef, { messages: [] });
        }

        await updateDoc(notificationsRef, {
            messages: arrayUnion({
                recipientId: selectedWriter.id,
                message: `📝 User ${currentUser.displayName} has requested you for a task: '${taskName}', ${pages} pages at ₹${ratePerPage}/page. Accept within 48 hours!`,
                assignmentId,
                writerId: selectedWriter.id,
                userId: currentUser.uid,
                status: "pending",
                timestamp: new Date(),
                read: false,
            }),
        });

        setIsModalOpen(false);
        alert("✅ Request Sent!");
        setUserRequests(prev => [...prev, selectedWriter.id]);
    };

    return (
        <div className="min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-4">Available Writers</h1>

            {loading ? (
                <p>Loading...</p>
            ) : writers.length === 0 ? (
                <p>No writers available. <a href="/post">Post an open assignment instead.</a></p>
            ) : (
                <ul className="space-y-2">
                    {writers.map((writer) => (
                        <li key={writer.id} className="bg-gray-100 p-4 rounded-lg flex items-center">
                            <img
                                src={writer.profilePic || writer.photoURL || "https://via.placeholder.com/150"}
                                alt="Writer Profile"
                                className="w-12 h-12 rounded-full border-2 border-gray-300 mr-3"
                            />
                            <div>
                                <p className="text-blue-600 font-semibold cursor-pointer"
                                    onClick={() => navigate(`/user/${writer.username}`)}>
                                    {writer.username}
                                </p>
                                <p className="text-gray-500">{writer.writerProfile.tasksCompleted} tasks completed</p>
                                <p className="text-sm text-gray-600">Pending Requests: {writer.pendingRequests}</p>
                            </div>
                            <button
                                onClick={() => requestWriter(writer)}
                                className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                Request
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-2">Request {selectedWriter.username}</h2>
                        <label>Task Name:</label>
                        <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full p-2 border rounded" />
                        <label>Description:</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
                        <label>Number of Pages:</label>
                        <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full p-2 border rounded" />
                        <label>Rate Per Page (₹):</label>
                        <input type="number" value={ratePerPage} onChange={(e) => setRatePerPage(Number(e.target.value))} className="w-full p-2 border rounded" />
                        <label>Deadline:</label>
                        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full p-2 border rounded" />
                        <button onClick={submitRequest} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
                            Submit Request
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
