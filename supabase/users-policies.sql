-- First, drop all existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Allow select for everyone" ON users;
DROP POLICY IF EXISTS "Allow update for user" ON users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON users;
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Self update access" ON users;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all authenticated operations
CREATE POLICY "Enable all access for authenticated users"
ON users
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN (SELECT current_setting('role')) = 'authenticated' THEN 
      CASE 
        -- For SELECT operations, allow access to all rows
        WHEN current_setting('statement_type') = 'SELECT' THEN true
        -- For other operations (UPDATE, DELETE), only allow on own rows
        ELSE auth.uid() = id
      END
    ELSE false
  END
);
