import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  ListChecks,
  CalendarRange,
  CalendarDays,
  StickyNote,
} from "lucide-react";
import TaskForm from "../Tasks/TaskForm";
import { useAuth } from "../../contexts/AuthContext";
import { useTasks } from "../../contexts/TasksContext";
import { useNotes } from "../../contexts/NotesContext";
import NoteForm from "./NoteForm";
import Note from "./Note";
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import styles from "../../styles/Calendar.module.scss";

function Calendar() {
  const { isAdmin } = useAuth();
  const {
    tasks,
    loadTasks,
    setTasks,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks();
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    loading: notesLoading,
    error: notesError,
  } = useNotes();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newTaskData, setNewTaskData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState("month");

  useEffect(() => {
    loadTasks();
  }, [isAdmin, loadTasks]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      notes.forEach(note => {
        if (note.reminder_date && note.reminder_time) {
          const reminderDateTime = new Date(note.reminder_date);
          const [hours, minutes] = note.reminder_time.split(':');
          reminderDateTime.setHours(parseInt(hours), parseInt(minutes));

          const timeDiff = Math.abs(now - reminderDateTime);
          if (timeDiff <= 60000) {
            iziToast.show({
              title: 'Reminder',
              message: note.title,
              position: 'topRight',
              timeout: 10000,
              close: true,
              closeOnClick: true,
              progressBar: true,
              theme: 'light',
              icon: 'icon-bell'
            });
          }
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(reminderInterval);
  }, [notes]);

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentMonth(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentMonth(newDate);
  };

  const previousDay = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentMonth(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentMonth(newDate);
  };

  const previousYear = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentMonth(newDate);
  };

  const nextYear = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentMonth(newDate);
  };

  const getTasksForDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.start_date === dateStr);
  };

  const getNotesForDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return notes.filter(note => note.date === dateStr);
  };

  const getDaysOfWeek = () => {
    const date = new Date(currentMonth);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(date);
      newDate.setDate(diff + i);
      weekDays.push(newDate);
    }
    return weekDays;
  };

  const getMonthsOfYear = () => {
    const year = currentMonth.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }
    return months;
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return styles.urgent;
      case 'high':
        return styles.high;
      case 'normal':
      default:
        return styles.normal;
    }
  };

  const handlePrevious = () => {
    switch(view) {
      case 'day':
        previousDay();
        break;
      case 'week':
        previousWeek();
        break;
      case 'month':
        previousMonth();
        break;
      case 'year':
        previousYear();
        break;
      default:
        previousMonth();
    }
  };

  const handleNext = () => {
    switch(view) {
      case 'day':
        nextDay();
        break;
      case 'week':
        nextWeek();
        break;
      case 'month':
        nextMonth();
        break;
      case 'year':
        nextYear();
        break;
      default:
        nextMonth();
    }
  };

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(day);
    setNewTaskData({ 
      start_date: formattedDate,
      // due_date: formattedDate,
      milestone: "Todo"
    });
    setShowTaskForm(true);
  };

  const handleAddNote = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(day);
    setSelectedNote(null);
    setShowNoteForm(true);
    setNewTaskData({ 
      date: formattedDate,
      reminder_date: formattedDate,
      reminder_time: '09:00'
    });
  };

  const handleNoteSubmit = async (noteData) => {
    try {
      if (selectedNote) {
        await updateNote(selectedNote.id, noteData);
        iziToast.success({
          title: 'Success',
          message: 'Note updated successfully',
          position: 'topRight'
        });
      } else {
        await addNote(noteData);
        iziToast.success({
          title: 'Success',
          message: 'Note added successfully',
          position: 'topRight'
        });
      }
      setShowNoteForm(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      iziToast.error({
        title: 'Error',
        message: 'Failed to save note',
        position: 'topRight'
      });
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      iziToast.success({
        title: 'Success',
        message: 'Note deleted successfully',
        position: 'topRight'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      iziToast.error({
        title: 'Error',
        message: 'Failed to delete note',
        position: 'topRight'
      });
    }
  };

  const handleTaskAdded = (task) => {
    setShowTaskForm(false);
    loadTasks();
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setSelectedDate(null);
    setNewTaskData(null);
  };

  const closeNoteForm = () => {
    setShowNoteForm(false);
    setSelectedNote(null);
  };

  const renderHeaderTitle = () => {
    switch(view) {
      case 'day':
        return currentMonth.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'week':
        const weekDays = getDaysOfWeek();
        const firstDay = weekDays[0].toLocaleDateString('default', { month: 'short', day: 'numeric' });
        const lastDay = weekDays[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${firstDay} - ${lastDay}`;
      case 'month':
        return getMonthName(currentMonth);
      case 'year':
        return currentMonth.getFullYear().toString();
      default:
        return getMonthName(currentMonth);
    }
  };

  const renderDayView = () => {
    const date = new Date(currentMonth);
    const day = date.getDate();
    const tasksForDay = getTasksForDate(day);
    const notesForDay = getNotesForDate(day);
    
    return (
      <div className={styles.dayView}>
        <div className={styles.dayHeader}>
          <span className={styles.dayViewDate}>
            {date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className={styles.dayContent}>
          {(tasksForDay.length > 0 || notesForDay.length > 0) ? (
            <>
              {tasksForDay.length > 0 && (
                <div className={styles.dayTasksList}>
                  <h4>Tasks</h4>
                  {tasksForDay.map(task => (
                    <div key={task.id} className={`${styles.dayTaskItem} ${getPriorityClass(task.priority)}`}>
                      <span className={styles.taskTime}>{task.start_time || '00:00'}</span>
                      <span className={styles.taskName}>{task.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {notesForDay.length > 0 && (
                <div className={styles.dayNotesList}>
                  <h4>Notes</h4>
                  {notesForDay.map(note => (
                    <Note
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noItems}>No tasks or notes scheduled for this day</div>
          )}
          <div className={styles.dayActions}>
            <button className={styles.addDayTask} onClick={() => handleDateClick(date.getDate())}>
              Add Task <Plus size={16} />
            </button>
            <button className={styles.addDayNote} onClick={() => handleAddNote(date.getDate())}>
              Add Note <StickyNote size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getDaysOfWeek();
    return (
      <div className={styles.weekView}>
        <div className={styles.weekDays}>
          {weekDays.map((date, index) => {
            const day = date.getDate();
            const month = date.getMonth();
            const year = date.getFullYear();
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasksForDay = tasks.filter(task => task.start_date === dateStr);
            const notesForDay = notes.filter(note => note.date === dateStr);
            
            return (
              <div key={index} className={styles.weekDay}>
                <div className={styles.weekDayHeader}>
                  <span className={styles.weekDayName}>{date.toLocaleDateString('default', { weekday: 'short' })}</span>
                  <span className={styles.weekDayNumber}>{day}</span>
                </div>
                <div className={styles.weekDayContent}>
                  {tasksForDay.length > 0 && (
                    <div className={styles.weekTasksList}>
                      {tasksForDay.map(task => (
                        <div key={task.id} className={`${styles.weekTaskItem} ${getPriorityClass(task.priority)}`}>
                          {task.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {notesForDay.length > 0 && (
                    <div className={styles.weekNotesList}>
                      {notesForDay.map(note => (
                        <div key={note.id} className={styles.weekNoteItem}>
                          {note.title}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.weekDayActions}>
                    <button 
                      className={styles.addWeekTask} 
                      onClick={() => { setCurrentMonth(date); handleDateClick(day); }}
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      className={styles.addWeekNote}
                      onClick={() => { setCurrentMonth(date); handleAddNote(day); }}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = getMonthsOfYear();
    return (
      <div className={styles.yearView}>
        <div className={styles.yearGrid}>
          {months.map((date, index) => {
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthName = date.toLocaleDateString('default', { month: 'short' });
            const tasksInMonth = tasks.filter(task => {
              const taskDate = new Date(task.start_date);
              return taskDate.getMonth() === month && taskDate.getFullYear() === year;
            });
            const notesInMonth = notes.filter(note => {
              const noteDate = new Date(note.date);
              return noteDate.getMonth() === month && noteDate.getFullYear() === year;
            });
            
            return (
              <div key={index} className={styles.yearMonth} onClick={() => { setCurrentMonth(date); setView('month'); }}>
                <div className={styles.yearMonthHeader}>
                  <span className={styles.yearMonthName}>{monthName}</span>
                </div>
                <div className={styles.yearMonthContent}>
                  <div className={styles.monthStats}>
                    <span className={styles.taskCount}>
                      {tasksInMonth.length} {tasksInMonth.length === 1 ? 'task' : 'tasks'}
                    </span>
                    <span className={styles.noteCount}>
                      {notesInMonth.length} {notesInMonth.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`${styles.day} ${styles.emptyDay}`}></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const tasksForDay = getTasksForDate(day);
      const notesForDay = getNotesForDate(day);
      const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

      days.push(
        <div 
          key={day} 
          className={`${styles.day} ${isToday ? styles.today : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className={styles.dayHeaders}>
          <span className={styles.dayNumber}>{day}</span>
          <div className={styles.dayActions}>
            <button 
              className={styles.addTask} 
              onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
              title="Add Task"
            >
              <Plus size={14} />
            </button>
            <button 
              className={styles.addNote}
              onClick={(e) => { e.stopPropagation(); handleAddNote(day); }}
              title="Add Note"
            >
              <StickyNote size={14} />
            </button>
          </div>
          </div>
          <div className={styles.dayContent}>
            {tasksForDay.length > 0 && (
              <div className={styles.tasksList}>
                {tasksForDay.map(task => (
                  <div key={task.id} className={`${styles.taskItem} ${getPriorityClass(task.priority)}`}>
                    {task.name}
                  </div>
                ))}
              </div>
            )}
            {notesForDay.length > 0 && (
              <div className={styles.notesList}>
                {notesForDay.map(note => (
                  <div key={note.id} className={styles.noteItem}>
                    {note.title}
                  </div>
                ))}
              </div>
            )}
          </div>
         
        </div>
      );
    }

    return days;
  };

  const renderCalendarView = () => {
    switch(view) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return (
          <div className={styles.grid}>
            <div className={styles.weekdays}>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            <div className={styles.days}>
              {renderCalendarDays()}
            </div>
          </div>
        );
      case 'year':
        return renderYearView();
      default:
        return (
          <div className={styles.grid}>
            <div className={styles.weekdays}>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            <div className={styles.days}>
              {renderCalendarDays()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <h1>Calendar</h1>
      {(tasksError || notesError) && (
        <p className={styles.error}>{tasksError || notesError}</p>
      )}
      <div className={styles.calendar}>
        <div className={styles.header}>
          <h2>{renderHeaderTitle()}</h2>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewButton} ${view === 'day' ? styles.activeView : ''}`} 
              onClick={() => setView('day')} 
              title="Daily View"
            >
              <CalendarDays size={18} />
              <span>Day</span>
            </button>
            <button 
              className={`${styles.viewButton} ${view === 'week' ? styles.activeView : ''}`} 
              onClick={() => setView('week')} 
              title="Weekly View"
            >
              <CalendarRange size={18} />
              <span>Week</span>
            </button>
            <button 
              className={`${styles.viewButton} ${view === 'month' ? styles.activeView : ''}`} 
              onClick={() => setView('month')} 
              title="Monthly View"
            >
              <CalendarIcon size={18} />
              <span>Month</span>
            </button>
            <button 
              className={`${styles.viewButton} ${view === 'year' ? styles.activeView : ''}`} 
              onClick={() => setView('year')} 
              title="Yearly View"
            >
              <ListChecks size={18} />
              <span>Year</span>
            </button>
          </div>
          <div className={styles.controls}>
            <button onClick={handlePrevious}>&lt; Previous</button>
            <button onClick={handleNext}>Next &gt;</button>
          </div>
        </div>
        {renderCalendarView()}
      </div>

      {showTaskForm && (
        <div className={styles.taskFormOverlay} onClick={closeTaskForm}>
          <div className={styles.taskFormWrapper} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskFormHeader}>
              <h3>
                {selectedDate 
                  ? `Add Task for ${selectedDate} ${currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}` 
                  : 'Add Task'}
              </h3>
              <button className={styles.closeButton} onClick={closeTaskForm}>
                <X size={20} />
              </button>
            </div>
            <TaskForm
              onClose={closeTaskForm}
              initialData={newTaskData}
              setTasks={setTasks}
              onTaskAdded={handleTaskAdded}
            />
          </div>
        </div>
      )}

      {showNoteForm && (
        <div className={styles.noteFormOverlay} onClick={closeNoteForm}>
          <div className={styles.noteFormWrapper} onClick={(e) => e.stopPropagation()}>
            <NoteForm
              note={selectedNote}
              initialData={newTaskData}
              onSave={handleNoteSubmit}
              onClose={closeNoteForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;