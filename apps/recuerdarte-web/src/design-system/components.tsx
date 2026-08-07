import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly pill?: boolean;
  readonly compact?: boolean;
}

export function Button({
  variant = "primary",
  pill = false,
  compact = false,
  className = "",
  ...props
}: ButtonProps) {
  const classes = [
    "ra-button",
    `ra-button--${variant}`,
    pill ? "ra-button--pill" : "",
    compact ? "ra-button--compact" : "",
    className,
  ].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
}

export function IconButton({ label, className = "", children, ...props }: IconButtonProps) {
  return (
    <button className={["ra-icon-button", className].filter(Boolean).join(" ")} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function Surface({ className = "", children, ...props }: SurfaceProps) {
  return <div className={["ra-surface", className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}
