import { useState } from "react";
import "./App.css";
import TodoForm from "./TodoForm.jsx";
import TodoList from "./TodoList.jsx";

const todos = [
  { id: 1, title: "finish React assignment" },
  { id: 2, title: "push todo-list to GitHub" },
  { id: 3, title: "take the Week 3 quiz" },
];

function App() {
  const [todoList, setTodoList] = useState(todos);

  return (
    <div>
      <h1>Todo List</h1>
      <TodoForm />
      <TodoList todoList={todoList} />
    </div>
  );
}

export default App;
