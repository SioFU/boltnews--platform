// 导出客户端实例和工具
export { supabase, db, initializeSupabase } from './client';

// 导出服务
export { projectService } from './services/project';
export { authService } from './services/auth';
export { storageService } from './services/storage';
export { searchService } from './services/search';

// 导出项目相关类型
export type {
  Project,
  ProjectSubmission,
  ProjectStatus,
  ProjectQuery,
  ProjectStats
} from './types/project';

// 导出认证相关类型
export type {
  UserRole,
  Profile,
  UserWithProfile,
  LoginCredentials,
  SignupData,
  UpdateProfileData,
  AuthState
} from './types/auth';

// 导出存储相关类型
export type {
  StorageBucket,
  FileUploadOptions,
  UploadResponse,
  FileMetadata,
  StorageError
} from './types/storage';

// 导出搜索相关类型
export type {
  SearchOptions,
  SearchResult,
  TextSearchOptions,
  SearchHighlight
} from './types/search';
