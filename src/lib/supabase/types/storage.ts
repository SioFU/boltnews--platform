export type StorageBucket = 'projects' | 'avatars' | 'thumbnails';

export interface FileUploadOptions {
  bucket: StorageBucket;
  path?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[]; // e.g., ['image/jpeg', 'image/png']
}

export interface UploadResponse {
  path: string;
  fullPath: string;
  fileUrl: string;
  fileName: string;
  size: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface StorageError {
  message: string;
  code: string;
  details?: any;
}
