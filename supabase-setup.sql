-- Drop existing objects if they exist (in reverse dependency order)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS handle_updated_at();
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop friendly system tables if they exist
DROP TABLE IF EXISTS friendly_matches CASCADE;
DROP TABLE IF EXISTS friendly_challenges CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_challenges();
DROP FUNCTION IF EXISTS cleanup_expired_presence();

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  buy_key TEXT DEFAULT 'Space' NOT NULL,
  cancel_key TEXT DEFAULT 'Shift' NOT NULL
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

-- Create user presence table for online/offline tracking
CREATE TABLE user_presence (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  current_page TEXT DEFAULT 'home',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create friendly challenges table
CREATE TABLE friendly_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenged_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenger_username TEXT NOT NULL,
  challenged_username TEXT NOT NULL,
  game_settings JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '30 seconds') NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create friendly matches table
CREATE TABLE friendly_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES friendly_challenges(id) ON DELETE CASCADE NOT NULL,
  player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player1_username TEXT NOT NULL,
  player2_username TEXT NOT NULL,
  game_settings JSONB NOT NULL,
  rng_seed TEXT NOT NULL, -- For synchronized gameplay
  match_status TEXT CHECK (match_status IN ('starting', 'in_progress', 'completed', 'abandoned')) DEFAULT 'starting',
  player1_stats JSONB, -- Game results for player 1
  player2_stats JSONB, -- Game results for player 2
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX user_presence_user_id_idx ON user_presence (user_id);
CREATE INDEX user_presence_is_online_idx ON user_presence (is_online);
CREATE INDEX friendly_challenges_challenger_id_idx ON friendly_challenges (challenger_id);
CREATE INDEX friendly_challenges_challenged_id_idx ON friendly_challenges (challenged_id);
CREATE INDEX friendly_challenges_status_idx ON friendly_challenges (status);
CREATE INDEX friendly_challenges_expires_at_idx ON friendly_challenges (expires_at);
CREATE INDEX friendly_matches_player1_id_idx ON friendly_matches (player1_id);
CREATE INDEX friendly_matches_player2_id_idx ON friendly_matches (player2_id);
CREATE INDEX friendly_matches_match_status_idx ON friendly_matches (match_status);

-- Set up Row Level Security (RLS) for user presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can view all user presence (for online status checking)
CREATE POLICY "User presence is viewable by everyone" ON user_presence
  FOR SELECT USING (true);

-- Users can only insert/update their own presence
CREATE POLICY "Users can insert their own presence" ON user_presence
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- Set up Row Level Security (RLS) for friendly challenges
ALTER TABLE friendly_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view challenges where they are involved
CREATE POLICY "Users can view their own challenges" ON friendly_challenges
  FOR SELECT USING (
    (select auth.uid()) = challenger_id OR 
    (select auth.uid()) = challenged_id
  );

-- Users can insert challenges they are sending
CREATE POLICY "Users can insert their own challenges" ON friendly_challenges
  FOR INSERT WITH CHECK ((select auth.uid()) = challenger_id);

-- Users can update challenges where they are involved
CREATE POLICY "Users can update their own challenges" ON friendly_challenges
  FOR UPDATE USING (
    (select auth.uid()) = challenger_id OR 
    (select auth.uid()) = challenged_id
  );

-- Set up Row Level Security (RLS) for friendly matches
ALTER TABLE friendly_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches where they are involved
CREATE POLICY "Users can view their own matches" ON friendly_matches
  FOR SELECT USING (
    (select auth.uid()) = player1_id OR 
    (select auth.uid()) = player2_id
  );

-- Users can insert matches (system will handle this)
CREATE POLICY "Users can insert matches" ON friendly_matches
  FOR INSERT WITH CHECK (
    (select auth.uid()) = player1_id OR 
    (select auth.uid()) = player2_id
  );

-- Users can update matches where they are involved
CREATE POLICY "Users can update their own matches" ON friendly_matches
  FOR UPDATE USING (
    (select auth.uid()) = player1_id OR 
    (select auth.uid()) = player2_id
  );

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger to automatically update updated_at on user_presence
CREATE TRIGGER user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger to automatically update updated_at on friendly_challenges
CREATE TRIGGER friendly_challenges_updated_at
  BEFORE UPDATE ON friendly_challenges
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger to automatically update updated_at on friendly_matches
CREATE TRIGGER friendly_matches_updated_at
  BEFORE UPDATE ON friendly_matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to cleanup expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  UPDATE friendly_challenges 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired user presence (mark as offline after 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET is_online = false 
  WHERE is_online = true 
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

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
  
  -- Initialize user presence
  INSERT INTO public.user_presence (user_id, is_online, last_seen)
  VALUES (
    NEW.id,
    false,
    NOW()
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
    
    -- Initialize user presence
    INSERT INTO public.user_presence (user_id, is_online, last_seen)
    VALUES (
      NEW.id,
      false,
      NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user(); 