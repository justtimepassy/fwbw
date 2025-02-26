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
    const [userRequest, setUserRequest] = useState(null);
    const [description, setDescription] = useState("");
    const [pages, setPages] = useState(1);
    const [ratePerPage, setRatePerPage] = useState(0);
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
                const requestsSnapshot = await getDocs(query(
                    collection(firestore, "requests"),
                    where("writerId", "==", writer.id),
                    where("status", "==", "pending")
                ));

                return {
                    ...writer,
                    pendingRequests: requestsSnapshot.size
                };
            }));

            setWriters(writersData);
        };

        const checkExistingRequest = async () => {
            const q = query(
                collection(firestore, "requests"),
                where("userId", "==", currentUser.uid),
                where("status", "in", ["pending", "accepted"])
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setUserRequest(snapshot.docs[0].data());
            }
        };

        fetchWriters();
        checkExistingRequest();
        setLoading(false);
    }, [currentUser]);

    const requestWriter = (writer) => {
        if (userRequest) {
            alert("You already have an active request. Please wait for it to be completed or rejected.");
            return;
        }
        setSelectedWriter(writer);
        setIsModalOpen(true);
    };

    const submitRequest = async () => {
        if (!description.trim() || pages <= 0 || ratePerPage <= 0) {
            alert("Please fill all fields correctly.");
            return;
        }

        const totalCost = pages * ratePerPage;

        await addDoc(collection(firestore, "requests"), {
            writerId: selectedWriter.id,
            userId: currentUser.uid,
            description,
            pages,
            ratePerPage,
            totalCost,
            status: "pending",
            timestamp: new Date()
        });

        const notificationsRef = doc(firestore, "notifications", selectedWriter.id);
        const notificationsSnapshot = await getDoc(notificationsRef);

        if (!notificationsSnapshot.exists()) {
            await setDoc(notificationsRef, { messages: [] });
        }

        await updateDoc(notificationsRef, {
            messages: arrayUnion({
                recipientId: selectedWriter.id,
                message: `User ${currentUser.displayName} has requested you for a task: '${description}', ${pages} pages at ₹${ratePerPage}/page. Will you accept?`,
                timestamp: new Date(),
                read: false
            })
        });

        setIsModalOpen(false);
        setUserRequest(true);
        alert("Request Sent!");
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
                                <p
                                    className="text-blue-600 font-semibold cursor-pointer"
                                    onClick={() => navigate(`/user/${writer.username}`)}
                                >
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

            {/* Request Writer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-2">Request {selectedWriter.username}</h2>
                        <label className="block mt-2">Description:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                        <label className="block mt-2">Number of Pages:</label>
                        <input
                            type="number"
                            value={pages}
                            onChange={(e) => setPages(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                        <label className="block mt-2">Rate Per Page (₹):</label>
                        <input
                            type="number"
                            value={ratePerPage}
                            onChange={(e) => setRatePerPage(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                        <p className="mt-2">Total Cost: ₹{pages * ratePerPage}</p>
                        <div className="flex justify-between mt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRequest}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
