import { useQuery } from "@tanstack/react-query";
import { FileAPI } from "../modules/files/api/fileApi";

export const useSharedFiles = () => {
  const token = localStorage.getItem("accessToken");
  console.log("useSharedFiles - Current token:", token ? "exists" : "missing");

  return useQuery({
    queryKey: ["shared-files"],
    queryFn: async () => {
      try {
        console.log("Starting shared files API request...");
        const result = await FileAPI.getSharedFiles();
        console.log("Shared files API success:", result);
        return result;
      } catch (error) {
        console.error("Failed to load shared files:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: true, // Always enable - let axios interceptor handle auth
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
