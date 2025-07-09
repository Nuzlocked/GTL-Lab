-- Drop existing objects if they exist (in reverse dependency order)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS handle_updated_at();
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on username for faster lookups (case-insensitive)
CREATE INDEX profiles_username_idx ON profiles (LOWER(username));

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view all profiles (for username uniqueness checking)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Extract username from user metadata, ensuring it's not null or empty
  username_value := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->'user_metadata'->>'username'), ''), NULL);

  -- If no username provided, use email prefix but ensure uniqueness
  IF username_value IS NULL THEN
    username_value := SPLIT_PART(NEW.email, '@', 1);
    
    -- If this username already exists, append a short hash of the user ID to make it unique
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = username_value) THEN
      username_value := username_value || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
    END IF;
  END IF;
  
  -- Insert the new profile
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    username_value,
    NEW.email
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If we still somehow get a unique violation, append a more unique suffix
    INSERT INTO public.profiles (id, username, email)
    VALUES (
      NEW.id,
      username_value || '_' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6),
      NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user(); 