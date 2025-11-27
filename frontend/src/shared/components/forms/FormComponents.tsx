import React from "react";
import type { UseFormRegister, Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import { cn } from "../../utils/helpers";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

/**
 * Base form field props
 */
interface BaseFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
  description?: string;
}

/**
 * Form input component with react-hook-form integration
 */
interface FormInputProps extends BaseFieldProps {
  register?: UseFormRegister<any>;
  control?: Control<any>;
  name: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  validation?: boolean;
  validationState?: "idle" | "checking" | "valid" | "invalid";
  validationMessage?: string;
  showToggle?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  register,
  control,
  name,
  label,
  type = "text",
  placeholder,
  error,
  required,
  disabled,
  autoComplete,
  className,
  description,
  validation = false,
  validationState = "idle",
  validationMessage,
  showToggle = false,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  const getValidationIcon = () => {
    if (!validation || validationState === "idle") return null;

    switch (validationState) {
      case "checking":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "valid":
        return <Check className="w-4 h-4 text-green-500" />;
      case "invalid":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const inputClasses = cn(
    "w-full bg-input border rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-500",
    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
    "transition-all duration-200",
    error
      ? "border-red-500 bg-red-500/5"
      : validation && validationState === "valid"
      ? "border-green-500 bg-green-500/5"
      : validation && validationState === "invalid"
      ? "border-red-500 bg-red-500/5"
      : "border-slate-700 hover:border-slate-600",
    disabled && "opacity-50 cursor-not-allowed",
    ((type === "password" && showToggle) || validation) && "pr-12"
  );

  const renderPasswordToggle = () =>
    type === "password" &&
    showToggle && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    );

  const renderValidationIcon = () =>
    validation &&
    type !== "password" && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {getValidationIcon()}
      </div>
    );

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && <p className="text-xs text-slate-500">{description}</p>}

      {control ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              <input
                {...field}
                type={inputType}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                className={inputClasses}
              />
              {renderPasswordToggle()}
              {renderValidationIcon()}
            </div>
          )}
        />
      ) : (
        <div className="relative">
          <input
            {...(register ? register(name) : {})}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            className={inputClasses}
          />
          {renderPasswordToggle()}
          {renderValidationIcon()}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          {error.message}
        </p>
      )}

      {/* Validation message */}
      {validation && validationMessage && !error && (
        <p
          className={cn(
            "text-sm flex items-start gap-2",
            validationState === "valid" ? "text-green-500" : "text-red-500"
          )}
        >
          {getValidationIcon()}
          {validationMessage}
        </p>
      )}
    </div>
  );
};

/**
 * Password strength indicator component
 */
interface PasswordStrengthProps {
  password: string;
  show?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  show = true,
}) => {
  if (!show || !password) return null;

  const getStrength = () => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "red", width: "33%" };
    if (score <= 4) return { label: "Medium", color: "yellow", width: "66%" };
    return { label: "Strong", color: "green", width: "100%" };
  };

  const strength = getStrength();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">Password strength</span>
        <span
          className={cn(
            "text-xs font-medium",
            strength.color === "red" && "text-red-500",
            strength.color === "yellow" && "text-yellow-500",
            strength.color === "green" && "text-green-500"
          )}
        >
          {strength.label}
        </span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            strength.color === "red" && "bg-red-500",
            strength.color === "yellow" && "bg-yellow-500",
            strength.color === "green" && "bg-green-500"
          )}
          style={{ width: strength.width }}
        />
      </div>
    </div>
  );
};

/**
 * Form checkbox component
 */
interface FormCheckboxProps extends BaseFieldProps {
  register: UseFormRegister<Record<string, unknown>>;
  name: string;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  register,
  name,
  label,
  error,
  required,
  disabled,
  className,
  description,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start gap-3">
        <input
          {...register(name)}
          type="checkbox"
          disabled={disabled}
          className={cn(
            "mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded",
            "focus:ring-blue-500 focus:ring-2",
            error && "border-red-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        <div className="flex-1">
          <label className="text-sm font-medium text-slate-300 cursor-pointer">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-start gap-2 ml-7">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          {error.message}
        </p>
      )}
    </div>
  );
};

/**
 * Form submit button component
 */
interface FormButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const FormButton: React.FC<FormButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  onClick,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-slate-200 focus:ring-slate-500",
    outline:
      "border border-slate-600 hover:bg-slate-700 text-slate-200 focus:ring-slate-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
