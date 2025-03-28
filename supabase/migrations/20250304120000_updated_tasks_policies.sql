/*
  # Create tasks schema and fix policies

  1. New Tables
    - `tasks` - Main tasks table with user_id foreign key
    - `task_attachments` - For storing task attachments
    - `timer_entries` - For tracking time spent on tasks

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data,
      with admins allowed full CRUD access.
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

---------------------------------------------------------
-- Policies for tasks table
---------------------------------------------------------
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
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tasks' 
      AND policyname = 'Users can read their own tasks or admin can read all tasks'
  ) THEN
    DROP POLICY "Users can read their own tasks or admin can read all tasks" ON tasks;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tasks' 
      AND policyname = 'Users can update their own tasks or admin can update any task'
  ) THEN
    DROP POLICY "Users can update their own tasks or admin can update any task" ON tasks;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tasks' 
      AND policyname = 'Users can delete their own tasks or admin can delete any task'
  ) THEN
    DROP POLICY "Users can delete their own tasks or admin can delete any task" ON tasks;
  END IF;
END $$;

CREATE POLICY "Users can create their own tasks" 
  ON tasks 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own tasks or admin can read all tasks" 
  ON tasks 
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can update their own tasks or admin can update any task" 
  ON tasks 
  FOR UPDATE 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete their own tasks or admin can delete any task" 
  ON tasks 
  FOR DELETE 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

---------------------------------------------------------
-- Policies for task_attachments table (owners or admins)
---------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_attachments' 
      AND policyname = 'Task attachments: create for owners or admins'
  ) THEN
    DROP POLICY "Task attachments: create for owners or admins" ON task_attachments;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_attachments' 
      AND policyname = 'Task attachments: read for owners or admins'
  ) THEN
    DROP POLICY "Task attachments: read for owners or admins" ON task_attachments;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_attachments' 
      AND policyname = 'Task attachments: update for owners or admins'
  ) THEN
    DROP POLICY "Task attachments: update for owners or admins" ON task_attachments;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_attachments' 
      AND policyname = 'Task attachments: delete for owners or admins'
  ) THEN
    DROP POLICY "Task attachments: delete for owners or admins" ON task_attachments;
  END IF;
END $$;

CREATE POLICY "Task attachments: create for owners or admins"
  ON task_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Task attachments: read for owners or admins"
  ON task_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Task attachments: update for owners or admins"
  ON task_attachments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Task attachments: delete for owners or admins"
  ON task_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

---------------------------------------------------------
-- Policies for timer_entries table (owners or admins)
---------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timer_entries' 
      AND policyname = 'Timer entries: create for owners or admins'
  ) THEN
    DROP POLICY "Timer entries: create for owners or admins" ON timer_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timer_entries' 
      AND policyname = 'Timer entries: read for owners or admins'
  ) THEN
    DROP POLICY "Timer entries: read for owners or admins" ON timer_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timer_entries' 
      AND policyname = 'Timer entries: update for owners or admins'
  ) THEN
    DROP POLICY "Timer entries: update for owners or admins" ON timer_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'timer_entries' 
      AND policyname = 'Timer entries: delete for owners or admins'
  ) THEN
    DROP POLICY "Timer entries: delete for owners or admins" ON timer_entries;
  END IF;
END $$;

CREATE POLICY "Timer entries: create for owners or admins"
  ON timer_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Timer entries: read for owners or admins"
  ON timer_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Timer entries: update for owners or admins"
  ON timer_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );

CREATE POLICY "Timer entries: delete for owners or admins"
  ON timer_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id)
  );
