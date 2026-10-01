import "./App.css";

function App() {
  const todoList = [
    { id: 1, title: "finish React assignment" },
    { id: 2, title: "push todo-list to GitHub" },
    { id: 3, title: "take the Week 1 quiz" },
  ];

  return (
    <div>
      <h1>Todo List</h1>
      <ul>
        {todoList.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
