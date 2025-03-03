/*
  # Create tasks schema and fix policies

  1. New Tables
    - `tasks` - Main tasks table with user_id foreign key
    - `task_attachments` - For storing task attachments
    - `timer_entries` - For tracking time spent on tasks

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  milestone text DEFAULT 'Todo',
  priority text DEFAULT 'Normal',
  start_date date,
  due_date date,
  assignee text,
  client text,
  project text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  size integer,
  created_at timestamptz DEFAULT now()
);

-- Create timer_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS timer_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid the duplicate error
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can create their own tasks'
  ) THEN
    DROP POLICY "Users can create their own tasks" ON tasks;
  END IF;
END $$;

-- Create policies for tasks table
CREATE POLICY "Users can create their own tasks" 
ON tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own tasks" 
ON tasks 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON tasks 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON tasks 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create policies for task_attachments table
CREATE POLICY "Users can create their own task attachments" 
ON task_attachments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can read their own task attachments" 
ON task_attachments 
FOR SELECT 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can update their own task attachments" 
ON task_attachments 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can delete their own task attachments" 
ON task_attachments 
FOR DELETE 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

-- Create policies for timer_entries table
CREATE POLICY "Users can create their own timer entries" 
ON timer_entries 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can read their own timer entries" 
ON timer_entries 
FOR SELECT 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can update their own timer entries" 
ON timer_entries 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));

CREATE POLICY "Users can delete their own timer entries" 
ON timer_entries 
FOR DELETE 
TO authenticated 
USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));