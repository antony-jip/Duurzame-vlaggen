import type { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export type CardElevation = "flat" | "default" | "raised";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  elevation?: CardElevation;
  /** Enable the lift-on-hover interaction. */
  hover?: boolean;
  as?: ElementType;
  children: ReactNode;
}

const elevationClass: Record<CardElevation, string | undefined> = {
  flat: styles.flat,
  default: undefined,
  raised: styles.raised,
};

export function Card({
  elevation = "default",
  hover = false,
  as: Tag = "div",
  children,
  className,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    elevationClass[elevation],
    hover ? styles.hover : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
