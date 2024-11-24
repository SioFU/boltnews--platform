type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 生成缓存键
  static generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => \`\${key}=\${JSON.stringify(value)}\`)
      .join('&');
    
    return \`\${prefix}:\${sortedParams}\`;
  }
}

export const cacheService = new CacheService();
