-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT,
    avatar TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    bio TEXT,
    website TEXT,
    social JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    thumbnail_url TEXT,
    categories TEXT[],
    author_id UUID REFERENCES public.users(id) NOT NULL,
    status TEXT DEFAULT 'draft',
    featured BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles" 
    ON public.users FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);

-- Projects table policies
CREATE POLICY "Anyone can view published projects" 
    ON public.projects FOR SELECT 
    TO authenticated, anon 
    USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create projects" 
    ON public.projects FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own projects" 
    ON public.projects FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own projects" 
    ON public.projects FOR DELETE 
    TO authenticated 
    USING (auth.uid() = author_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar)
    VALUES (
        NEW.id,
        NEW.email,
        split_part(NEW.email, '@', 1),
        'https://ui-avatars.com/api/?name=' || NEW.email || '&background=0D8ABC&color=fff'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
