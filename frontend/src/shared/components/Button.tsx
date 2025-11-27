import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary:
      "bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
    ghost:
      "bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/50",
    white: "bg-white text-brand-blue hover:bg-slate-100 shadow-lg",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-6 py-2",
    lg: "h-12 px-8 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        props.disabled ? "cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
