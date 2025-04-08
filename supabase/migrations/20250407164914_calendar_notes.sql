/*
  # Add notes table for calendar events

  1. New Tables
    - `calendar_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `content` (text)
      - `date` (date)
      - `reminder_date` (date)
      - `reminder_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on calendar_notes table
    - Add policies for CRUD operations
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS calendar_notes CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Recreate the table
CREATE TABLE calendar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  date date NOT NULL,
  reminder_date date,
  reminder_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reminder_fields_check CHECK (
    (reminder_date IS NULL AND reminder_time IS NULL) OR 
    (reminder_date IS NOT NULL AND reminder_time IS NOT NULL)
  )
);

ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can read their own notes"
  ON calendar_notes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notes"
  ON calendar_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notes"
  ON calendar_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON calendar_notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_calendar_notes_updated_at
  BEFORE UPDATE ON calendar_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
