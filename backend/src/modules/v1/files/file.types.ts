export interface IFileUploadRequest {
  filename: string;
  iv: string;
  integrityHash: string;
  encryptedKeyForOwner: string;
  originalSize: number;
}

export interface IFileUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    filename: string;
    uploadedAt: string;
  };
}

export interface IFileMetadata {
  id: string;
  filename: string;
  originalSize: number;
  uploadedAt: string;
  integrityHash: string;
  mimeType?: string;
}

export interface IUploadConfig {
  maxFileSize: number;
  maxFiles: number;
  supportedTypes: string[];
}
