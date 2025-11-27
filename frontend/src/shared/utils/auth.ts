// Utility to check if JWT token is valid and not expired
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    // Parse JWT payload (basic check - in production, verify signature server-side)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    return payload.exp && payload.exp > currentTime;
  } catch (error) {
    console.error("Invalid token format:", error);
    return false;
  }
};

// Clear invalid access token from storage
export const clearInvalidToken = (): void => {
  const accessToken = localStorage.getItem("accessToken");

  // If access token is invalid, remove it
  // The axios interceptor will handle refresh token validation
  if (accessToken && !isTokenValid(accessToken)) {
    localStorage.removeItem("accessToken");
  }
};

// Check if user is authenticated (has valid access token)
// Note: We can't check httpOnly cookies from JavaScript
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem("accessToken");

  // Valid access token = authenticated
  if (accessToken && isTokenValid(accessToken)) {
    return true;
  }

  // If no valid access token, we assume unauthenticated
  // The axios interceptor will attempt refresh if there's a valid cookie
  return false;
};

// Logout utility
export const logout = async (): Promise<void> => {
  // Clear local storage first
  localStorage.removeItem("accessToken");
  localStorage.removeItem("register-storage");
  // No need to remove refreshToken since it's in httpOnly cookie

  // Try to invalidate refresh token on server (clears httpOnly cookie)
  try {
    const { authApi } = await import("../../modules/auth/api/authApi");
    await authApi.logout(); // No parameter needed - token is in cookie
  } catch (error) {
    // Ignore server errors during logout - local cleanup is most important
    console.warn("Failed to logout on server:", error);
  }
};
