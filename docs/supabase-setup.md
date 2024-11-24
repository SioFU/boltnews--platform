# Supabase 配置指南

## 认证设置

1. 登录 Supabase 控制台：https://app.supabase.com
2. 选择你的项目
3. 在左侧导航栏中，点击 "Authentication"
4. 点击 "Providers" 标签
5. 在 "Email" 部分：
   - 确保 "Enable Email Signup" 已启用
   - 在 "Authorized Email Domains" 中添加你要使用的邮箱域名（例如 gmail.com）
   
## 数据库设置

确保你的数据库中有以下表：

### users 表
```sql
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'user',
  is_admin boolean default false,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 设置 RLS 策略
alter table public.users enable row level security;

-- 允许已登录用户读取用户信息
create policy "Users can view other users profiles"
  on public.users for select
  to authenticated
  using (true);

-- 允许用户更新自己的信息
create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

-- 插入策略
create policy "Enable insert for authenticated users only"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);
```

## 权限设置

在 SQL Editor 中运行以下命令来设置必要的权限：

```sql
-- 创建管理员角色
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
    and is_admin = true
  );
$$ language sql security definer;

-- 为管理员创建额外的权限
create policy "Admins can do anything"
  on public.users
  to authenticated
  using (is_admin())
  with check (is_admin());
```

## 环境变量

确保你的项目中有正确的环境变量：

```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的匿名密钥
```

## 创建第一个管理员账号

1. 在 Supabase 控制台中，转到 "Authentication" > "Users"
2. 点击 "Invite User"
3. 输入管理员邮箱地址
4. 用户注册后，在 SQL Editor 中运行以下命令：

```sql
update public.users
set is_admin = true, role = 'admin'
where email = '管理员邮箱地址';
```
