import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.services";
import { asyncHandler } from "../../../middleware";

const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  publicKey: z
    .string()
    .min(1, "Public key is required")
    .max(10000, "Public key is too long")
    .regex(/^[A-Za-z0-9+/]+=*$/, "Invalid public key format"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const emailCheckSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export class AuthController {
  constructor(private service = new AuthService()) {}

  checkEmail = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
        errors: { body: ["Email is required"] },
      });
    }

    // Validate input schema
    const parsed = emailCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const exists = await this.service.checkEmailExists(parsed.data.email);
      res.status(200).json({
        success: true,
        message: "Email check completed",
        data: {
          email: parsed.data.email,
          exists: exists,
          available: !exists,
        },
      });
    } catch (error: any) {
      // Re-throw for global error handler
      throw error;
    }
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
        errors: { body: ["No data provided"] },
      });
    }

    // Validate input schema
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Check for potential duplicate public key
    if (parsed.data.publicKey) {
      const existingKeyUser = await this.service.findUserByPublicKey(
        parsed.data.publicKey
      );
      if (existingKeyUser) {
        return res.status(409).json({
          success: false,
          message: "Public key already in use",
          errors: {
            publicKey: [
              "This public key is already associated with another account",
            ],
          },
        });
      }
    }

    try {
      const result = await this.service.register(parsed.data);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Cookie available site-wide
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          accessToken: result.accessToken,
          // Don't send refresh token in response body
          user: result.user,
        },
      });
    } catch (error: any) {
      // Handle specific service errors
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          message: error.message,
          errors: { email: ["An account with this email already exists"] },
        });
      }

      // Re-throw for global error handler
      throw error;
    }
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
        errors: { body: ["Email and password are required"] },
      });
    }

    // Validate input schema
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await this.service.login(parsed.data);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      // Handle specific service errors
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          errors: { credentials: ["Email or password is incorrect"] },
        });
      }

      // Re-throw for global error handler
      throw error;
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie instead of body
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found in cookies",
        errors: { refreshToken: ["No refresh token found"] },
      });
    }

    try {
      const result = await this.service.refreshToken(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      // Handle specific service errors
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
          errors: { refreshToken: ["Token is invalid or expired"] },
        });
      }

      // Re-throw for global error handler
      throw error;
    }
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        await this.service.logout({ refreshToken });
      } catch (error) {
        // Continue with logout even if service call fails
        console.warn("Failed to logout on server:", error);
      }
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
}
