/**
 * Textarea component - Multi-line text input
 */

import React from "react";
import styles from "./Textarea.module.css";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${styles.textarea} ${className}`}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
