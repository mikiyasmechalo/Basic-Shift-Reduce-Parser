import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...rest
}) => {
  const baseClasses =
    "font-semibold rounded transition-colors duration-150 flex items-center justify-center cursor-pointer";

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 border border-transparent",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const stateClasses =
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "";

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${className}`;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-white rounded-full"></span>
      ) : null}

      <span>{children}</span>
    </button>
  );
};

export default Button;
