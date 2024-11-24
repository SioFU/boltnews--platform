-- 确保通知表存在
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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 通知的 RLS 策略
CREATE POLICY "用户可以查看自己的通知"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "管理员可以创建通知"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "用户可以更新自己的通知状态"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
