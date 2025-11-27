export interface JwtPayload {
  id: number;
  email: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  publicKey: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  publicKey: string | null;
  createdAt: Date;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}
