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
    console.log("FileAPI.getUserFiles - Making API call to /files/my-files");
    try {
      const response = await AxiosInstance.get("/files/my-files");
      console.log("FileAPI.getUserFiles - API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("FileAPI.getUserFiles - API error:", error);
      throw error;
    }
  }

  /**
   * Share file with another user
   */
  static async shareFile(
    fileId: string,
    recipientEmail: string,
    encryptedKeyForRecipient: string
  ) {
    const response = await AxiosInstance.post(`/files/${fileId}/share`, {
      recipientEmail,
      encryptedKeyForRecipient,
    });
    return response.data;
  }

  /**
   * Get files shared with current user
   */
  static async getSharedFiles() {
    const response = await AxiosInstance.get("/files/shared-with-me");
    return response.data;
  }

  /**
   * Download and decrypt file
   */
  static async downloadAndDecryptFile(
    fileId: string,
    userEmail: string,
    encryptedKeyForUser: string,
    filename: string,
    iv: string,
    integrityHash: string,
    mimeType?: string
  ) {
    try {
      // Import crypto functions
      const { unwrapFileAESKeyWithRSA, base64ToBuffer } = await import(
        "../../../shared/utils/crypto"
      );
      const { areKeysActivated, getActivatedPrivateKey } = await import(
        "../../../shared/utils/keyManager"
      );

      // Check if encryption keys are activated
      if (!areKeysActivated(userEmail)) {
        throw new Error(
          "Encryption keys not activated. Please log out and log back in with your passphrase."
        );
      }

      const userPrivateKey = getActivatedPrivateKey();
      if (!userPrivateKey) {
        throw new Error(
          "No activated encryption keys found. Please log out and log back in."
        );
      }

      // Step 1: Download encrypted file
      console.log(`Downloading file ${fileId} for user ${userEmail}`);
      const response = await AxiosInstance.get(`/files/${fileId}/download`, {
        responseType: "arraybuffer",
      });
      const encryptedFileBuffer = response.data;

      // Step 2: Extract metadata from response headers
      let metadata;
      try {
        const metadataHeader = response.headers["x-file-metadata"];
        console.log("Metadata header from server:", metadataHeader);

        if (metadataHeader) {
          metadata = JSON.parse(metadataHeader);
          console.log("Parsed metadata:", metadata);
          // Use the encrypted key from the server response (handles both owned and shared files)
          encryptedKeyForUser = metadata.encryptedKeyForOwner;
          iv = metadata.iv;
          integrityHash = metadata.integrityHash;
          filename = metadata.filename;
          console.log("Updated parameters from server metadata");
        } else {
          console.log("No metadata header found, using provided parameters");
        }
      } catch (parseError) {
        console.warn(
          "Could not parse metadata from response headers:",
          parseError
        );
        console.log("Using provided parameters instead");
      }

      // Step 2: Unwrap the file's AES key with enhanced error handling
      console.log("Attempting to decrypt file key...");
      console.log("Encrypted key length:", encryptedKeyForUser.length);
      console.log("User private key algorithm:", userPrivateKey.algorithm);
      console.log("User private key type:", userPrivateKey.type);

      let fileAESKey;
      try {
        fileAESKey = await unwrapFileAESKeyWithRSA(
          encryptedKeyForUser,
          userPrivateKey
        );
        console.log("Successfully decrypted file key");
      } catch (unwrapError) {
        console.error("Download: AES key unwrapping failed:", unwrapError);

        // Let's also try to get more information about the user's stored keys
        try {
          const { getEncryptedPrivateKey } = await import(
            "../../../shared/utils/indexdb"
          );
          const encryptedPrivateKey = await getEncryptedPrivateKey(userEmail);
          console.log(
            "User has encrypted private key stored:",
            !!encryptedPrivateKey
          );

          // Check if we can get any info about the private key
          console.log("Private key details:", {
            algorithm: userPrivateKey.algorithm,
            type: userPrivateKey.type,
            extractable: userPrivateKey.extractable,
            usages: userPrivateKey.usages,
          });
        } catch (debugError) {
          console.warn("Debug info collection failed:", debugError);
        }

        console.log(
          "This suggests the file was encrypted with a different set of encryption keys than what you currently have activated."
        );
        console.log("Possible causes:");
        console.log("1. The file was uploaded on a different device");
        console.log("2. Your encryption keys were regenerated at some point");
        console.log(
          "3. You're trying to access a file that was shared with old keys"
        );

        // Run diagnostics to help debug the issue
        try {
          const { diagnoseKeyMismatch, checkKeyMismatchIssue } = await import(
            "../../../utils/keyDiagnostics"
          );
          await diagnoseKeyMismatch(userEmail);
          await checkKeyMismatchIssue(userEmail, encryptedKeyForUser);
        } catch (diagError) {
          console.error("Diagnostics failed:", diagError);
        }

        const keyMismatchError = new Error(
          "Cannot decrypt this file's encryption key. This file was encrypted with different encryption keys than the ones you're currently using. This can happen when using a different device or if your keys were reset."
        );
        (keyMismatchError as any).isKeyMismatch = true;
        throw keyMismatchError;
      }

      // Step 3: Decrypt the file content
      const ivBuffer = base64ToBuffer(iv);
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBuffer,
        },
        fileAESKey,
        encryptedFileBuffer
      );

      // Step 4: Verify integrity (hash should be calculated on ENCRYPTED data, not decrypted)
      console.log("🔐 Starting integrity verification...");
      console.log("Encrypted buffer size:", encryptedFileBuffer.byteLength);
      console.log("Decrypted buffer size:", decryptedBuffer.byteLength);

      // Import the same hash function used during upload
      const { sha256Hex } = await import("../../../shared/utils/crypto");
      const calculatedHashHex = await sha256Hex(encryptedFileBuffer);

      console.log("Expected integrity hash:", integrityHash);
      console.log("Calculated hash (on encrypted data):", calculatedHashHex);
      console.log("Hashes match:", calculatedHashHex === integrityHash);

      if (calculatedHashHex !== integrityHash) {
        console.error("❌ Integrity verification failed!");
        console.log("The encrypted file doesn't match the expected hash");
        console.log(
          "This could indicate file corruption during storage or transmission"
        );

        throw new Error(
          "File integrity verification failed. File may be corrupted during storage or transmission."
        );
      }

      console.log("✅ Integrity verification passed!");

      // Step 5: Create blob and trigger download
      const blob = new Blob([decryptedBuffer], {
        type: mimeType || "application/octet-stream",
      });

      // Remove .enc extension for download
      const originalFilename = filename.endsWith(".enc")
        ? filename.slice(0, -4)
        : filename;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Step 6: Clear sensitive data from memory
      if (fileAESKey instanceof CryptoKey) {
        // Clear key from memory (browser will handle this)
      }

      return {
        success: true,
        message: "File downloaded and decrypted successfully",
      };
    } catch (error) {
      console.error("Download and decrypt error:", error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string) {
    const response = await AxiosInstance.delete(`/files/${fileId}`);
    return response.data;
  }
}
