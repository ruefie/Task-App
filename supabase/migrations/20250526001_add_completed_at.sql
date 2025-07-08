-- This migration adds a 'completed_at' column to the 'tasks' table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;