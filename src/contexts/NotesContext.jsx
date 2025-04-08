import React, { createContext, useContext, useState, useEffect } from 'react';
import { notesService } from '../lib/notes';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const notesData = await notesService.getNotes();
      setNotes(notesData);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const addNote = async (noteData) => {
    try {
      const newNote = await notesService.createNote(noteData);
      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (err) {
      console.error('Error adding note:', err);
      throw err;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const updatedNote = await notesService.updateNote(id, noteData);
      setNotes(prev => prev.map(note => 
        note.id === id ? updatedNote : note
      ));
      return updatedNote;
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  const deleteNote = async (id) => {
    try {
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  };

  const value = {
    notes,
    loading,
    error,
    loadNotes,
    addNote,
    updateNote,
    deleteNote
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}