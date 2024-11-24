import { supabase } from '../client';
import { handleError, mapError } from '../../../utils/errorHandler';
import type {
  StorageBucket,
  FileUploadOptions,
  UploadResponse,
  FileMetadata,
  StorageError
} from '../types/storage';

class StorageService {
  private readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  // 验证文件
  private validateFile(
    file: File,
    { maxSize = this.DEFAULT_MAX_SIZE, acceptedTypes = this.DEFAULT_ACCEPTED_TYPES }: Partial<FileUploadOptions>
  ): void {
    if (file.size > maxSize) {
      throw new Error(\`File size exceeds maximum limit of \${maxSize / 1024 / 1024}MB\`);
    }

    if (!acceptedTypes.includes(file.type)) {
      throw new Error(\`File type \${file.type} is not accepted. Accepted types: \${acceptedTypes.join(', ')}\`);
    }
  }

  // 生成唯一文件名
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return \`\${timestamp}-\${randomString}.\${extension}\`;
  }

  // 获取文件URL
  private getFileUrl(bucket: StorageBucket, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // 上传文件
  async uploadFile(
    file: File,
    options: FileUploadOptions
  ): Promise<UploadResponse> {
    try {
      this.validateFile(file, options);

      const { bucket, path = '' } = options;
      const fileName = this.generateUniqueFileName(file.name);
      const fullPath = path ? \`\${path}/\${fileName}\` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const fileUrl = this.getFileUrl(bucket, fullPath);

      return {
        path: fullPath,
        fullPath: \`\${bucket}/\${fullPath}\`,
        fileUrl,
        fileName,
        size: file.size
      };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 删除文件
  async deleteFile(bucket: StorageBucket, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取文件元数据
  async getFileMetadata(bucket: StorageBucket, path: string): Promise<FileMetadata> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('File not found');
      }

      const file = data[0];
      return {
        name: file.name,
        size: file.metadata.size,
        type: file.metadata.mimetype,
        lastModified: new Date(file.metadata.lastModified).getTime()
      };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取签名URL（用于私有文件访问）
  async getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 复制文件
  async copyFile(
    sourceBucket: StorageBucket,
    sourcePath: string,
    destinationBucket: StorageBucket,
    destinationPath: string
  ): Promise<void> {
    try {
      // 先下载
      const { data, error: downloadError } = await supabase.storage
        .from(sourceBucket)
        .download(sourcePath);

      if (downloadError) throw downloadError;

      // 再上传
      const { error: uploadError } = await supabase.storage
        .from(destinationBucket)
        .upload(destinationPath, data, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取文件列表
  async listFiles(
    bucket: StorageBucket,
    path: string = ''
  ): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) throw error;

      return (data || []).map(file => ({
        name: file.name,
        size: file.metadata.size,
        type: file.metadata.mimetype,
        lastModified: new Date(file.metadata.lastModified).getTime()
      }));
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }
}

export const storageService = new StorageService();
