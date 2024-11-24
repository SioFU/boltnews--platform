-- Create UUID extension if not exists
create extension if not exists "uuid-ossp";

-- Initialize schema function
create or replace function public.initialize_schema()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create users table if not exists
  create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    name text,
    avatar text,
    email text unique,
    role text default 'user',
    bio text,
    website text,
    social jsonb default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Create projects table if not exists
  create table if not exists public.projects (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    project_url text not null,
    thumbnail_url text,
    categories text[] default '{}',
    author_id uuid not null,
    status text default 'pending',
    featured boolean default false,
    likes integer default 0,
    comments integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint fk_author foreign key (author_id) references public.users(id) on delete cascade
  );

  -- Create blog_posts table if not exists
  create table if not exists public.blog_posts (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text not null,
    excerpt text,
    slug text unique not null,
    author_id uuid not null,
    status text default 'draft',
    published_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tags text[] default '{}',
    cover_image text,
    constraint fk_author foreign key (author_id) references public.users(id) on delete cascade
  );

  -- Create comments table if not exists
  create table if not exists public.comments (
    id uuid default uuid_generate_v4() primary key,
    content text not null,
    user_id uuid not null,
    project_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint fk_user foreign key (user_id) references public.users(id) on delete cascade,
    constraint fk_project foreign key (project_id) references public.projects(id) on delete cascade
  );

  -- Enable RLS on all tables
  alter table public.users enable row level security;
  alter table public.projects enable row level security;
  alter table public.blog_posts enable row level security;
  alter table public.comments enable row level security;

  -- Create views for joined data
  create or replace view public.projects_with_authors as
    select 
      p.*,
      u.name as author_name,
      u.avatar as author_avatar,
      u.email as author_email,
      p.status as status
    from public.projects p
    join public.users u on p.author_id = u.id;

  create or replace view public.blog_posts_with_authors as
    select 
      b.*,
      u.name as author_name,
      u.avatar as author_avatar,
      u.email as author_email
    from public.blog_posts b
    join public.users u on b.author_id = u.id;

  -- Set up RLS policies
  -- Users policies
  create policy if not exists "Users can view other users"
    on public.users for select
    to authenticated, anon
    using (true);

  create policy if not exists "Users can update own profile"
    on public.users for update
    to authenticated
    using (auth.uid() = id);

  -- Projects policies
  create policy if not exists "Anyone can view approved projects"
    on public.projects for select
    to authenticated, anon
    using (status = 'approved' or auth.uid() = author_id);

  create policy if not exists "Authenticated users can create projects"
    on public.projects for insert
    to authenticated
    with check (auth.uid() = author_id);

  create policy if not exists "Users can update own projects"
    on public.projects for update
    to authenticated
    using (auth.uid() = author_id or exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    ));

  -- Blog posts policies
  create policy if not exists "Anyone can view published posts"
    on public.blog_posts for select
    to authenticated, anon
    using (status = 'published' or auth.uid() = author_id);

  create policy if not exists "Authenticated users can create posts"
    on public.blog_posts for insert
    to authenticated
    with check (auth.uid() = author_id);

  create policy if not exists "Users can update own posts"
    on public.blog_posts for update
    to authenticated
    using (auth.uid() = author_id or exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    ));

  -- Comments policies
  create policy if not exists "Anyone can view comments"
    on public.comments for select
    to authenticated, anon
    using (true);

  create policy if not exists "Authenticated users can create comments"
    on public.comments for insert
    to authenticated
    with check (auth.uid() = user_id);

  create policy if not exists "Users can update own comments"
    on public.comments for update
    to authenticated
    using (auth.uid() = user_id);
end;
$$;