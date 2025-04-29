-- Add the user_id column if it doesn't exist
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'employees_user_id_fkey'
      AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees
    ADD CONSTRAINT employees_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;



DROP FUNCTION IF EXISTS handle_new_employee CASCADE;

-- Function to create auth user and profile for a new employee.
CREATE OR REPLACE FUNCTION handle_new_employee()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- If NEW.user_id is already provided, use it. Otherwise, generate a new UUID.
  IF NEW.user_id IS NULL THEN
    new_user_id := gen_random_uuid();
  ELSE
    new_user_id := NEW.user_id;
  END IF;
  
  -- Insert into auth.users if it doesn't already exist.
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_current,
    recovery_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    NEW.email,
    NOW(),
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name
    ),
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'base64'),
    encode(gen_random_bytes(32), 'base64'),
    encode(gen_random_bytes(32), 'base64')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into profiles using an upsert so that duplicate keys are not an error.
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    NEW.first_name,
    NEW.last_name,
    false,  -- Employees default to non-admin
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Update the employee record with the new or existing user_id.
  NEW.user_id := new_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists.
DROP TRIGGER IF EXISTS create_auth_user_for_employee ON employees;

-- Create the trigger that runs BEFORE INSERT on the employees table.
CREATE TRIGGER create_auth_user_for_employee
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_employee();
