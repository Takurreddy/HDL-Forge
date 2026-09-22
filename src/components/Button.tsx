import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707] disabled:pointer-events-none disabled:opacity-40";

  const variants = {
    primary:
      "bg-accent text-[#070707] hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,217,165,0.25)] font-semibold",
    secondary:
      "border border-border bg-surface text-text-secondary hover:border-border hover:bg-panel hover:text-text-primary",
    ghost: "text-text-muted hover:bg-accent/5 hover:text-text-primary",
    danger: "bg-error/10 text-error hover:bg-error/20 border border-error/20",
  };

  const sizes = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-8 px-4 text-xs gap-2",
    lg: "h-10 px-6 text-sm gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
