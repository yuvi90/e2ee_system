import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../shared/utils/helpers";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  icon,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0E14]";

  const variants = {
    primary:
      "bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20 focus:ring-blue-500",
    secondary:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 focus:ring-emerald-500",
    outline:
      "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 focus:ring-slate-500",
    ghost:
      "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white focus:ring-slate-500",
    destructive:
      "bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon}
      {children}
    </button>
  );
};
