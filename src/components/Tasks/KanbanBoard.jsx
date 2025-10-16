import React from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Check, Trash2, Edit2, Building2, Briefcase, Clock, Play, Pause, StopCircle, Copy } from 'lucide-react';
import styles from '../../styles/Tasks.module.scss';

function KanbanBoard({ 
  tasks = [], 
  onDragEnd, 
  onTaskClick, 
  onToggleTask, 
  onDeleteTask, 
  onStartEditing, 
  onToggleTimer, 
  onPromptResetTimer,
  onCopyTask,
  formatTime 
}) {
  const groupedTasks = {
    "To Do": tasks.filter((task) => task.milestone === "To Do"),
    "On Going": tasks.filter((task) => task.milestone === "On Going"),
    "In Review": tasks.filter((task) => task.milestone === "In Review"),
    "Done": tasks.filter((task) => task.milestone === "Done"),
  };

  return (
    <div className={styles.kanbanBoard}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.kanbanColumns}>
          {Object.entries(groupedTasks).map(([milestone, milestoneTasks]) => (
            <div key={milestone} className={styles.kanbanColumn}>
              <h3 className={styles.columnTitle}>{milestone}</h3>
              <Droppable droppableId={milestone}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={styles.columnContent}
                  >
                    {milestoneTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${styles.task} ${task.completed ? styles.completed : ""} ${styles[task.priority.toLowerCase()]} ${snapshot.isDragging ? styles.dragging : ""}`}
                            onClick={(e) => onTaskClick(task, e)}
                          >
                            <div className={styles.taskTop}>
                              <button
                                onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                className={styles.checkButton}
                                title={task.completed ? "Mark as not done" : "Mark as done"}
                              >
                                {task.completed && <Check size={20} />}
                              </button>
                              <div className={styles.taskActions}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onCopyTask(task); }}
                                  className={styles.copyButton}
                                  title="Copy Task"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                  className={styles.deleteButton}
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                            <div className={styles.taskContent}>
                              <div className={styles.taskHeader}>
                                <div className={styles.titleSection}>
                                  <span className={styles.title}>{task.name}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onStartEditing(task); }}
                                    className={styles.editButton}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </div>
                                <div className={styles.tags}>
                                  <span className={`${styles.tag} ${styles[task.priority.toLowerCase()]}`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.projectInfo}>
                                <div className={styles.infoItem}>
                                  <Building2 size={16} />
                                  <span>{task.client}</span>
                                </div>
                                <div className={styles.infoItem}>
                                  <Briefcase size={16} />
                                  <span>{task.project}</span>
                                </div>
                              </div>
                              <div className={styles.taskFooter}>
                                <div className={styles.taskDates}>
                                  <span className={styles.dates}>
                                    Timeline: {new Date(task.start_date).toLocaleDateString("de-DE")} - {new Date(task.due_date).toLocaleDateString("de-DE")}
                                  </span>
                                </div>
                                <div className={styles.timerSection}>
                                  <div className={styles.timer}>
                                    <Clock size={16} />
                                    <span className={styles.time}>{formatTime(task.timeSpent)}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                                      className={`${styles.timerButton} ${task.isTimerRunning ? styles.running : ""}`}
                                    >
                                      {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onPromptResetTimer(task.id); }}
                                      className={styles.resetButton}
                                      title="Reset Timer"
                                    >
                                      <StopCircle size={16} />
                                    </button>
                                  </div>
                                  <div className={styles.sessionInfo}>
                                    <span>{task.timerEntries.length} sessions</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {milestoneTasks.length === 0 && (
                      <div className={styles.emptyColumn}>
                        <p>No tasks in {milestone}</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanBoard;