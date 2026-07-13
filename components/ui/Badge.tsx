import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "eyebrow"
  | "primary"
  | "success"
  | "personal"
  | "detail"
  | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Optional leading icon (inline SVG). */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  variant = "primary",
  icon,
  children,
  className,
  ...rest
}: BadgeProps) {
  const isEyebrow = variant === "eyebrow";
  const classes = [
    isEyebrow ? styles.eyebrow : styles.badge,
    isEyebrow ? undefined : styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
