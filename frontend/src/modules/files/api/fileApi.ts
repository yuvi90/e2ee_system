import { AxiosInstance } from "../../../services/axios";
import {
  mockFileUploadAPI,
  mockGetUploadConfig,
} from "../../../mock/fileUploadAPI";

export interface UploadFileRequest {
  filename: string;
  iv: string;
  integrityHash: string;
  encryptedKeyForOwner: string;
  originalSize: number;
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    filename: string;
    uploadedAt: string;
  };
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalSize: number;
  uploadedAt: string;
  integrityHash: string;
}

const USE_MOCK_API = false; // Toggle this for development

export class FileAPI {
  /**
   * Upload encrypted file with metadata
   */
  static async uploadEncryptedFile(
    encryptedFile: File,
    metadata: UploadFileRequest
  ): Promise<UploadFileResponse> {
    if (USE_MOCK_API) {
      // Use mock API for development
      return mockFileUploadAPI(encryptedFile, metadata);
    }

    const formData = new FormData();

    // Add encrypted file with .enc extension
    formData.append("file", encryptedFile, `${metadata.filename}.enc`);

    // Add metadata
    formData.append("filename", metadata.filename);
    formData.append("iv", metadata.iv);
    formData.append("integrityHash", metadata.integrityHash);
    formData.append("encryptedKeyForOwner", metadata.encryptedKeyForOwner);
    formData.append("originalSize", metadata.originalSize.toString());

    const response = await AxiosInstance.post<UploadFileResponse>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  /**
   * Get upload configuration
   */
  static async getUploadConfig() {
    if (USE_MOCK_API) {
      return mockGetUploadConfig();
    }

    const response = await AxiosInstance.get("/files/config");
    return response.data;
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await AxiosInstance.get(`/files/${fileId}/metadata`);
    return response.data;
  }

  /**
   * Download encrypted file
   */
  static async downloadEncryptedFile(fileId: string): Promise<{
    encryptedBlob: Blob;
    metadata: {
      filename: string;
      iv: string;
      encryptedKeyForOwner: string;
      integrityHash: string;
    };
  }> {
    // Get file metadata first
    const metadataResponse = await AxiosInstance.get(
      `/files/${fileId}/metadata`
    );

    // Download encrypted file
    const fileResponse = await AxiosInstance.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });

    return {
      encryptedBlob: fileResponse.data,
      metadata: metadataResponse.data,
    };
  }

  /**
   * Get user's files list
   */
  static async getUserFiles() {
    const response = await AxiosInstance.get("/files/my-files");
    return response.data;
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string) {
    const response = await AxiosInstance.delete(`/files/${fileId}`);
    return response.data;
  }
}
