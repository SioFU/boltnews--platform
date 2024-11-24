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
