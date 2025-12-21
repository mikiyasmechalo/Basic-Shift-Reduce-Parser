import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";

  const variants = {
    primary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm",
    secondary:
      "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 shadow-sm",
    danger:
      "bg-transparent border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
