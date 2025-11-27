import { useQuery } from "@tanstack/react-query";
import { FilesAPI } from "../modules/files/files.api";

export const useFiles = () => {
  // Check if user is authenticated
  const token = localStorage.getItem("accessToken");

  return useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      try {
        console.log("Starting files API request...");
        const result = await FilesAPI.listFiles();
        console.log("Files API success:", result);
        return result;
      } catch (error) {
        console.error("Failed to load files:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: !!token, // Only run query if user has token
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
