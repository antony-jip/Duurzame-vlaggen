import type {
  InputHTMLAttributes,
  ReactNode,
  RefAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import styles from "./Field.module.css";

type ControlBase = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: ReactNode;
  errorText?: ReactNode;
  /** Visual state; `errorText` also forces the error state. */
  state?: "default" | "error" | "success";
};

type InputField = ControlBase & {
  as?: "input";
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "required"> &
  RefAttributes<HTMLInputElement>;

type TextareaField = ControlBase & {
  as: "textarea";
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "required"> &
  RefAttributes<HTMLTextAreaElement>;

type SelectField = ControlBase & {
  as: "select";
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "required"> &
  RefAttributes<HTMLSelectElement>;

export type FieldProps = InputField | TextareaField | SelectField;

export function Field(props: FieldProps) {
  const {
    id,
    label,
    required = false,
    helperText,
    errorText,
    state = "default",
    className,
    ...rest
  } = props;

  const resolvedState = errorText ? "error" : state;
  const describedById = errorText
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

  const controlClass = [
    styles.control,
    resolvedState === "error" ? styles.error : undefined,
    resolvedState === "success" ? styles.success : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const shared = {
    id,
    className: controlClass,
    required,
    "aria-invalid": resolvedState === "error" || undefined,
    "aria-describedby": describedById,
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>

      {props.as === "textarea" ? (
        <textarea
          {...shared}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : props.as === "select" ? (
        <select
          {...shared}
          {...(rest as SelectHTMLAttributes<HTMLSelectElement> & {
            children: ReactNode;
          })}
        />
      ) : (
        <input
          {...shared}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {errorText ? (
        <p id={`${id}-error`} className={styles.errorText} role="alert">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
