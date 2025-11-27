import { z } from "zod";

/**
 * Authentication form validation schemas using Zod
 * Provides type-safe form validation for all auth-related forms
 */

// Email validation schema (reusable)
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase()
  .transform((email) => email.trim());

// Password validation schema (reusable)
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// Name validation schema
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
  .transform((name) => name.trim());

// Public key validation schema
export const publicKeySchema = z
  .string()
  .min(1, "Public key is required")
  .max(10000, "Public key is too long")
  .regex(/^[A-Za-z0-9+/]+=*$/, "Invalid public key format");

// Step One: Complete user information (email, name, password, passphrase)
export const stepOneSchema = z
  .object({
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    passphrase: z
      .string()
      .min(12, "Passphrase must be at least 12 characters long")
      .max(256, "Passphrase must be less than 256 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Step Two: Key generation (validation only, keys generated automatically)
export const stepTwoSchema = z.object({
  publicKey: publicKeySchema,
  hasBackedUpPrivateKey: z.boolean().refine((val) => val === true, {
    message: "You must backup your private key before continuing",
  }),
});

// Step Three: Key generation (validation only, keys generated automatically)
export const stepThreeSchema = z.object({
  publicKey: publicKeySchema,
  hasBackedUpPrivateKey: z.boolean().refine((val) => val === true, {
    message: "You must backup your private key before continuing",
  }),
});

// Complete registration schema (combines all steps)
export const registrationSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  publicKey: publicKeySchema,
});

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Email availability check schema
export const emailCheckSchema = z.object({
  email: emailSchema,
});

/**
 * TypeScript types derived from schemas
 */
export type StepOneFormData = z.infer<typeof stepOneSchema>;
export type StepTwoFormData = z.infer<typeof stepTwoSchema>;
export type StepThreeFormData = z.infer<typeof stepThreeSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type EmailCheckFormData = z.infer<typeof emailCheckSchema>;

/**
 * Validation helpers
 */
export const validateEmail = (email: string) => {
  const result = emailSchema.safeParse(email);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.issues[0]?.message,
  };
};

export const validatePassword = (password: string) => {
  const result = passwordSchema.safeParse(password);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.issues[0]?.message,
    strength: getPasswordStrength(password),
  };
};

/**
 * Password strength calculator
 */
export const getPasswordStrength = (
  password: string
): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 16) score++;

  if (score <= 2) return { score, label: "Weak", color: "red" };
  if (score <= 4) return { score, label: "Medium", color: "yellow" };
  if (score <= 5) return { score, label: "Strong", color: "green" };
  return { score, label: "Very Strong", color: "emerald" };
};
