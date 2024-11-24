-- Create tables function
create or replace function create_profiles_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create profiles table if it doesn't exist
  create table if not exists profiles (
    id uuid references auth.users(id) primary key,
    email text unique,
    full_name text,
    avatar_url text,
    role text default 'user'::text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- Create RLS policies
  alter table profiles enable row level security;

  -- Allow read access to all authenticated users
  create policy if not exists "Allow read access to all authenticated users"
    on profiles for select
    using (auth.role() = 'authenticated');

  -- Allow users to update their own records
  create policy if not exists "Allow users to update their own records"
    on profiles for update
    using (auth.uid() = id);

  -- Create trigger to sync auth.users
  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer set search_path = public
  as $$
  begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
    return new;
  end;
  $$;

  -- Trigger after insert on auth.users
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
end;
$$;

-- Create projects table function
create or replace function create_projects_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create projects table if it doesn't exist
  create table if not exists projects (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    project_url text,
    thumbnail_url text,
    categories text[] default array[]::text[],
    status text default 'pending'::text,
    featured boolean default false,
    user_id uuid references auth.users(id),
    likes integer default 0,
    comments integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- Create RLS policies
  alter table projects enable row level security;

  -- Allow read access to all authenticated users
  create policy if not exists "Allow read access to all authenticated users"
    on projects for select
    using (auth.role() = 'authenticated');

  -- Allow insert access to authenticated users
  create policy if not exists "Allow insert access to authenticated users"
    on projects for insert
    with check (auth.role() = 'authenticated');

  -- Allow update access to project owners and admins
  create policy if not exists "Allow update access to project owners and admins"
    on projects for update
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'admin'
      )
    );

  -- Allow delete access to project owners and admins
  create policy if not exists "Allow delete access to project owners and admins"
    on projects for delete
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'admin'
      )
    );
end;
$$;

-- Create comments table function
create or replace function create_comments_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create comments table if it doesn't exist
  create table if not exists comments (
    id uuid default uuid_generate_v4() primary key,
    content text not null,
    project_id uuid references projects(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- Create RLS policies
  alter table comments enable row level security;

  -- Allow read access to all authenticated users
  create policy if not exists "Allow read access to all authenticated users"
    on comments for select
    using (auth.role() = 'authenticated');

  -- Allow insert access to authenticated users
  create policy if not exists "Allow insert access to authenticated users"
    on comments for insert
    with check (auth.role() = 'authenticated');

  -- Allow update/delete access to comment owners and admins
  create policy if not exists "Allow update access to comment owners and admins"
    on comments for update
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'admin'
      )
    );

  create policy if not exists "Allow delete access to comment owners and admins"
    on comments for delete
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'admin'
      )
    );
end;
$$;

-- Create likes table function
create or replace function create_likes_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create likes table if it doesn't exist
  create table if not exists likes (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references projects(id) on delete cascade,
    user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    unique(project_id, user_id)
  );

  -- Create RLS policies
  alter table likes enable row level security;

  -- Allow read access to all authenticated users
  create policy if not exists "Allow read access to all authenticated users"
    on likes for select
    using (auth.role() = 'authenticated');

  -- Allow insert access to authenticated users
  create policy if not exists "Allow insert access to authenticated users"
    on likes for insert
    with check (auth.role() = 'authenticated');

  -- Allow delete access to like owners
  create policy if not exists "Allow delete access to like owners"
    on likes for delete
    using (auth.uid() = user_id);

  -- Create trigger to update project likes count
  create or replace function update_project_likes()
  returns trigger
  language plpgsql
  security definer
  as $$
  begin
    if (TG_OP = 'INSERT') then
      update projects
      set likes = likes + 1
      where id = NEW.project_id;
      return NEW;
    elsif (TG_OP = 'DELETE') then
      update projects
      set likes = likes - 1
      where id = OLD.project_id;
      return OLD;
    end if;
    return null;
  end;
  $$;

  drop trigger if exists update_project_likes_trigger on likes;
  create trigger update_project_likes_trigger
    after insert or delete
    on likes
    for each row
    execute function update_project_likes();
end;
$$;

-- Execute all create table functions
select create_profiles_table();
select create_projects_table();
select create_comments_table();
select create_likes_table();
