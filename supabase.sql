-- 添加项目状态枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('pending', 'approved', 'featured', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 修改 projects 表
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- 为 projects 表添加 RLS 策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有项目
CREATE POLICY "管理员可以查看所有项目"
    ON projects FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
        OR
        auth.uid() = user_id
    );

-- 管理员可以更新所有项目
CREATE POLICY "管理员可以更新所有项目"
    ON projects FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    );

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'comment', 'like', 'status_change'
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 添加 RLS 策略
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 评论的 RLS 策略
CREATE POLICY "评论可以被所有人查看"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "已登录用户可以创建评论"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "用户可以删除自己的评论"
    ON comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 点赞的 RLS 策略
CREATE POLICY "点赞可以被所有人查看"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "已登录用户可以添加点赞"
    ON likes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "用户可以取消自己的点赞"
    ON likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 通知的 RLS 策略
CREATE POLICY "用户只能查看自己的通知"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 创建触发器函数来处理通知
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
    -- 获取项目创建者的ID
    INSERT INTO notifications (user_id, type, content, project_id)
    SELECT 
        projects.user_id,
        'comment',
        '有人评论了你的项目 ' || projects.name,
        NEW.project_id
    FROM projects
    WHERE projects.id = NEW.project_id
    AND projects.user_id != NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
    -- 获取项目创建者的ID
    INSERT INTO notifications (user_id, type, content, project_id)
    SELECT 
        projects.user_id,
        'like',
        '有人点赞了你的项目 ' || projects.name,
        NEW.project_id
    FROM projects
    WHERE projects.id = NEW.project_id
    AND projects.user_id != NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS on_new_comment ON comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment();

DROP TRIGGER IF EXISTS on_new_like ON likes;
CREATE TRIGGER on_new_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_like();

-- 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_view_count(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET view_count = view_count + 1
  WHERE id = project_id;
END;
$$;

-- 首先删除 is_admin 字段（如果存在）
ALTER TABLE auth.users DROP COLUMN IF EXISTS is_admin;

-- 确保 role 字段有正确的约束
ALTER TABLE auth.users 
    ALTER COLUMN role SET DEFAULT 'user',
    ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'user'));

-- 更新现有的管理员数据
UPDATE auth.users 
SET role = 'admin' 
WHERE is_admin = true;

-- 更新 RLS 策略
DROP POLICY IF EXISTS "允许所有人查看用户资料" ON auth.users;
DROP POLICY IF EXISTS "允许用户更新自己的资料" ON auth.users;

CREATE POLICY "允许所有人查看用户资料"
    ON auth.users FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "允许用户更新自己的资料"
    ON auth.users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

-- 创建博客文章表
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建博客文章视图（包含作者信息）
CREATE OR REPLACE VIEW blog_posts_with_authors AS
SELECT 
    p.*,
    u.email as author_email,
    u.raw_user_meta_data->>'name' as author_name,
    u.raw_user_meta_data->>'avatar' as author_avatar
FROM blog_posts p
LEFT JOIN auth.users u ON p.user_id = u.id;

-- 为博客文章表添加 RLS 策略
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有博客文章
CREATE POLICY "管理员可以查看所有博客文章"
    ON blog_posts FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    );

-- 管理员可以创建博客文章
CREATE POLICY "管理员可以创建博客文章"
    ON blog_posts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    );

-- 管理员可以更新博客文章
CREATE POLICY "管理员可以更新博客文章"
    ON blog_posts FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    );

-- 管理员可以删除博客文章
CREATE POLICY "管理员可以删除博客文章"
    ON blog_posts FOR DELETE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE role = 'admin'
        )
    );

-- 已发布的博客文章可以被所有人查看
CREATE POLICY "已发布的博客文章可以被所有人查看"
    ON blog_posts FOR SELECT
    USING (
        status = 'published'
    );
