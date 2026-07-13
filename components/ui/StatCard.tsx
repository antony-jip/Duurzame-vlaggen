import type { HTMLAttributes } from "react";
import styles from "./StatCard.module.css";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  label: string;
  /** Alternates the label colour between sage-blue and sage-purple. */
  labelTone?: "blue" | "purple";
}

export function StatCard({
  value,
  label,
  labelTone = "blue",
  className,
  ...rest
}: StatCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(" ");
  const labelClass = [
    styles.label,
    labelTone === "purple" ? styles.labelPurple : styles.labelBlue,
  ].join(" ");

  return (
    <div className={classes} {...rest}>
      <span className={labelClass}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
