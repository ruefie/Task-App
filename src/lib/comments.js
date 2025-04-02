import { supabase } from './supabase';

export const commentsService = {
  async getComments(taskId) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profile:user_id(
          id,
          first_name,
          last_name
        )
      `)      
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addComment(taskId, content) {
    const session = await supabase.auth.getSession();
    const user = session?.data?.session?.user;

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content,
        user_id: user.id
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        profile:user_id(
          id,
          first_name,
          last_name
        )
      `)      
      .single();

    if (error) throw error;
    return data;
  }
};