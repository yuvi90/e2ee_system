import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../modules/auth/api/authApi";
import { logout as logoutUtil } from "../utils/auth";
import type {
  LoginFormData,
  RegistrationFormData,
} from "../schemas/auth.schemas";

/**
 * Query keys for TanStack Query
 * Centralized key management for consistency
 */
export const authKeys = {
  all: ["auth"] as const,
  emailCheck: (email: string) =>
    [...authKeys.all, "email-check", email] as const,
  user: () => [...authKeys.all, "user"] as const,
} as const;

/**
 * Email availability check hook
 * Debounced query that checks if email is available
 */
export const useEmailAvailability = (
  email: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: authKeys.emailCheck(email),
    queryFn: () => authApi.checkEmail(email),
    enabled: enabled && !!email && email.includes("@"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    select: (data) => ({
      isAvailable: data.data.available,
      exists: data.data.exists,
      email: data.data.email,
    }),
  });
};

/**
 * Registration mutation hook
 * Handles account creation with proper error handling
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegistrationFormData) => authApi.register(data),
    onSuccess: (response) => {
      // Store access token
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
};

/**
 * Login mutation hook
 * Handles user authentication with token management
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (response) => {
      // Store access token
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
};

/**
 * Logout mutation hook
 * Handles secure logout with server communication
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutUtil(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();

      // Navigate to login
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails on server, clear local state
      localStorage.removeItem("accessToken");
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
};

/**
 * Authentication status hook
 * Provides current auth state and utilities
 */
export const useAuth = () => {
  const logoutMutation = useLogout();

  // Get current auth state from access token
  const getAuthState = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return { isAuthenticated: false, user: null };

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp > currentTime) {
        return {
          isAuthenticated: true,
          user: {
            id: payload.id,
            email: payload.email,
            name: payload.name || null,
          },
        };
      }
    } catch (error) {
      console.error("Invalid token format:", error);
    }

    return { isAuthenticated: false, user: null };
  };

  const { isAuthenticated, user } = getAuthState();

  return {
    isAuthenticated,
    user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};

/**
 * Debounced email check hook
 * Combines email validation with availability checking
 */
export const useDebouncedEmailCheck = (email: string, delay: number = 500) => {
  const [debouncedEmail, setDebouncedEmail] = React.useState(email);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, delay);

    return () => clearTimeout(timer);
  }, [email, delay]);

  return useEmailAvailability(
    debouncedEmail,
    debouncedEmail.length > 0 && debouncedEmail.includes("@")
  );
};
