import { useCallback, useEffect, useState } from "react";
import TodoForm from "./TodoForm";
import TodoList from "./TodoList/TodoList";
import SortBy from "../../shared/SortBy";
import FilterInput from "../../shared/FilterInput";
import useDebounce from "../../utils/useDebounce";

function TodosPage({ token }) {
  const [todoList, setTodoList] = useState([]);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [isTodoListLoading, setIsTodoListLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterTerm, setFilterTerm] = useState("");
  const debouncedFilterTerm = useDebounce(filterTerm, 300);
  const [dataVersion, setDataVersion] = useState(0);

  const invalidateCache = useCallback(() => {
    setDataVersion((previous) => previous + 1);
  }, []);

  const handleFilterChange = (newTerm) => {
    setFilterTerm(newTerm);
  };

  useEffect(() => {
    if (!token) return;

    async function fetchTodos() {
      setIsTodoListLoading(true);
      try {
        const paramsObject = {
          sortBy,
          sortDirection,
          limit: 100,
        };
        if (debouncedFilterTerm) {
          paramsObject.find = debouncedFilterTerm;
        }
        const params = new URLSearchParams(paramsObject);
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
        setFilterError("");
      } catch (error) {
        if (
          debouncedFilterTerm ||
          sortBy !== "createdAt" ||
          sortDirection !== "desc"
        ) {
          setFilterError(`Error filtering/sorting todos: ${error.message}`);
        } else {
          setError(`Error fetching todos: ${error.message}`);
        }
      } finally {
        setIsTodoListLoading(false);
      }
    }

    fetchTodos();
  }, [token, sortBy, sortDirection, debouncedFilterTerm]);

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
      invalidateCache();
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
      invalidateCache();
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
      invalidateCache();
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
      {filterError && (
        <div>
          <p>{filterError}</p>
          <button type="button" onClick={() => setFilterError("")}>
            Clear Filter Error
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterTerm("");
              setSortBy("createdAt");
              setSortDirection("desc");
              setFilterError("");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
      {isTodoListLoading && <p>Todo list loading...</p>}
      <SortBy
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortByChange={setSortBy}
        onSortDirectionChange={setSortDirection}
      />
      <FilterInput
        filterTerm={filterTerm}
        onFilterChange={handleFilterChange}
      />
      <TodoForm onAddTodo={addTodo} />
      <TodoList
        todoList={todoList}
        onCompleteTodo={completeTodo}
        onUpdateTodo={updateTodo}
        dataVersion={dataVersion}
      />
    </div>
  );
}

export default TodosPage;