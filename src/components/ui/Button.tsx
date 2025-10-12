import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

export const Button = ({
  size = "md",
  variant = "ghost",
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2",
    lg: "px-4 py-3 text-lg",
  };

  const variantClasses = {
    primary: "bg-[var(--accent-color)] text-white hover:bg-blue-600",
    secondary:
      "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
    ghost: "hover:bg-[var(--hover-bg-color)]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
