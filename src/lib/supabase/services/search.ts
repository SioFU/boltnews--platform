import { supabase } from '../client';
import { handleError, mapError } from '../../../utils/errorHandler';
import type { Project } from '../types/project';
import type { Profile } from '../types/auth';
import type {
  SearchOptions,
  SearchResult,
  TextSearchOptions,
  SearchHighlight
} from '../types/search';

class SearchService {
  // 构建全文搜索查询
  private buildTextSearchQuery(table: string, options: TextSearchOptions) {
    const {
      query,
      fields = ['name', 'description'],
      fuzzy = true,
      weights = { name: 1.0, description: 0.5 }
    } = options;

    // 构建权重查询
    const weightedFields = fields.map(field => {
      const weight = weights[field] || 0.5;
      return \`setweight(to_tsvector('english', coalesce(\${field},'')), \${weight})\`;
    });

    // 构建搜索向量
    const searchVector = weightedFields.join(' || ');
    
    // 构建查询向量
    const searchQuery = fuzzy
      ? query.split(' ').map(term => \`\${term}:*\`).join(' & ')
      : query;

    return \`\${searchVector} @@ to_tsquery('english', '\${searchQuery}')\`;
  }

  // 通用搜索方法
  private async search<T>(
    table: string,
    options: SearchOptions
  ): Promise<SearchResult<T>> {
    try {
      const {
        query,
        filters = {},
        limit = 10,
        offset = 0,
        orderBy
      } = options;

      // 构建基础查询
      let dbQuery = supabase
        .from(table)
        .select('*', { count: 'exact' });

      // 添加文本搜索条件
      if (query) {
        const textSearchQuery = this.buildTextSearchQuery(table, options as TextSearchOptions);
        dbQuery = dbQuery.filter('search_vector', 'match', textSearchQuery);
      }

      // 添加过滤条件
      Object.entries(filters).forEach(([key, value]) => {
        dbQuery = dbQuery.eq(key, value);
      });

      // 添加排序
      if (orderBy) {
        dbQuery = dbQuery.order(orderBy.column, {
          ascending: orderBy.ascending ?? true
        });
      }

      // 添加分页
      dbQuery = dbQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery;

      if (error) throw error;

      return {
        items: data as T[],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 搜索项目
  async searchProjects(options: SearchOptions): Promise<SearchResult<Project>> {
    return this.search<Project>('projects', {
      ...options,
      fields: ['name', 'description', 'categories'],
      weights: {
        name: 1.0,
        description: 0.8,
        categories: 0.6
      }
    });
  }

  // 搜索用户档案
  async searchProfiles(options: SearchOptions): Promise<SearchResult<Profile>> {
    return this.search<Profile>('profiles', {
      ...options,
      fields: ['name', 'email'],
      weights: {
        name: 1.0,
        email: 0.5
      }
    });
  }

  // 获取搜索建议
  async getSuggestions(
    prefix: string,
    type: 'projects' | 'profiles' = 'projects',
    limit: number = 5
  ): Promise<string[]> {
    try {
      const field = type === 'projects' ? 'name' : 'name';
      const { data, error } = await supabase
        .from(type)
        .select(field)
        .ilike(field, \`\${prefix}%\`)
        .limit(limit);

      if (error) throw error;

      return data.map(item => item[field]);
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 高亮搜索结果
  highlightMatches(text: string, query: string): SearchHighlight {
    const words = query.toLowerCase().split(' ');
    const matches: string[] = [];
    let highlighted = text;

    words.forEach(word => {
      const regex = new RegExp(\`(\${word})\`, 'gi');
      const matches_ = text.match(regex) || [];
      matches.push(...matches_);
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return {
      field: 'text',
      matches,
      original: text
    };
  }
}

export const searchService = new SearchService();
