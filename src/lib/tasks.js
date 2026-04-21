// src/lib/tasks.js
import { supabase } from "./supabaseClient";

export const tasksService = {
  async createTask(taskData) {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }
      if (!userData || !userData.user) {
        throw new Error("User not authenticated");
      }
      console.log("Creating task with user ID:", userData.user.id);
      const {
        attachments,
        timerEntries,
        timeSpent,
        isTimerRunning,
        ...taskDataToSave
      } = taskData;
      const { data: task, error } = await supabase
        .from("tasks")
        .insert([
          {
            ...taskDataToSave,
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating task:", error);
        throw error;
      }
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await this.addAttachment(task.id, attachment);
        }
      }
      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  async duplicateTask(taskId) {
    const { data: src, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();
    if (error || !src) throw error || new Error("Task not found");

    const isDone =
      src.milestone && String(src.milestone).toLowerCase() === "done";

    const newTask = {
      user_id: src.user_id, // must equal auth.uid() per RLS
      name: `${src.name} (Copy)`,
      description: src.description,
      milestone: "To Do",      // keep 'Done' if that’s what you want
      priority: src.priority,
      start_date: src.start_date,
      due_date: src.due_date,
      assignee: src.assignee,
      client: src.client,
      project: src.project,
      completed: false,
      // carry over historical completion time for auto-archive
      completed_at: null,
      archived_at: null,              // never copy archived state
      // created_at/updated_at are DB defaults
    };

    const { data: inserted, error: insErr } = await supabase
      .from("tasks")
      .insert(newTask)
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
  },

  async updateTask(taskId, taskData) {
    try {
      // const { attachments, timerEntries, timeSpent, isTimerRunning, id, created_at, updated_at, user_id, _prevMilestone, ...updateData } = taskData;
      // console.log('Updating task with data:', updateData);
      // const { data: task, error } = await supabase
      //   .from('tasks')
      //   .update({
      //     ...updateData,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', taskId)
      //   .select()
      //   .single();

      const {
        attachments,
        timerEntries,
        timeSpent,
        isTimerRunning,
        id,
        created_at,
        updated_at,
        user_id,
        _prevMilestone,
        ...updateData
      } = taskData;
      console.log("Updating task with data:", updateData);

      // If marking complete, also set completed_at
      const nowTs = new Date().toISOString();
      const payload = {
        ...updateData,
        updated_at: nowTs,
        ...(updateData.completed === true ? { completed_at: nowTs } : {}),
      };

      const { data: task, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", taskId)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating task:", error);
        throw error;
      }
      if (attachments && attachments.length > 0) {
        await supabase.from("task_attachments").delete().eq("task_id", taskId);
        for (const attachment of attachments) {
          if (!attachment.id) {
            await this.addAttachment(taskId, attachment);
          }
        }
      }
      return task;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  async deleteTask(taskId) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) {
        console.error("Supabase error deleting task:", error);
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // In tasksService.js
  async getTasks(isAdmin = true) {
    try {
      if (isAdmin) {
        // Fetch all tasks for admin
        const { data, error } = await supabase
          .from("tasks")
          .select(
            `
          *,
          task_attachments (*),
          timer_entries (*)
        `
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } else {
        // Fetch only tasks for the logged-in user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData || !userData.user)
          throw new Error("User not authenticated");
        const { data, error } = await supabase
          .from("tasks")
          .select(
            `
          *,
          task_attachments (*),
          timer_entries (*)
        `
          )
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },

  async addAttachment(taskId, attachment) {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .insert([
          {
            task_id: taskId,
            name: attachment.name,
            url: attachment.url,
            type: attachment.type,
            size: attachment.size,
          },
        ])
        .select()
        .single();
      if (error) {
        console.error("Supabase error adding attachment:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error adding attachment:", error);
      throw error;
    }
  },

  async startTimer(taskId) {
    try {
      const { data, error } = await supabase
        .from("timer_entries")
        .insert([
          {
            task_id: taskId,
            start_time: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) {
        console.error("Supabase error starting timer:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error starting timer:", error);
      throw error;
    }
  },

  async stopTimer(entryId, duration) {
    try {
      const endTime = new Date().toISOString();
      const { data, error } = await supabase
        .from("timer_entries")
        .update({
          end_time: endTime,
          duration: duration,
        })
        .eq("id", entryId)
        .select()
        .single();
      if (error) {
        console.error("Supabase error stopping timer:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error stopping timer:", error);
      throw error;
    }
  },
};
