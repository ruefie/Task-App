// src/components/tasks/TasksToolbar.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "../../styles/TasksToolbar.module.scss";

function TasksToolbar({
  searchTerm,
  onSearch,
  statusFilter,
  onFilter,
  priorityFilter,
  onPriorityFilter,
  dueFilter,
  onDueFilter,
  sortBy,
  onSortBy,
  onClearFilters,
  onExportCsv,
}) {
  const [value, setValue] = useState(searchTerm || "");
  useEffect(() => setValue(searchTerm || ""), [searchTerm]);
  useEffect(() => {
    const id = setTimeout(() => onSearch(value), 250);
    return () => clearTimeout(id);
  }, [value, onSearch]);

  return (
    <div className={styles.toolbar}>
      {/* Search */}
      
      <div className={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search tasks…"
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
      <div className={styles.controlsRow}>
      {/* Status */}
      <select
        value={statusFilter}
        onChange={(e) => onFilter(e.target.value)}
        className={styles.select}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="on_going">On Going</option>
        <option value="in_review">In Review</option>
        <option value="done">Done</option>
      </select>

      {/* Priority */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityFilter(e.target.value)}
        className={styles.select}
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        <option value="Normal">Normal</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortBy(e.target.value)}
        className={styles.select}
        aria-label="Sort tasks"
      >
        <option value="">Sort: None</option>
        <option value="due_asc">Due date ↑</option>
        <option value="due_desc">Due date ↓</option>
        <option value="priority_high">Priority (Normal→Urgent)</option>
        <option value="name_asc">Name A–Z</option>
        <option value="name_desc">Name Z–A</option>
      </select>
      <button className={styles.clearActionBtn} onClick={onClearFilters}>Clear</button>
      </div>
      {/* Quick due chips */}
      <div className={styles.chips}>
        {["", "overdue", "today", "week"].map((k) => (
          <button
            key={k || "all"}
            className={`${styles.chip} ${dueFilter === k ? styles.chipActive : ""}`}
            onClick={() => onDueFilter(dueFilter === k ? "" : k)}
            aria-pressed={dueFilter === k}
          >
            {k === "" ? "All" : k === "overdue" ? "Overdue" : k === "today" ? "Today" : "This week"}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        
       
      </div>
    </div>
  );
}

export default TasksToolbar;
