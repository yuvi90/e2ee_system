// Mock file upload API for development/testing
// This simulates the backend endpoint behavior

export const mockFileUploadAPI = async (
  encryptedFile: File,
  metadata: {
    filename: string;
    iv: string;
    integrityHash: string;
    encryptedKeyForOwner: string;
    originalSize: number;
  }
) => {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 2000 + Math.random() * 1000)
  );

  // Simulate occasional failures for testing error handling
  if (Math.random() < 0.1) {
    throw new Error("Network error: Upload failed");
  }

  // Return successful response
  return {
    success: true,
    message: "File uploaded successfully",
    data: {
      fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: metadata.filename,
      uploadedAt: new Date().toISOString(),
    },
  };
};

export const mockGetUploadConfig = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    supportedTypes: [
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
    ],
  };
};
