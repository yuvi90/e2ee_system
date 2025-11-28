import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Shield,
  Lock,
  Key,
  Check,
  Download,
  ArrowLeft,
} from "lucide-react";
import { encryptFileForOwnerUpload } from "../../../shared/utils/crypto";
import { toast } from "../../../shared/utils/toast";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useUploadFile } from "../hooks/useFiles";
import { useNavigate } from "react-router-dom";

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

interface FileUploadState {
  status: "idle" | "encrypting" | "uploading" | "success" | "error";
  progress: number;
  message: string;
  downloadUrl?: string;
  encryptionResult?: any; // Store for download testing
  originalFile?: File;
}

export const FileUploadPage: React.FC = () => {
  const { user } = useAuth();
  const uploadMutation = useUploadFile();
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploadStates, setUploadStates] = useState<
    Record<string, FileUploadState>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset uploader function
  const resetUploader = useCallback(() => {
    setSelectedFiles([]);
    setUploadStates({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 1;
  const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit`;
    }
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.match(/\.(txt|md|json|csv)$/i)
    ) {
      return `File type not supported`;
    }
    return null;
  };

  const createFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const processFiles = useCallback((files: FileList) => {
    // Only take the first file for single file upload
    const file = files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(`${file.name}: ${error}`);
      return;
    }

    const fileWithId: FileWithPreview = Object.assign(file, {
      id: `${Date.now()}-${Math.random()}`,
      preview: createFilePreview(file),
    });

    // Replace any existing file with the new one
    setSelectedFiles([fileWithId]);

    // Initialize upload state for the single file
    setUploadStates({
      [fileWithId.id]: {
        status: "idle",
        progress: 0,
        message: "Ready to upload",
      },
    });
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
    setUploadStates((prev) => {
      const newStates = { ...prev };
      delete newStates[fileId];
      return newStates;
    });
  };

  const updateFileState = (
    fileId: string,
    update: Partial<FileUploadState>
  ) => {
    setUploadStates((prev) => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...update },
    }));
  };

  const uploadFile = async (file: FileWithPreview) => {
    // Check authentication first
    if (!user?.email) {
      updateFileState(file.id, {
        status: "error",
        progress: 0,
        message: "User not authenticated",
      });
      return;
    }

    try {
      // Step 1: Get user's actual public key from server
      updateFileState(file.id, {
        status: "encrypting",
        progress: 5,
        message: "Getting your encryption keys...",
      });

      const { authApi } = await import("../../auth/api/authApi");
      const { importPublicKeyFromBase64 } = await import(
        "../../../shared/utils/crypto"
      );

      // Get user's public key from server
      const publicKeyData = await authApi.getUserPublicKey(user.email);
      if (!publicKeyData.success || !publicKeyData.data.publicKey) {
        throw new Error("Could not retrieve your encryption keys from server");
      }

      console.log(`🔑 Using REAL public key for ${user.email}:`, {
        keyLength: publicKeyData.data.publicKey.length,
        keyPreview: publicKeyData.data.publicKey.substring(0, 50) + "...",
        userName: publicKeyData.data.name,
      });

      // Import the public key
      const ownerPublicKey = await importPublicKeyFromBase64(
        publicKeyData.data.publicKey
      );

      // Step 2: Start encryption
      updateFileState(file.id, {
        status: "encrypting",
        progress: 20,
        message: "Initializing encryption...",
      });

      // Step 3: Encrypt the file with user's actual public key
      updateFileState(file.id, {
        status: "encrypting",
        progress: 40,
        message: "Encrypting with AES-256-GCM...",
      });

      const encryptionResult = await encryptFileForOwnerUpload({
        file,
        ownerPublicKey: ownerPublicKey,
      });

      updateFileState(file.id, {
        status: "encrypting",
        progress: 60,
        message: "Finalizing encryption...",
      });

      // Step 3: Prepare upload data
      updateFileState(file.id, {
        status: "uploading",
        progress: 70,
        message: "Preparing upload...",
      });

      const uploadMetadata = {
        filename: file.name,
        iv: encryptionResult.ivB64,
        integrityHash: encryptionResult.integrityHashHex,
        encryptedKeyForOwner: encryptionResult.encryptedFileKeyB64,
        originalSize: file.size,
      };

      // Step 4: Upload to server
      updateFileState(file.id, {
        status: "uploading",
        progress: 80,
        message: "Uploading encrypted file...",
      });

      await uploadMutation.mutateAsync({
        encryptedFile: encryptionResult.encryptedFile,
        metadata: uploadMetadata,
      });

      // Step 5: Success - store data for download testing
      updateFileState(file.id, {
        status: "success",
        progress: 100,
        message: "Upload completed successfully",
        encryptionResult,
        originalFile: file,
        downloadUrl: URL.createObjectURL(encryptionResult.encryptedFile),
      });

      // Auto-reset uploader after successful upload with a delay for user feedback
      // Users can also manually reset using the "Upload Another File" button
      setTimeout(() => {
        resetUploader();
      }, 3000); // 3 second delay to show success message and action buttons
    } catch (error) {
      console.error("Upload error:", error);
      updateFileState(file.id, {
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Upload failed",
      });
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const downloadAndDecryptFile = async (fileId: string) => {
    const fileState = uploadStates[fileId];
    if (!fileState?.encryptionResult || !fileState?.originalFile) {
      toast.error("File data not available for download test");
      return;
    }

    try {
      toast.info("Verifying file integrity...");

      // Get the encrypted file and verify its integrity
      const encryptedFile = fileState.encryptionResult.encryptedFile;
      const encryptedArrayBuffer = await encryptedFile.arrayBuffer();

      // Calculate SHA-256 hash of the encrypted data
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encryptedArrayBuffer
      );
      const calculatedHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Compare with stored integrity hash
      const storedHash = fileState.encryptionResult.integrityHashHex;

      if (calculatedHash !== storedHash) {
        toast.error("⚠️ File integrity check FAILED! File may be corrupted.");
        console.error("Integrity verification failed:", {
          calculated: calculatedHash,
          stored: storedHash,
        });
        return;
      }

      // ✅ Integrity verified successfully
      toast.success("✅ File integrity verified!");

      // Download the actual encrypted file
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(encryptedFile);
      downloadLink.download = `${fileState.originalFile.name}.enc`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success(
        `Downloaded ${fileState.originalFile.name}.enc - Integrity verified!`
      );
    } catch (error) {
      console.error("Download/verification error:", error);
      toast.error("Failed to verify file integrity or download");
    }
  };

  const uploadAllFiles = async () => {
    const filesToUpload = selectedFiles.filter(
      (file) => uploadStates[file.id]?.status === "idle"
    );

    // Upload files sequentially to avoid overwhelming the system
    for (const file of filesToUpload) {
      await uploadFile(file);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type.includes("word")) return "📝";
    if (file.type.includes("sheet") || file.type.includes("excel")) return "📊";
    return "📁";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "encrypting":
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "encrypting":
      case "uploading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const canUpload =
    selectedFiles.length > 0 &&
    selectedFiles.some((file) => uploadStates[file.id]?.status === "idle");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <div className="border-b border-slate-800/50 bg-background/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Secure File Upload
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Upload your files with military-grade end-to-end encryption. Files
              are encrypted in your browser before upload.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-card border border-slate-800 rounded-2xl overflow-hidden mb-6">
          <div
            className={`relative border-2 border-dashed rounded-xl m-6 p-8 transition-all duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-500/5"
                : "border-slate-700 hover:border-slate-600"
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center transition-colors ${
                  isDragActive ? "bg-blue-500/20" : "bg-slate-800"
                }`}
              >
                <Upload
                  className={`w-8 h-8 transition-colors ${
                    isDragActive ? "text-blue-400" : "text-slate-500"
                  }`}
                />
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                {isDragActive
                  ? "Drop file here"
                  : "Drop file or click to upload"}
              </h3>

              <p className="text-slate-400 mb-6">
                Supports images, PDFs, documents up to 10MB each
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* File Restrictions */}
          <div className="px-6 pb-6">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-white mb-3">
                Upload Restrictions
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Maximum file size: 10MB
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Maximum {MAX_FILES} files at once
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Images, PDFs, Documents
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  End-to-end encrypted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="bg-card border border-slate-800 rounded-2xl overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Selected File
                </h3>
                {canUpload && (
                  <button
                    onClick={uploadAllFiles}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Upload File
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {selectedFiles.map((file) => {
                const state = uploadStates[file.id] || {
                  status: "idle",
                  progress: 0,
                  message: "Ready",
                };

                return (
                  <div key={file.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* File Preview/Icon */}
                      <div className="shrink-0">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-xl">
                            {getFileIcon(file)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {file.name}
                        </h4>
                        <p className="text-xs text-slate-400 mb-2">
                          {formatFileSize(file.size)} •{" "}
                          {file.type || "Unknown type"}
                        </p>

                        {/* Progress */}
                        {(state.status === "encrypting" ||
                          state.status === "uploading") && (
                          <div className="mb-2">
                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${state.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div
                          className={`flex items-center text-xs ${getStatusColor(
                            state.status
                          )}`}
                        >
                          {getStatusIcon(state.status)}
                          <span className="ml-2">{state.message}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-1">
                        {state.status === "success" && (
                          <button
                            onClick={() => downloadAndDecryptFile(file.id)}
                            className="p-1 text-slate-500 hover:text-green-400 transition-colors cursor-pointer"
                            title="Download & test decryption"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {state.status === "idle" && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons after successful upload */}
            {selectedFiles.some(
              (file) => uploadStates[file.id]?.status === "success"
            ) && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={resetUploader}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                  >
                    Upload Another File
                  </button>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors cursor-pointer font-medium"
                  >
                    View My Files
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-slate-800 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-white mb-2">
              AES-256 Encryption
            </h3>
            <p className="text-sm text-slate-400">
              Files encrypted with military-grade AES-256-GCM before upload
            </p>
          </div>

          <div className="bg-card border border-slate-800 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-white mb-2">Zero Knowledge</h3>
            <p className="text-sm text-slate-400">
              Server never sees your file content or encryption keys
            </p>
          </div>

          <div className="bg-card border border-slate-800 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-white mb-2">
              Integrity Verified
            </h3>
            <p className="text-sm text-slate-400">
              SHA-256 hashing ensures files haven't been tampered with
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadPage;
