import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../db/prismaClient";
import { ENV } from "../../../config/env";
import {
  RegisterInput,
  LoginInput,
  UserResponse,
  JwtPayload,
  LogoutInput,
} from "./auth.types";

export class AuthService {
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  async findUserByPublicKey(publicKey: string) {
    return await prisma.user.findFirst({
      where: { publicKey },
      select: { id: true, email: true },
    });
  }

  async register(data: RegisterInput) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw { status: 409, message: "User with this email already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    try {
      // Create user with all required fields
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          publicKey: data.publicKey,
        },
        select: {
          id: true,
          name: true,
          email: true,
          publicKey: true,
          createdAt: true,
        },
      });

      const tokens = await this.generateTokens(user.id, user.email);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user as UserResponse,
      };
    } catch (error: any) {
      // Handle database constraints
      if (error.code === "P2002") {
        if (error.meta?.target?.includes("email")) {
          throw { status: 409, message: "User with this email already exists" };
        }
        if (error.meta?.target?.includes("publicKey")) {
          throw { status: 409, message: "Public key already in use" };
        }
      }
      throw { status: 500, message: "Failed to create user account" };
    }
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw { status: 401, message: "Invalid credentials" };

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw { status: 401, message: "Invalid credentials" };

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
      },
    };
  }

  private async generateTokens(
    id: number,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign({ id, email }, ENV.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id, email }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify token signature first
      const payload = jwt.verify(refreshToken, ENV.JWT_SECRET) as JwtPayload;

      // Check if token exists in database and is not expired
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw { status: 401, message: "Invalid or expired refresh token" };
      }

      // Delete old refresh token (token rotation)
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: storedToken.user.id,
          name: storedToken.user.name,
          email: storedToken.user.email,
          publicKey: storedToken.user.publicKey,
          createdAt: storedToken.user.createdAt,
        } as UserResponse,
      };
    } catch (error: any) {
      // Clean up any invalid tokens
      if (error.name !== "JsonWebTokenError") {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }
      throw { status: 401, message: "Invalid refresh token" };
    }
  }

  async logout(data: LogoutInput) {
    try {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: data.refreshToken },
      });
      return { message: "Logged out successfully" };
    } catch (error) {
      // Even if token doesn't exist, consider logout successful
      return { message: "Logged out successfully" };
    }
  }

  async logoutAllDevices(userId: number) {
    try {
      // Remove all refresh tokens for the user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      return { message: "Logged out from all devices successfully" };
    } catch (error) {
      throw { status: 500, message: "Failed to logout from all devices" };
    }
  }
}
