import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      setMessage("Failed to load tasks");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("Please type a task first");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      if (!res.ok) {
        setMessage("Failed to add task");
        return;
      }

      setTitle("");
      setMessage("Task added successfully");
      loadTasks();
    } catch (error) {
      setMessage("Server error");
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
      });

      setMessage("Task deleted");
      loadTasks();
    } catch (error) {
      setMessage("Failed to delete task");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h1>MERN App Auto Deployed with CI/CD BY PRAVEENA KURUKULADITHYA</h1>
        <p className="subtitle">
          React frontend + Express backend + MongoDB database
        </p>

        <form onSubmit={addTask} className="form">
          <input
            type="text"
            placeholder="Type a task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="list">
          {tasks.length === 0 ? (
            <p className="empty">No tasks yet. Add your first task.</p>
          ) : (
            tasks.map((task) => (
              <div className="task" key={task._id}>
                <span>{task.title}</span>
                <button onClick={() => deleteTask(task._id)}>Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
