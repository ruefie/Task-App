// src/lib/comments.js
import { supabase } from "./supabaseClient";

export const commentsService = {
  async getComments(taskId) {
    const { data, error } = await supabase
      .from("task_comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles!user_id (
          first_name,
          last_name
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async addComment(taskId, content) {
    const session = await supabase.auth.getSession();
    const user = session?.data?.session?.user;

    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        content,
        user_id: user.id,
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles!user_id (
          first_name,
          last_name
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(commentId, content) {
    const { data, error } = await supabase
      .from("task_comments")
      .update({ content })
      .eq("id", commentId)
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles!user_id (
          first_name,
          last_name
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;
  },
};
