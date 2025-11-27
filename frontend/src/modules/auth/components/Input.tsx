import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "../../../shared/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helpTooltip?: boolean;
  error?: string;
  success?: boolean;
  isLoading?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helpTooltip,
  error,
  success,
  isLoading,
  className,
  disabled,
  ...props
}) => {
  // Filter out non-HTML props to avoid React warnings
  const { ...inputProps } = props;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-300 block">
            {label}
          </label>
          {helpTooltip && (
            <span
              className="text-slate-500 hover:text-slate-300 cursor-help transition-colors"
              title="Help info"
            >
              <HelpCircle className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          className={cn(
            "w-full bg-input border rounded-lg px-4 py-3 text-slate-200",
            "placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
              : success
              ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
              : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/50",
            className
          )}
          disabled={disabled}
          {...inputProps}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {!isLoading && error && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          {!isLoading && success && !error && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};
