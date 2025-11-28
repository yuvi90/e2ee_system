import { AxiosInstance } from "../../../services/axios";

export interface EmailCheckResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    exists: boolean;
    available: boolean;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  publicKey: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    // refreshToken is now in httpOnly cookie
    user: {
      id: number;
      name: string;
      email: string;
      publicKey: string | null;
      createdAt: string;
    };
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    // refreshToken is now in httpOnly cookie
    user: {
      id: number;
      name: string;
      email: string;
      publicKey: string | null;
      createdAt: string;
    };
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    // refreshToken is now in httpOnly cookie
    user: {
      id: number;
      name: string;
      email: string;
      publicKey: string | null;
      createdAt: string;
    };
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export const authApi = {
  checkEmail: async (email: string): Promise<EmailCheckResponse> => {
    const response = await AxiosInstance.post("/auth/check-email", { email });
    return response.data;
  },

  checkUserExists: async (
    email: string
  ): Promise<{ exists: boolean; hasKeys: boolean; message: string }> => {
    const response = await AxiosInstance.post("/auth/check-user-exists", {
      email,
    });
    return response.data;
  },

  getUserPublicKey: async (
    email: string
  ): Promise<{
    success: boolean;
    data: {
      email: string;
      name: string;
      publicKey: string;
    };
  }> => {
    const response = await AxiosInstance.get(`/auth/user/${email}/public-key`);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await AxiosInstance.post("/auth/register", data);
    return response.data;
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    // No need to send refresh token - it's in httpOnly cookie
    const response = await AxiosInstance.post("/auth/refresh-token", {});
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await AxiosInstance.post("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    // No need to send refresh token - it's in httpOnly cookie
    const response = await AxiosInstance.post("/auth/logout", {});
    return response.data;
  },
};
