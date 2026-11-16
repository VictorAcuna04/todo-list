import { useEffect, useState } from "react";
import TodoForm from "./TodoForm";
import TodoList from "./TodoList/TodoList";

function TodosPage({ token }) {
  const [todoList, setTodoList] = useState([]);
  const [error, setError] = useState("");
  const [isTodoListLoading, setIsTodoListLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function fetchTodos() {
      setIsTodoListLoading(true);
      try {
        const params = new URLSearchParams({ limit: 100 });
        const response = await fetch(`/api/tasks?${params}`, {
          headers: { "X-CSRF-TOKEN": token },
          credentials: "include",
        });
        if (response.status === 401) {
          throw new Error("unauthorized");
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch todos: ${response.status}`);
        }
        const data = await response.json();
        setTodoList(data.tasks);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsTodoListLoading(false);
      }
    }

    fetchTodos();
  }, [token]);

  async function addTodo(todoTitle) {
    const newTodo = { id: Date.now(), title: todoTitle, isCompleted: false };
    setTodoList((previousTodoList) => [newTodo, ...previousTodoList]);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token,
        },
        credentials: "include",
        body: JSON.stringify({ title: todoTitle, isCompleted: false }),
      });
      if (!response.ok) {
        throw new Error(`Failed to add todo: ${response.status}`);
      }
      const savedTodo = await response.json();
      setTodoList((previousTodoList) =>
        previousTodoList.map((todo) =>
          todo.id === newTodo.id ? savedTodo : todo,
        ),
      );
    } catch (error) {
      setError(error.message);
      setTodoList((previousTodoList) =>
        previousTodoList.filter((todo) => todo.id !== newTodo.id),
      );
    }
  }

  async function completeTodo(id) {
    const originalTodo = todoList.find((todo) => todo.id === id);
    const isCompleted = !originalTodo.isCompleted;
    setTodoList((previousTodoList) =>
      previousTodoList.map((todo) =>
        todo.id === id ? { ...todo, isCompleted } : todo,
      ),
    );

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token,
        },
        credentials: "include",
        body: JSON.stringify({ isCompleted }),
      });
      if (!response.ok) {
        throw new Error(`Failed to complete todo: ${response.status}`);
      }
    } catch (error) {
      setError(error.message);
      setTodoList((previousTodoList) =>
        previousTodoList.map((todo) => (todo.id === id ? originalTodo : todo)),
      );
    }
  }

  async function updateTodo(editedTodo) {
    const originalTodo = todoList.find((todo) => todo.id === editedTodo.id);
    setTodoList((previousTodoList) =>
      previousTodoList.map((todo) =>
        todo.id === editedTodo.id ? { ...editedTodo } : todo,
      ),
    );

    try {
      const response = await fetch(`/api/tasks/${editedTodo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token,
        },
        credentials: "include",
        body: JSON.stringify({
          title: editedTodo.title,
          isCompleted: editedTodo.isCompleted,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update todo: ${response.status}`);
      }
    } catch (error) {
      setError(error.message);
      setTodoList((previousTodoList) =>
        previousTodoList.map((todo) =>
          todo.id === editedTodo.id ? originalTodo : todo,
        ),
      );
    }
  }

  return (
    <div>
      {error && (
        <div>
          <p>{error}</p>
          <button type="button" onClick={() => setError("")}>
            Clear Error
          </button>
        </div>
      )}
      {isTodoListLoading && <p>Todo list loading...</p>}
      <TodoForm onAddTodo={addTodo} />
      <TodoList
        todoList={todoList}
        onCompleteTodo={completeTodo}
        onUpdateTodo={updateTodo}
      />
    </div>
  );
}

export default TodosPage;
