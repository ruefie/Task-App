import { supabase } from './supabaseClient';

export const notesService = {
  async getNotes() {
    const { data, error } = await supabase
      .from('calendar_notes')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createNote(noteData) {
    const { data, error } = await supabase
      .from('calendar_notes')
      .insert({
        ...noteData,
        user_id: (await supabase.auth.getUser()).data.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(id, noteData) {
    const { data, error } = await supabase
      .from('calendar_notes')
      .update(noteData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(id) {
    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};