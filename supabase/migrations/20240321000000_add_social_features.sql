-- 添加项目状态枚举类型
CREATE TYPE project_status AS ENUM ('pending', 'approved', 'featured', 'rejected');

-- 修改 projects 表
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TRIGGER on_new_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment();

CREATE TRIGGER on_new_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_like();
