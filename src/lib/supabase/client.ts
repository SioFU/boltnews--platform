import { createClient } from '@supabase/supabase-js';
import { handleError, mapError } from '../../utils/errorHandler';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 创建 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseKey);

// 基础的调试和错误处理
if (import.meta.env.DEV) {
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = (table: string) => {
    console.log(`[Supabase] Accessing table: ${table}`);
    return originalFrom(table);
  };
}

// 初始化 Supabase
export const initializeSupabase = async () => {
  try {
    const { error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase initialization error:', error);
      throw error;
    }

    console.log('Supabase initialized successfully');
  } catch (error) {
    handleError(mapError(error));
    throw error;
  }
};

// 导出基础的数据库操作工具
export const db = {
  // 通用查询方法
  async query(table: string, query: any) {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  },

  // 通用插入方法
  async insert(table: string, data: any) {
    return this.query(table, supabase.from(table).insert(data).select());
  },

  // 通用更新方法
  async update(table: string, query: any, data: any) {
    return this.query(table, supabase.from(table).update(data).match(query));
  },

  // 通用删除方法
  async delete(table: string, query: any) {
    return this.query(table, supabase.from(table).delete().match(query));
  }
};
