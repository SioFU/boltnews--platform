-- 删除 is_admin 字段（如果存在）
ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;

-- 确保 role 字段有正确的约束
ALTER TABLE public.users 
    ALTER COLUMN role SET DEFAULT 'user',
    ADD CONSTRAINT IF NOT EXISTS valid_role CHECK (role IN ('admin', 'user'));

-- 更新 RLS 策略
DROP POLICY IF EXISTS "允许所有人查看用户资料" ON public.users;
DROP POLICY IF EXISTS "允许用户更新自己的资料" ON public.users;
DROP POLICY IF EXISTS "只有管理员可以管理用户" ON public.users;
DROP POLICY IF EXISTS "只有管理员可以更新项目状态" ON public.projects;
DROP POLICY IF EXISTS "只有管理员可以删除项目" ON public.projects;

-- 重新创建策略
CREATE POLICY "允许所有人查看用户资料"
    ON public.users FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "允许用户更新自己的资料"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "只有管理员可以管理用户"
    ON public.users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "只有管理员可以更新项目状态"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "只有管理员可以删除项目"
    ON public.projects FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 更新 is_admin 函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
