// src/components/tasks/TasksToolbar.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "../../styles/TasksToolbar.module.scss";

function TasksToolbar({ searchTerm, onSearch, statusFilter, onFilter }) {
  // Local debounce so Tasks.jsx stays simple
  const [value, setValue] = useState(searchTerm || "");

  useEffect(() => setValue(searchTerm || ""), [searchTerm]);

  useEffect(() => {
    const id = setTimeout(() => onSearch(value), 250);
    return () => clearTimeout(id);
  }, [value, onSearch]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search tasks by name, description, assignee, client, project…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.searchInput}
          aria-label="Search tasks"
        />
        {value && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => setValue("")}
            aria-label="Clear search"
            title="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onFilter(e.target.value)}
        className={styles.statusSelect}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="on_going">On Going</option>
        <option value="in_review">In Review</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}

export default TasksToolbar;
