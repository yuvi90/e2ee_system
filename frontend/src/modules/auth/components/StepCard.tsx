import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../../shared/utils/helpers";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  children: React.ReactNode;
  className?: string;
}

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  isCompleted,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-500",
        "bg-card border-slate-700 shadow-2xl shadow-black/50",
        className
      )}
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8">
          <div
            className={cn(
              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300",
              isCompleted
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 text-white"
            )}
          >
            {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed max-w-xl">
              {description}
            </p>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  );
};
