-- 检查并修复用户表
DO $$
BEGIN
    -- 检查users表是否存在
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- 创建users表
        CREATE TABLE public.users (
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

        -- 启用RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- 创建访问策略
        CREATE POLICY "允许所有人查看用户资料" 
            ON public.users FOR SELECT 
            TO authenticated, anon 
            USING (true);

        CREATE POLICY "允许用户更新自己的资料" 
            ON public.users FOR UPDATE 
            TO authenticated 
            USING (auth.uid() = id);

        CREATE POLICY "允许用户插入自己的资料" 
            ON public.users FOR INSERT 
            TO authenticated 
            WITH CHECK (auth.uid() = id);
    END IF;

    -- 同步现有的auth.users到public.users
    INSERT INTO public.users (id, email, name, avatar)
    SELECT 
        id,
        email,
        COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
        COALESCE(
            raw_user_meta_data->>'avatar',
            'https://ui-avatars.com/api/?name=' || split_part(email, '@', 1) || '&background=0D8ABC&color=fff'
        ) as avatar
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;

END $$;
