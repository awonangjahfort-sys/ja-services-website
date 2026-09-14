"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  loadingText,
  style,
  className,
}: {
  children: React.ReactNode;
  loadingText: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={{ ...style, opacity: pending ? 0.6 : 1, cursor: pending ? "not-allowed" : "pointer" }}
    >
      {pending ? loadingText : children}
    </button>
  );
}
