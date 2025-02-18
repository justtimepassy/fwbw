import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");

  const fetchTasks = async () => {
    const querySnapshot = await getDocs(collection(db, "tasks"));
    const tasksList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTasks(tasksList);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tasks"), {
        title: taskTitle,
        createdAt: new Date(),
      });
      setTaskTitle("");
      fetchTasks();
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;