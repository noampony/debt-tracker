import { forwardRef, type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, className = "", ...props },
  ref,
) {
  const inputId = id ?? `input-${label.replace(/\s+/g, "-")}`;

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} ref={ref} {...props} />
    </label>
  );
});
