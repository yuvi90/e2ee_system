import React, { useEffect, useRef, useMemo, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { useFiles } from "../../hooks/useFiles";
import {
  MoreVertical,
  Loader2,
  AlertCircle,
  Share2,
  Trash2,
  Users,
  X,
  CheckCircle,
  File,
  Download,
  Key,
} from "lucide-react";
import gsap from "gsap";
import { ShareFileModal } from "../files/components/ShareFileModal";
import { FileAPI } from "../files/api/fileApi";
import { toast } from "../../shared/utils/toast";
import { useAuth } from "../../shared/hooks/useAuth";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to get file type from filename
const getFileType = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "unknown";
};

export const DashboardPage: React.FC = () => {
  const { data: filesResponse, isLoading, isError, refetch } = useFiles();
  const [activeTab, setActiveTab] = useState<"my-files" | "shared-with-me">(
    "my-files"
  );

  // Debug logging
  const { isAuthenticated, user } = useAuth();
  console.log("DashboardPage - Auth state:", { isAuthenticated, user });
  console.log(
    "DashboardPage - Access token:",
    localStorage.getItem("accessToken") ? "exists" : "missing"
  );
  console.log("DashboardPage - useFiles results:", {
    isLoading,
    isError,
    hasFilesResponse: !!filesResponse,
    filesResponse,
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    fileId?: string;
    filename?: string;
    encryptedKeyForOwner?: string;
  }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fileId?: string;
    filename?: string;
  }>({ isOpen: false });
  const [isDownloading, setIsDownloading] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  // Transform API response to match UI expectations
  const files = useMemo(() => {
    console.log("DashboardPage - filesResponse:", filesResponse);

    if (!filesResponse?.success || !filesResponse?.data) {
      console.log("DashboardPage - No files data:", {
        hasResponse: !!filesResponse,
        success: filesResponse?.success,
        hasData: !!filesResponse?.data,
        dataLength: filesResponse?.data?.length,
      });
      return [];
    }

    const transformedFiles = filesResponse.data.map((file: any) => ({
      id: file.id,
      name: `${file.filename}.enc`,
      size: formatFileSize(file.originalSize),
      modified: formatDate(file.createdAt),
      type: getFileType(file.filename),
      originalData: file, // Keep original data for sharing
    }));

    console.log("DashboardPage - Transformed files:", transformedFiles);
    return transformedFiles;
  }, [filesResponse]);
  const listRef = useRef<HTMLDivElement>(null);

  // Check key activation status on mount
  useEffect(() => {
    const checkKeys = async () => {
      if (user?.email) {
        try {
          const { checkKeyActivationStatus, debugKeyActivationFailure } =
            await import("../../utils/keyDiagnostics");
          const status = await checkKeyActivationStatus(user.email);

          if (!status.activated) {
            console.warn("Keys are not activated - debugging the issue...");
            await debugKeyActivationFailure(user.email);
          }
        } catch (error) {
          console.error("Failed to check key status:", error);
        }
      }
    };
    checkKeys();
  }, [user?.email]);

  // Load shared files when tab changes
  useEffect(() => {
    if (activeTab === "shared-with-me") {
      loadSharedFiles();
    }
  }, [activeTab]);

  const loadSharedFiles = async () => {
    setIsLoadingShared(true);
    try {
      const response = await FileAPI.getSharedFiles();
      if (response.success) {
        const transformedSharedFiles = response.data.map((file: any) => ({
          id: file.id,
          name: `${file.filename}.enc`,
          size: formatFileSize(file.originalSize),
          modified: formatDate(file.createdAt),
          type: getFileType(file.filename),
          sharedBy: file.sharedBy,
          originalData: file,
        }));
        setSharedFiles(transformedSharedFiles);
      }
    } catch (error) {
      console.error("Failed to load shared files:", error);
      toast.error("Failed to load shared files");
    } finally {
      setIsLoadingShared(false);
    }
  };

  const handleShareFile = (file: any, originalFileData: any) => {
    setShareModal({
      isOpen: true,
      fileId: file.id,
      filename: file.name.replace(".enc", ""), // Remove .enc for display
      encryptedKeyForOwner: originalFileData.encryptedKeyForOwner,
    });
  };

  const handleShareModalClose = () => {
    setShareModal({ isOpen: false });
  };

  const handleShareSuccess = () => {
    refetch(); // Refresh file list
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
    const currentFiles = activeTab === "my-files" ? files : sharedFiles;
    if (selectedFiles.size === currentFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(currentFiles.map((f) => f.id)));
    }
  };

  const handleDeleteFile = (file: any) => {
    setDeleteModal({
      isOpen: true,
      fileId: file.id,
      filename: file.name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;

    try {
      await FileAPI.deleteFile(deleteModal.fileId);
      toast.success("File deleted successfully");
      refetch();
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteModal.fileId!);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    setIsDownloading(true);
    try {
      // The API will get the correct encrypted key from the backend based on access permissions
      const encryptedKeyForUser =
        file.originalData.encryptedKeyForOwner ||
        file.originalData.encryptedKeyForRecipient;

      await FileAPI.downloadAndDecryptFile(
        file.id,
        user.email,
        encryptedKeyForUser,
        file.originalData.filename || file.name,
        file.originalData.iv,
        file.originalData.integrityHash,
        file.originalData.mimeType
      );

      toast.success("File downloaded and decrypted successfully");
    } catch (error) {
      console.error("Download and decrypt error:", error);

      let message = "Failed to download and decrypt file.";
      if (error instanceof Error) {
        if ((error as any).isKeyMismatch) {
          // Use the detailed key mismatch message
          try {
            import("../../utils/keyRecovery").then(
              ({ getKeyMismatchUserMessage, suggestRecoveryOptions }) => {
                console.log(getKeyMismatchUserMessage());
                suggestRecoveryOptions(user?.email || "");
              }
            );
          } catch (importError) {
            console.error("Failed to load recovery utils:", importError);
          }
          message =
            "Cannot decrypt file - key mismatch detected. This file was encrypted with different keys. Try other files to see if this is isolated. Check console for detailed guidance.";
        } else if (error.message.includes("integrity verification failed")) {
          message = "File integrity check failed. The file may be corrupted.";
        } else if (error.message.includes("No private key found")) {
          message =
            "No encryption keys found. Please ensure your keys are set up properly.";
        } else if (error.message.includes("not activated")) {
          message =
            "Encryption keys not activated. Please log out and log back in.";
        }
      }

      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  }; // Define current data based on active tab
  const currentFiles = activeTab === "my-files" ? files : sharedFiles;
  const currentIsLoading =
    activeTab === "my-files" ? isLoading : isLoadingShared;

  useEffect(() => {
    if (currentFiles && currentFiles.length > 0 && listRef.current) {
      gsap.fromTo(
        ".file-row",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [currentFiles]);

  if (currentIsLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>
            Loading {activeTab === "my-files" ? "your files" : "shared files"}
            ...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError && activeTab === "my-files") {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p className="text-lg font-medium">Failed to load files</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-blue-500 hover:underline"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div
        className="border border-slate-800 rounded-xl overflow-hidden bg-card/50"
        ref={listRef}
      >
        {/* Table Header */}
        <div className="bg-slate-800/50 p-4 grid grid-cols-12 gap-4 text-sm font-medium text-slate-400 border-b border-slate-800/50">
          <div className="col-span-6 flex items-center gap-4">
            <div
              className="w-5 h-5 border border-slate-600 rounded flex items-center justify-center hover:border-slate-500 transition-colors cursor-pointer"
              onClick={selectAllFiles}
            >
              {selectedFiles.size === currentFiles.length &&
                currentFiles.length > 0 && (
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                )}
            </div>
            File Name {activeTab === "shared-with-me" && "& Shared By"}
          </div>
          <div className="col-span-3">Date Modified</div>
          <div className="col-span-2">File Size</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-800/50">
          {currentFiles && currentFiles.length > 0 ? (
            currentFiles.map((file) => (
              <div
                key={file.id}
                className="file-row grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors group opacity-0"
              >
                <div className="col-span-6 flex items-center gap-4">
                  <div className="w-5 h-5 border border-slate-700 rounded hover:border-slate-500 transition-colors cursor-pointer relative">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {selectedFiles.has(file.id) && (
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="text-slate-200 text-sm font-medium group-hover:text-blue-400 transition-colors text-left hover:underline"
                        title="Click to download and decrypt"
                      >
                        <Download className="w-3 h-3 inline-block mr-1" />
                        {file.name}
                      </button>
                      {activeTab === "shared-with-me" && file.sharedBy && (
                        <span className="text-xs text-slate-500">
                          Shared by {file.sharedBy.name || file.sharedBy.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-slate-400">
                  {file.modified}
                </div>
                <div className="col-span-2 text-sm text-slate-400">
                  {file.size}
                </div>
                <div className="col-span-1 flex justify-end gap-2 relative">
                  {activeTab === "my-files" && (
                    <>
                      <button
                        onClick={() => handleShareFile(file, file.originalData)}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Share file"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        disabled={isDownloading}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {activeTab === "shared-with-me" && (
                    <button
                      onClick={() => handleDownloadFile(file)}
                      disabled={isDownloading}
                      className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <div className="relative group/menu">
                    <button className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10 min-w-[120px]">
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              {activeTab === "my-files" ? (
                <>
                  <File className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">
                    No files yet
                  </h3>
                  <p className="text-sm">
                    Upload your first encrypted file to get started
                  </p>
                </>
              ) : (
                <>
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">
                    No shared files
                  </h3>
                  <p className="text-sm">
                    Files shared with you will appear here
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Empty State / Filler for visual matching */}
        {currentFiles &&
          currentFiles.length > 0 &&
          currentFiles.length < 10 && <div className="h-32 bg-transparent" />}
      </div>

      {/* Share File Modal */}
      {shareModal.fileId && (
        <ShareFileModal
          fileId={shareModal.fileId}
          filename={shareModal.filename || ""}
          encryptedKeyForOwner={shareModal.encryptedKeyForOwner || ""}
          isOpen={shareModal.isOpen}
          onClose={handleShareModalClose}
          onSuccess={handleShareSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-semibold text-white">
                  Delete File
                </h2>
              </div>
              <button
                onClick={() => setDeleteModal({ isOpen: false })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-2">
                Are you sure you want to delete this file?
              </p>
              <p className="text-white font-medium bg-slate-800 p-2 rounded">
                {deleteModal.filename}
              </p>
              <p className="text-sm text-red-400 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false })}
                className="flex-1 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
