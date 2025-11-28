import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileAPI } from "../api/fileApi";
import type { UploadFileRequest } from "../api/fileApi";
import { toast } from "../../../shared/utils/toast";

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      encryptedFile,
      metadata,
    }: {
      encryptedFile: File;
      metadata: UploadFileRequest;
    }) => {
      return FileAPI.uploadEncryptedFile(encryptedFile, metadata);
    },
    onSuccess: (data) => {
      toast.success("File uploaded successfully!");
      console.log("Upload success:", data);

      // Invalidate files queries to refresh the files list
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["userFiles"] });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    },
  });
};

export const useUserFiles = () => {
  return useQuery({
    queryKey: ["userFiles"],
    queryFn: FileAPI.getUserFiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUploadConfig = () => {
  return useQuery({
    queryKey: ["uploadConfig"],
    queryFn: FileAPI.getUploadConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: FileAPI.deleteFile,
    onSuccess: () => {
      toast.success("File deleted successfully!");

      // Invalidate files queries to refresh the files list
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["userFiles"] });
    },
    onError: () => {
      toast.error("Failed to delete file.");
    },
  });
};
