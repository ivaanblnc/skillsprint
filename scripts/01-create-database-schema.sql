-- SkillSprint Database Schema for Supabase
-- This script creates all necessary tables with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'admin')),
  bio TEXT,
  github_username TEXT,
  skills TEXT[],
  points INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL,
  time_limit INTEGER NOT NULL, -- in minutes
  points INTEGER NOT NULL,
  starter_code TEXT,
  solution TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
  score INTEGER DEFAULT 0,
  execution_time INTEGER, -- in milliseconds
  memory_used INTEGER, -- in KB
  test_results JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for challenges
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Organizers can create challenges" ON public.challenges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
);
CREATE POLICY "Creators can update own challenges" ON public.challenges FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for test_cases
CREATE POLICY "Anyone can view non-hidden test cases" ON public.test_cases FOR SELECT USING (is_hidden = false);
CREATE POLICY "Challenge creators can view all test cases" ON public.test_cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND created_by = auth.uid())
);
CREATE POLICY "Challenge creators can manage test cases" ON public.test_cases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND created_by = auth.uid())
);

-- RLS Policies for submissions
CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view all submissions for leaderboard" ON public.submissions FOR SELECT USING (status = 'passed');
CREATE POLICY "Users can create own submissions" ON public.submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own submissions" ON public.submissions FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback on their submissions" ON public.feedback FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON public.challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_submissions_user_challenge ON public.submissions(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON public.submissions(score DESC);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'participant')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user points after successful submission
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update points if submission status changed to 'passed'
  IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
    UPDATE public.profiles 
    SET 
      points = points + (SELECT points FROM public.challenges WHERE id = NEW.challenge_id),
      challenges_completed = challenges_completed + 1,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating user points
DROP TRIGGER IF EXISTS on_submission_passed ON public.submissions;
CREATE TRIGGER on_submission_passed
  AFTER UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points();
