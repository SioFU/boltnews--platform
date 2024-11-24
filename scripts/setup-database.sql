-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 删除现有表（如果存在）
drop table if exists public.projects cascade;
drop table if exists public.users cascade;

-- 创建用户表
create table public.users (
  id uuid references auth.users primary key,
  email text not null,
  name text,
  role text default 'user',
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 创建项目状态枚举类型
create type project_status as enum ('pending', 'approved', 'featured', 'rejected');

-- 创建存储桶
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true);

-- 创建存储桶策略
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'projects' );

create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'projects'
    and auth.role() = 'authenticated'
  );

-- 创建项目表
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text,
  project_url text,
  user_id uuid references public.users(id) not null,
  status project_status default 'pending',
  featured boolean default false,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 创建项目视图
create or replace view public.projects_with_authors as
select 
  p.*,
  u.name as author_name,
  u.email as author_email,
  u.id as author_id
from public.projects p
left join public.users u on p.user_id = u.id;

-- 创建检查管理员的函数
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.users
    where id = auth.uid()
    and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- 启用 RLS
alter table public.users enable row level security;
alter table public.projects enable row level security;

-- 用户表的 RLS 策略
create policy "允许所有用户查看用户信息"
  on public.users for select
  to authenticated
  using (true);

create policy "允许用户更新自己的信息"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

create policy "允许用户插入自己的信息"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

-- 项目表的 RLS 策略
create policy "允许用户查看已批准的项目"
  on public.projects for select
  to authenticated
  using (
    status = 'approved' 
    or user_id = auth.uid() 
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "允许用户创建项目"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "允许用户更新自己的项目"
  on public.projects for update
  to authenticated
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "允许用户删除自己的项目"
  on public.projects for delete
  to authenticated
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- 插入一个测试项目（可选）
insert into public.projects (title, description, user_id)
values ('测试项目', '这是一个测试项目', '替换为实际的用户ID');

-- 创建评论表
create table if not exists public.comments (
  id uuid not null primary key default uuid_generate_v4(),
  content text not null,
  user_id uuid not null references public.users(id),
  project_id uuid not null references public.projects(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 设置评论表的 RLS
alter table public.comments enable row level security;

-- 创建评论策略
create policy "Users can view comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all comments"
  on public.comments
  to authenticated
  using (is_admin())
  with check (is_admin());

-- 创建点赞表
create table if not exists public.likes (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  project_id uuid not null references public.projects(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, project_id)
);

-- 设置点赞表的 RLS
alter table public.likes enable row level security;

-- 创建点赞策略
create policy "Users can view likes"
  on public.likes for select
  to authenticated
  using (true);

create policy "Users can manage own likes"
  on public.likes for all
  to authenticated
  using (auth.uid() = user_id);

-- 创建通知表
create table if not exists public.notifications (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  type text not null,
  content text not null,
  read boolean default false,
  project_id uuid references public.projects(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 设置通知表的 RLS
alter table public.notifications enable row level security;

-- 创建通知策略
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);
