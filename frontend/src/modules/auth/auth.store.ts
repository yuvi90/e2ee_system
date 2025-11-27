import { create } from "zustand";

export interface User {
  name: string;
  email: string;
  isVerified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  isAuthenticated: false,

  login: (user) => ({ user, isAuthenticated: true }),
  logout: () => ({ user: null, isAuthenticated: false }),
}));
