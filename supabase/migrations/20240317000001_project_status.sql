-- Add status and featured columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create or replace the projects_with_authors view to include new columns
CREATE OR REPLACE VIEW public.projects_with_authors AS
SELECT 
  p.*,
  u.name as author_name,
  u.avatar as author_avatar,
  u.email as author_email,
  json_build_object(
    'id', u.id,
    'name', u.name,
    'avatar', u.avatar
  ) as author
FROM public.projects p
JOIN public.users u ON p.author_id = u.id;

-- Add RLS policies for project status management
CREATE POLICY "Admins can update project status"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;