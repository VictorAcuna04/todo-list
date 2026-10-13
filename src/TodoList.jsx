function TodoList() {
  const todoList = [
    { id: 1, title: "finish React assignment" },
    { id: 2, title: "push todo-list to GitHub" },
    { id: 3, title: "take the Week 2 quiz" },
  ];

  return (
    <ul>
      {todoList.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

export default TodoList;
