/*
  # Fix authentication issues

  1. Updates
    - Ensure profiles table exists and has correct structure
    - Add missing RLS policies for profiles
    - Fix user creation trigger
*/

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid the duplicate error
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    DROP POLICY "Users can read their own profile" ON profiles;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    DROP POLICY "Users can update their own profile" ON profiles;
  END IF;
END $$;

-- Create policies for profiles table
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create a function to create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, is_admin)
  VALUES (new.id, '', '', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function after signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create a function to set admin status for existing users
CREATE OR REPLACE FUNCTION set_admin_for_existing_users()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through existing users and set admin status for specific emails
  FOR user_record IN SELECT * FROM auth.users LOOP
    -- Check if the user already has a profile
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_record.id) THEN
      -- Create profile if it doesn't exist
      INSERT INTO profiles (id, first_name, last_name, is_admin)
      VALUES (user_record.id, '', '', false);
    END IF;
    
    -- Set admin status based on email (for development purposes)
    IF user_record.email = 'admin@example.com' THEN
      UPDATE profiles SET is_admin = true WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to set admin status
SELECT set_admin_for_existing_users();

-- Drop the function after use
DROP FUNCTION set_admin_for_existing_users();