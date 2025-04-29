// comments.js
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

        -- join profiles for first/last name
        profile:profiles!fk_task_comments_profile (
          id,
          first_name,
          last_name
        ),

        -- join auth.users for email
        auth_user:task_comments_user_id_fkey (
          id,
          email
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addComment(taskId, content) {
    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, content, user_id: user.id })
      .select(`
        id,
        content,
        created_at,
        user_id,

        profile:profiles!fk_task_comments_profile (
          id,
          first_name,
          last_name
        ),

        auth_user:task_comments_user_id_fkey (
          id,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(commentId, content) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId)
      .select(`
        id,
        content,
        created_at,
        user_id,

        profile:profiles!fk_task_comments_profile (
          id,
          first_name,
          last_name
        ),

        auth_user:task_comments_user_id_fkey (
          id,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
  },
};
