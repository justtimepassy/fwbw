import { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { 
    collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, setDoc 
} from "firebase/firestore";

const AvailableWork = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useEffect(() => {
        const q = query(
            collection(firestore, "assignments"),
            where("isAssigned", "==", false) // Fetch only unassigned work
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            console.log("📌 Filtered Available Assignments:", fetchedAssignments);
            
            setAssignments(fetchedAssignments);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const requestToWork = async (assignment) => {
        if (!currentUser) return;
    
        const assignmentRef = doc(firestore, "assignments", assignment.id);
        const assignmentSnapshot = await getDoc(assignmentRef);
        const existingRequests = assignmentSnapshot.data()?.writerRequests || [];
    
        // Check if writer already requested
        const alreadyRequested = existingRequests.some(req => req.writerId === currentUser.uid);
        if (alreadyRequested) {
            alert("⚠️ You have already requested to work on this assignment.");
            return;
        }
    
        console.log("🔄 Before update:", existingRequests);

        // Update assignment with writer request
        await updateDoc(assignmentRef, {
            writerRequests: arrayUnion({
                writerId: currentUser.uid,
                writerName: currentUser.displayName || currentUser.email,
                timestamp: new Date()
            })
        });

        console.log("✅ Writer request added to Firestore");

        // 🔔 Ensure notification document exists before updating
        const notificationsRef = doc(firestore, "notifications", assignment.userId);
        const notificationsSnapshot = await getDoc(notificationsRef);

        if (!notificationsSnapshot.exists()) {
            await setDoc(notificationsRef, { 
                userId: assignment.userId, // 🔥 Ensure userId is included in notifications
                messages: [] 
            });
            console.log("✅ Notifications document created for user");
        }

        // Add the notification message
        await updateDoc(notificationsRef, {
            messages: arrayUnion({
                userId: assignment.userId,
                writerId: currentUser.uid,
                writerName: currentUser.displayName || currentUser.email,
                assignmentTitle: assignment.title || "Untitled Assignment",
                assignmentId: assignment.id,  // ✅ Ensure assignmentId is included
                message: `📝 Writer ${currentUser.displayName || currentUser.email} has requested to work on your task "${assignment.title || "Untitled Assignment"}".`,
                timestamp: new Date(),
                read: false
            })
        });
        

        console.log(`✅ Notification Created for ${assignment.userId}`);
        alert("✅ Your request has been sent to the assignment owner.");
    };

    return (
        <div className="min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-4">Available Assignments</h1>

            {loading ? (
                <p>Loading work...</p>
            ) : assignments.length === 0 ? (
                <p>No available work at the moment.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white p-4 shadow-md rounded-lg">
                            <h3 className="text-lg font-semibold">
                                {assignment.title && assignment.title.trim() !== "" 
                                    ? assignment.title 
                                    : "Untitled Assignment"}
                            </h3>

                            <p className="text-gray-600">
                                Requests: {assignment.writerRequests?.length || 0}
                            </p>

                            {/* Show button only if the logged-in user is not the creator */}
                            {assignment.userId !== currentUser.uid && (
                                <button
                                    onClick={() => requestToWork(assignment)}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Request to Work
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AvailableWork;
