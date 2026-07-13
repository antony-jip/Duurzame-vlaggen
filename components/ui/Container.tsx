import type { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./Container.module.css";

export type ContainerVariant = "default" | "medium" | "narrow";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  variant?: ContainerVariant;
  /** Semantic element to render (defaults to div). */
  as?: ElementType;
  children: ReactNode;
}

export function Container({
  variant = "default",
  as: Tag = "div",
  children,
  className,
  ...rest
}: ContainerProps) {
  const classes = [styles.container, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
