/*
  # Fix task_comments relationship with auth.users

  1. Changes:
     - Add proper foreign key relationship between task_comments and auth.users
     - Update RLS policies to use the correct relationship

  2. Security:
     - Maintain existing RLS policies
     - Ensure proper access control
*/


-- Ensure the task_comments table exists with a proper foreign key on user_id
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);


-- Add the foreign key constraint for user_id if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_task_comments_user'
      AND conrelid = 'task_comments'::regclass
  ) THEN
    ALTER TABLE task_comments
      ADD CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id)
      REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$ LANGUAGE plpgsql;


-- Drop existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_comments_user_id_fkey'
    AND table_name = 'task_comments'
  ) THEN
    ALTER TABLE task_comments DROP CONSTRAINT task_comments_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE task_comments
  ADD CONSTRAINT task_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Update the RLS policies to use the correct relationship
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read comments on their tasks or admin can read all comments" ON task_comments;
  DROP POLICY IF EXISTS "Users can create comments on their tasks or admin can create any comment" ON task_comments;
  DROP POLICY IF EXISTS "Users can update their own comments or admin can update any comment" ON task_comments;
  DROP POLICY IF EXISTS "Users can delete their own comments or admin can delete any comment" ON task_comments;
END $$;

-- Recreate the policies with correct references
CREATE POLICY "Users can read comments on their tasks or admin can read all comments"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        tasks.user_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      )
    )
  );

CREATE POLICY "Users can create comments on their tasks or admin can create any comment"
  ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        tasks.user_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      )
    )
  );

CREATE POLICY "Users can update their own comments or admin can update any comment"
  ON task_comments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete their own comments or admin can delete any comment"
  ON task_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );